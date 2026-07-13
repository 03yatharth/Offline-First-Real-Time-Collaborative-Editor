import { Server, Socket } from 'socket.io';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import { yDocumentManager } from '../collaboration/YDocumentManager.js';
import { MESSAGE_SYNC, MESSAGE_AWARENESS, EVT_JOIN, EVT_LEAVE, EVT_MESSAGE, EVT_SYNCED } from '@collab/shared';

// Track which awareness clientIDs belong to which socket, so we can clean
// up cursors/presence immediately on disconnect instead of waiting for
// Yjs's awareness timeout.
const socketAwarenessIds = new Map<string, Set<number>>();

export function registerDocumentSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    let joinedDocumentId: string | null = null;

    socket.on(EVT_JOIN, async (documentId: string) => {
      if (typeof documentId !== 'string' || !documentId) return;

      joinedDocumentId = documentId;
      socket.join(documentId);
      socketAwarenessIds.set(socket.id, new Set());

      // Declared here so both callbacks below can close over it directly —
      // by the time either callback actually fires (on a future doc/awareness
      // change), `session` is guaranteed to be assigned since these are just
      // event listeners, not synchronous calls.
      let session: Awaited<ReturnType<typeof yDocumentManager.getOrCreate>>;

      session = await yDocumentManager.getOrCreate(
        documentId,
        // Broadcast every doc update to everyone in the room EXCEPT the
        // socket whose edit caused it (that socket already has the change
        // locally — echoing it back would waste bandwidth, not cause bugs,
        // since Yjs updates are idempotent, but there's no reason to).
        (update, origin) => {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          syncProtocol.writeUpdate(encoder, update);
          const payload = Buffer.from(encoding.toUint8Array(encoder));

          const originSocketId = typeof origin === 'string' ? origin : undefined;
          if (originSocketId) {
            socket.to(documentId).except(originSocketId).emit(EVT_MESSAGE, payload, documentId);
          } else {
            io.to(documentId).emit(EVT_MESSAGE, payload, documentId);
          }
        },
        (changes, origin) => {
          const changedIds = [...changes.added, ...changes.updated, ...changes.removed];
          if (changedIds.length === 0) return;

          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
          encoding.writeVarUint8Array(
            encoder,
            awarenessProtocol.encodeAwarenessUpdate(session.awareness, changedIds)
          );
          const payload = Buffer.from(encoding.toUint8Array(encoder));

          const originSocketId = typeof origin === 'string' ? origin : undefined;
          if (originSocketId) {
            socket.to(documentId).except(originSocketId).emit(EVT_MESSAGE, payload, documentId);
          } else {
            io.to(documentId).emit(EVT_MESSAGE, payload, documentId);
          }
        }
      );

      yDocumentManager.addConnection(documentId);

      // --- Initial handshake ---
      // Step 1: tell the newly joined client our state vector (syncStep1).
      // The client will reply with syncStep2 containing whatever we're
      // missing, AND we reply to their syncStep1 with our own syncStep2.
      // This two-way exchange is what readSyncMessage does under the hood —
      // we just need to kick it off from the server side too.
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.writeSyncStep1(encoder, session.doc);
      socket.emit(EVT_MESSAGE, Buffer.from(encoding.toUint8Array(encoder)), documentId);

      // Also send current awareness states (other users' cursors) to the
      // newly joined client.
      const states = session.awareness.getStates();
      if (states.size > 0) {
        const awarenessEncoder = encoding.createEncoder();
        encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
        encoding.writeVarUint8Array(
          awarenessEncoder,
          awarenessProtocol.encodeAwarenessUpdate(session.awareness, Array.from(states.keys()))
        );
        socket.emit(EVT_MESSAGE, Buffer.from(encoding.toUint8Array(awarenessEncoder)), documentId);
      }

      socket.emit(EVT_SYNCED, documentId);
    });

    // --- Ongoing sync + awareness traffic ---
    socket.on(EVT_MESSAGE, async (payload: ArrayBuffer | Buffer, documentId: string) => {
      if (!documentId) return;
      const session = await yDocumentManager.getOrCreate(documentId);

      // CRITICAL: Buffer/ArrayBuffer -> Uint8Array must wrap the SAME
      // underlying bytes, not JSON-round-trip them. This is almost
      // certainly what caused the "Unexpected end of array" error —
      // if a Uint8Array gets serialized through JSON anywhere in the
      // pipeline (e.g. console.log through a logger that stringifies,
      // or an accidental socket.emit with `{ data: someUint8Array }`
      // spread into a plain object), you get back `{0:0,1:0,...}` which
      // is NOT the same as the original binary buffer.
      const message = payload instanceof Buffer ? new Uint8Array(payload) : new Uint8Array(payload);

      const decoder = decoding.createDecoder(message);
      const encoder = encoding.createEncoder();
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          encoding.writeVarUint(encoder, MESSAGE_SYNC);
          // readSyncMessage handles syncStep1, syncStep2, AND update
          // sub-messages internally, applying updates to session.doc with
          // origin = socket.id (so our broadcast listener above can skip
          // echoing back to the sender).
          syncProtocol.readSyncMessage(decoder, encoder, session.doc, socket.id);
          // Only emit a reply if readSyncMessage actually wrote something
          // beyond the message-type header (length > 1 byte).
          if (encoding.length(encoder) > 1) {
            socket.emit(EVT_MESSAGE, Buffer.from(encoding.toUint8Array(encoder)), documentId);
          }
          break;
        }
        case MESSAGE_AWARENESS: {
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(session.awareness, update, socket.id);

          // Track which clientIDs this socket owns, decoded from the
          // update itself, so we can clear them on disconnect.
          const ids = socketAwarenessIds.get(socket.id) ?? new Set<number>();
          decodeAwarenessClientIds(update).forEach((id) => ids.add(id));
          socketAwarenessIds.set(socket.id, ids);
          break;
        }
        default:
          console.warn(`[documentSocket] Unknown message type: ${messageType}`);
      }
    });

    socket.on(EVT_LEAVE, async (documentId: string) => {
      await leaveDocument(documentId);
    });

    socket.on('disconnect', async () => {
      if (joinedDocumentId) await leaveDocument(joinedDocumentId);
    });

    async function leaveDocument(documentId: string) {
      socket.leave(documentId);
      const session = await yDocumentManager.getOrCreate(documentId);

      const ownedIds = socketAwarenessIds.get(socket.id);
      if (ownedIds && ownedIds.size > 0) {
        awarenessProtocol.removeAwarenessStates(session.awareness, Array.from(ownedIds), socket.id);
      }
      socketAwarenessIds.delete(socket.id);

      await yDocumentManager.removeConnection(documentId);
    }
  });
}

/**
 * Awareness update payloads are themselves a small encoded structure:
 * a varUint count, followed by (clientID, clock, stateJSON) triples.
 * We just need the clientIDs out of it for cleanup bookkeeping.
 */
function decodeAwarenessClientIds(update: Uint8Array): number[] {
  const decoder = decoding.createDecoder(update);
  const numClients = decoding.readVarUint(decoder);
  const ids: number[] = [];
  for (let i = 0; i < numClients; i++) {
    ids.push(decoding.readVarUint(decoder));
    decoding.readVarUint(decoder); // clock
    const stateJson = decoding.readVarString(decoder);
    if (stateJson === 'null') {
      // removed state — still counts as "owned" for cleanup purposes
    }
  }
  return ids;
}
