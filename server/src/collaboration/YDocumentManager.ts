import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js';
import { YDocStateModel } from '../models/YDocState.js';

const PERSIST_DEBOUNCE_MS = 2000;

export interface DocSession {
  doc: Y.Doc;
  awareness: Awareness;
  connectionCount: number;
  saveTimeout: NodeJS.Timeout | null;
}

class YDocumentManager {
  private sessions = new Map<string, DocSession>();

  async getOrCreate(documentId: string): Promise<DocSession> {
    let session = this.sessions.get(documentId);
    if (session) return session;

    const doc = new Y.Doc();
    const awareness = new Awareness(doc);

    const saved = await YDocStateModel.findOne({ documentId }).lean();

    if (saved?.state) {
      try {
        Y.applyUpdate(doc, new Uint8Array(saved.state));
      } catch (err) {
        console.error(
          `[YDocumentManager] Failed to apply saved state for ${documentId}:`,
          err
        );
      }
    }

    session = {
      doc,
      awareness,
      connectionCount: 0,
      saveTimeout: null,
    };

    this.sessions.set(documentId, session);

    doc.on('update', () => {
      this.scheduleSave(documentId, session!);
    });

    return session;
  }

  private scheduleSave(documentId: string, session: DocSession) {
    if (session.saveTimeout) {
      clearTimeout(session.saveTimeout);
    }

    session.saveTimeout = setTimeout(async () => {
      const state = Buffer.from(Y.encodeStateAsUpdate(session.doc));

      try {
        await YDocStateModel.updateOne(
          { documentId },
          {
            $set: {
              state,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.error(
          `[YDocumentManager] Persist failed for ${documentId}:`,
          err
        );
      }
    }, PERSIST_DEBOUNCE_MS);
  }

  addConnection(documentId: string) {
    const session = this.sessions.get(documentId);
    if (session) {
      session.connectionCount++;
    }
  }

  async removeConnection(documentId: string) {
    const session = this.sessions.get(documentId);
    if (!session) return;

    session.connectionCount--;

    if (session.connectionCount <= 0) {
      if (session.saveTimeout) {
        clearTimeout(session.saveTimeout);
      }

      const state = Buffer.from(Y.encodeStateAsUpdate(session.doc));

      try {
        await YDocStateModel.updateOne(
          { documentId },
          {
            $set: {
              state,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (err) {
        console.error(
          `[YDocumentManager] Final persist failed for ${documentId}:`,
          err
        );
      }

      this.sessions.delete(documentId);
    }
  }
}

export const yDocumentManager = new YDocumentManager();