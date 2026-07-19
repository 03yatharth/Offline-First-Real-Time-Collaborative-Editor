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

    if (session) {
      return session;
    }

    const doc = new Y.Doc();
    const awareness = new Awareness(doc);

    const saved = await YDocStateModel.findOne({ documentId });

    if (saved?.state) {
      try {
        Y.applyUpdate(doc, new Uint8Array(saved.state));
        const text = doc.getText("content").toString();

      } catch (err) {
        console.error(
          `[YDocumentManager] Failed to restore document ${documentId}:`,
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
      this.schedulePersist(documentId, session!);
    });

    return session;
  }

  private schedulePersist(documentId: string, session: DocSession) {
    if (session.saveTimeout) {
      clearTimeout(session.saveTimeout);
    }

    session.saveTimeout = setTimeout(async () => {
      session.saveTimeout = null;
      await this.persist(documentId, session);
    }, PERSIST_DEBOUNCE_MS);
  }

  private async persist(documentId: string, session: DocSession) {
    try {
      const state = Buffer.from(Y.encodeStateAsUpdate(session.doc));
      
      await YDocStateModel.updateOne(
        { documentId },
        {
          $set: {
            state,
            updatedAt: new Date(),
          },
        },
        {
          upsert: true,
        }
      );
    } catch (err) {
        console.error(
          `[YDocumentManager] Failed to restore document ${documentId}:`,
          err
        );

        await YDocStateModel.deleteOne({
          documentId,
        });

        console.warn(
          `[YDocumentManager] Deleted corrupted persisted state for ${documentId}`
        );
      }
  }

  addConnection(documentId: string) {
    const session = this.sessions.get(documentId);

    if (!session) return;

    session.connectionCount++;
  }

  async removeConnection(documentId: string): Promise<boolean> {
    const session = this.sessions.get(documentId);

    if (!session) {
      return false;
    }

    session.connectionCount = Math.max(0, session.connectionCount - 1);

    if (session.connectionCount > 0) {
      return false;
    }

    if (session.saveTimeout) {
      clearTimeout(session.saveTimeout);
      session.saveTimeout = null;
    }

    await this.persist(documentId, session);

    session.doc.destroy();
    session.awareness.destroy();

    this.sessions.delete(documentId);

    return true;
  }
}

export const yDocumentManager = new YDocumentManager();