import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { YDocStateModel } from '../models/YDocState.js';

const PERSIST_DEBOUNCE_MS = 2000;

interface DocSession {
  doc: Y.Doc;
  awareness: Awareness;
  connectionCount: number;
  saveTimeout: NodeJS.Timeout | null;
}

/**
 * Singleton in-memory registry of "live" Yjs documents.
 *
 * One Y.Doc per documentId is shared across ALL connected sockets editing
 * that document — this is what makes the CRDT merges correct. Every
 * socket's local updates get applied to this SAME doc instance, and the
 * doc's 'update' event is what we broadcast out to other sockets.
 *
 * We load from Mongo lazily (first time a document is joined) and persist
 * with a debounce so we're not hitting the DB on every keystroke.
 */
class YDocumentManager {
  private sessions = new Map<string, DocSession>();

  /**
   * @param onDocUpdate   fired ONLY the first time this doc is created —
   *                      wire your socket.io broadcast here. We don't want
   *                      N listeners stacking up if N clients join.
   * @param onAwarenessUpdate  same idea, for presence/cursor broadcast.
   */
  async getOrCreate(
    documentId: string,
    onDocUpdate?: (update: Uint8Array, origin: unknown) => void,
    onAwarenessUpdate?: (
      changes: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => void
  ): Promise<DocSession> {
    let session = this.sessions.get(documentId);
    if (session) return session;

    const doc = new Y.Doc();
    const awareness = new Awareness(doc);

    // Load persisted state, if any, BEFORE wiring up the update listener
    // so the initial load doesn't trigger an immediate re-save.
    const saved = await YDocStateModel.findOne({ documentId }).lean();
    if (saved?.state) {
      try {
        Y.applyUpdate(doc, new Uint8Array(saved.state));
      } catch (err) {
        // Corrupt/incompatible stored state should never crash the server —
        // log it and start fresh rather than taking the document down.
        console.error(`[YDocumentManager] Failed to apply saved state for ${documentId}:`, err);
      }
    }

    session = { doc, awareness, connectionCount: 0, saveTimeout: null };
    this.sessions.set(documentId, session);

    if (onDocUpdate) doc.on('update', onDocUpdate);
    if (onAwarenessUpdate) awareness.on('update', onAwarenessUpdate);

    doc.on('update', () => {
      this.scheduleSave(documentId, session!);
    });

    return session;
  }

  private scheduleSave(documentId: string, session: DocSession) {
    if (session.saveTimeout) clearTimeout(session.saveTimeout);
    session.saveTimeout = setTimeout(async () => {
      const state = Buffer.from(Y.encodeStateAsUpdate(session.doc));
      try {
        await YDocStateModel.updateOne(
          { documentId },
          { $set: { state, updatedAt: new Date() } },
          { upsert: true }
        );
      } catch (err) {
        console.error(`[YDocumentManager] Persist failed for ${documentId}:`, err);
      }
    }, PERSIST_DEBOUNCE_MS);
  }

  addConnection(documentId: string) {
    const session = this.sessions.get(documentId);
    if (session) session.connectionCount++;
  }

  /**
   * Only evict the in-memory doc once nobody is editing it AND we've
   * flushed the latest state to Mongo — otherwise a quick refresh could
   * lose the last few seconds of edits.
   */
  async removeConnection(documentId: string) {
    const session = this.sessions.get(documentId);
    if (!session) return;
    session.connectionCount--;
    if (session.connectionCount <= 0) {
      if (session.saveTimeout) clearTimeout(session.saveTimeout);
      const state = Buffer.from(Y.encodeStateAsUpdate(session.doc));
      try {
        await YDocStateModel.updateOne(
          { documentId },
          { $set: { state, updatedAt: new Date() } },
          { upsert: true }
        );
      } catch (err) {
        console.error(`[YDocumentManager] Final persist failed for ${documentId}:`, err);
      }
      this.sessions.delete(documentId);
    }
  }
}

export const yDocumentManager = new YDocumentManager();
