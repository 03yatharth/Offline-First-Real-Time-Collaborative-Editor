import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import { io, Socket } from 'socket.io-client';
import {
  MESSAGE_SYNC,
  MESSAGE_AWARENESS,
  EVT_JOIN,
  EVT_LEAVE,
  EVT_MESSAGE,
  EVT_SYNCED,
} from '@collab/shared';

type StatusListener = (status: 'connecting' | 'connected' | 'disconnected') => void;
type SyncedListener = (synced: boolean) => void;

/**
 * A minimal, from-scratch equivalent of y-websocket's WebsocketProvider —
 * but carried over Socket.IO instead of a raw WebSocket, and layered on
 * top of y-indexeddb so edits made while offline are queued locally and
 * merged automatically the moment we reconnect.
 *
 * This is the client-side half of the same protocol implemented in
 * server/src/socket/documentSocket.ts. Keep both in sync if you change
 * the message framing.
 */
export class SocketIOProvider {
  public readonly doc: Y.Doc;
  public readonly awareness: awarenessProtocol.Awareness;
  public readonly indexeddb: IndexeddbPersistence;
  public synced = false;

  private socket: Socket;
  private documentId: string;
  private statusListeners = new Set<StatusListener>();
  private syncedListeners = new Set<SyncedListener>();

  constructor(serverUrl: string, documentId: string, doc: Y.Doc) {
    this.doc = doc;
    this.documentId = documentId;
    this.awareness = new awarenessProtocol.Awareness(doc);

    // Offline-first: persist to IndexedDB locally. This is what lets the
    // user keep editing with zero network — Yjs writes go to IndexedDB
    // immediately regardless of socket connectivity, and get replayed
    // to the server automatically once we're back online, merging
    // conflict-free via CRDT semantics (no manual reconciliation needed).
    this.indexeddb = new IndexeddbPersistence(`doc-${documentId}`, doc);

    this.socket = io(serverUrl, { autoConnect: true, transports: ['websocket'] });

    this.socket.on('connect', () => {
      this.emitStatus('connecting');
      this.socket.emit(EVT_JOIN, documentId);
    });

    this.socket.on('disconnect', () => {
      this.setSynced(false);
      this.emitStatus('disconnected');
    });

    this.socket.on(EVT_SYNCED, () => {
      this.emitStatus('connected');
    });

    // --- Incoming sync/awareness traffic from the server ---
    this.socket.on(EVT_MESSAGE, (payload: ArrayBuffer, incomingDocId: string) => {
      if (incomingDocId !== this.documentId) return;

      // payload arrives as an ArrayBuffer over socket.io-client — wrap it
      // directly, do NOT JSON.parse/stringify it anywhere in this path.
      const message = new Uint8Array(payload);
      const decoder = decoding.createDecoder(message);
      const encoder = encoding.createEncoder();
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, encoder, this.doc, this);
          if (encoding.length(encoder) > 1) {
            this.socket.emit(EVT_MESSAGE, encoding.toUint8Array(encoder), this.documentId);
          }
          // First syncStep2 we receive means we're caught up.
          this.setSynced(true);
          break;
        }
        case MESSAGE_AWARENESS: {
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this);
          break;
        }
      }
    });

    // --- Outgoing: local doc changes -> server ---
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin === this) return; // don't echo back updates we just applied FROM the server
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeUpdate(encoder, update);
      this.socket.emit(EVT_MESSAGE, encoding.toUint8Array(encoder), this.documentId);
    });

    // --- Outgoing: local awareness (cursor/presence) changes -> server ---
    this.awareness.on(
      'update',
      ({ added, updated, removed }: { added: number[]; updated: number[]; removed: number[] }, origin: unknown) => {
        if (origin === this) return;
        const changedIds = [...added, ...updated, ...removed];
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          encoder,
          awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedIds)
        );
        this.socket.emit(EVT_MESSAGE, encoding.toUint8Array(encoder), this.documentId);
      }
    );
  }

  onStatus(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  onSynced(listener: SyncedListener) {
    this.syncedListeners.add(listener);
    return () => this.syncedListeners.delete(listener);
  }

  private emitStatus(status: 'connecting' | 'connected' | 'disconnected') {
    this.statusListeners.forEach((l) => l(status));
  }

  private setSynced(value: boolean) {
    if (this.synced === value) return;
    this.synced = value;
    this.syncedListeners.forEach((l) => l(value));
  }

  destroy() {
    this.socket.emit(EVT_LEAVE, this.documentId);
    this.socket.disconnect();
    this.indexeddb.destroy();
    this.awareness.destroy();
  }
}
