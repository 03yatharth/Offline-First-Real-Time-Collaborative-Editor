import { Server, Socket } from 'socket.io';
import * as syncProtocol from 'y-protocols/sync.js';
import * as awarenessProtocol from 'y-protocols/awareness.js';
import * as encoding from 'lib0/encoding.js';
import * as decoding from 'lib0/decoding.js';
import { yDocumentManager } from '../collaboration/YDocumentManager.js';
import Document from "../models/Document.js";
import {
  MESSAGE_SYNC,
  MESSAGE_AWARENESS,
  EVT_JOIN,
  EVT_LEAVE,
  EVT_MESSAGE,
  EVT_SYNCED,
  EVT_JOIN_ERROR,
} from '@collab/shared';
import mongoose from 'mongoose';

const socketAwarenessIds = new Map<string, Set<number>>();

interface RegisteredDocument {
  updateListener: (update: Uint8Array, origin: unknown) => void;
  awarenessListener: (
    changes: {
      added: number[];
      updated: number[];
      removed: number[];
    },
    origin: unknown
  ) => void;
}

const registeredDocuments = new Map<string, RegisteredDocument>();

export function registerDocumentSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    let joinedDocumentId: string | null = null;
    let hasLeftCurrentDocument = false;

    
    socket.on(EVT_JOIN, async (documentId: string) => {
      try{
        if (typeof documentId !== 'string' || !documentId) return;

        joinedDocumentId = documentId;
        hasLeftCurrentDocument = false;

        socket.join(documentId);
        
        socketAwarenessIds.set(socket.id, new Set());
        if (!mongoose.Types.ObjectId.isValid(documentId)) {
          socket.emit(EVT_JOIN_ERROR, "Invalid document.");
          return;
        }
        const document = await Document.findById(documentId);

        if (!document) {
          socket.emit(EVT_JOIN_ERROR, "Document not found.");
          socket.disconnect(true);
          return;
        }

        const hasAccess =
          document.owner.toString() === userId ||
          document.collaborators.some(
            (collaborator) => collaborator.toString() === userId
          );

        if (!hasAccess) {
          socket.emit(EVT_JOIN_ERROR, "Access denied.");
          socket.disconnect(true);
          return;
        }

        const session = await yDocumentManager.getOrCreate(documentId);
        
        if (!registeredDocuments.has(documentId)) {
          const updateListener = (update: Uint8Array, origin: unknown) => {
            
            

            const encoder = encoding.createEncoder();

            encoding.writeVarUint(encoder, MESSAGE_SYNC);
            syncProtocol.writeUpdate(encoder, update);

            const payload = Buffer.from(encoding.toUint8Array(encoder));

            const originSocketId =
              typeof origin === 'string' ? origin : undefined;
            
            if (originSocketId) {

              io.to(documentId)
                .except(originSocketId)
                .emit(EVT_MESSAGE, payload, documentId);
            } else {
              io.to(documentId).emit(EVT_MESSAGE, payload, documentId);
            }
          };

          const awarenessListener = (
            changes: {
              added: number[];
              updated: number[];
              removed: number[];
            },
            origin: unknown
          ) => {
            const changedIds = [
              ...changes.added,
              ...changes.updated,
              ...changes.removed,
            ];

            if (changedIds.length === 0) return;

            const encoder = encoding.createEncoder();

            encoding.writeVarUint(encoder, MESSAGE_AWARENESS);
            encoding.writeVarUint8Array(
              encoder,
              awarenessProtocol.encodeAwarenessUpdate(
                session.awareness,
                changedIds
              )
            );

            const payload = Buffer.from(encoding.toUint8Array(encoder));

            const originSocketId =
              typeof origin === 'string' ? origin : undefined;

            if (originSocketId) {
              io.to(documentId)
                .except(originSocketId)
                .emit(EVT_MESSAGE, payload, documentId);
            } else {
              io.to(documentId).emit(EVT_MESSAGE, payload, documentId);
            }
          };
          session.doc.on("update", updateListener);
          
          session.awareness.on("update", awarenessListener);

          registeredDocuments.set(documentId, {
            updateListener,
            awarenessListener,
          });
        }

        yDocumentManager.addConnection(documentId);

        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, MESSAGE_SYNC);
        syncProtocol.writeSyncStep1(encoder, session.doc);

        const packet = encoding.toUint8Array(encoder);

        

        socket.emit(
          EVT_MESSAGE,
          Buffer.from(packet),
          documentId
        );

        const states = session.awareness.getStates();

        if (states.size > 0) {
          const awarenessEncoder = encoding.createEncoder();

          encoding.writeVarUint(awarenessEncoder, MESSAGE_AWARENESS);
          encoding.writeVarUint8Array(
            awarenessEncoder,
            awarenessProtocol.encodeAwarenessUpdate(
              session.awareness,
              Array.from(states.keys())
            )
          );

          socket.emit(
            EVT_MESSAGE,
            Buffer.from(encoding.toUint8Array(awarenessEncoder)),
            documentId
          );
        }

      
    }
    catch(error){
      socket.emit(EVT_JOIN_ERROR, "Unable to open document.");

    }
    });

    socket.on(
      EVT_MESSAGE,
      async (payload: ArrayBuffer | Buffer, documentId: string) => {
        if (!documentId) return;

        const session = await yDocumentManager.getOrCreate(documentId);

        const message =
          payload instanceof Buffer
            ? new Uint8Array(payload)
            : new Uint8Array(payload);

        const decoder = decoding.createDecoder(message);
        const encoder = encoding.createEncoder();

        const messageType = decoding.readVarUint(decoder);

        switch (messageType) {
          case MESSAGE_SYNC: {
            encoding.writeVarUint(encoder, MESSAGE_SYNC);
            
            
            syncProtocol.readSyncMessage(
                decoder,
                encoder,
                session.doc,
                socket.id
            );

            if (encoding.length(encoder) > 1) {

                socket.emit(
                    EVT_MESSAGE,
                    encoding.toUint8Array(encoder),
                    documentId
                );

            }

            break;
          }

          case MESSAGE_AWARENESS: {
            const update = decoding.readVarUint8Array(decoder);

            awarenessProtocol.applyAwarenessUpdate(
              session.awareness,
              update,
              socket.id
            );

            const ids = socketAwarenessIds.get(socket.id) ?? new Set<number>();

            decodeAwarenessClientIds(update).forEach((id) => ids.add(id));

            socketAwarenessIds.set(socket.id, ids);

            break;
          }

          default:
            console.warn(
              `[documentSocket] Unknown message type: ${messageType}`
            );
        }
      }
    );

    socket.on(EVT_LEAVE, async (documentId: string) => {
      if (hasLeftCurrentDocument) return;

      hasLeftCurrentDocument = true;
      joinedDocumentId = null;

      await leaveDocument(documentId);
    });

    socket.on("disconnect", async () => {
      if (!joinedDocumentId) return;
      if (hasLeftCurrentDocument) return;

      hasLeftCurrentDocument = true;

      const docId = joinedDocumentId;
      joinedDocumentId = null;

      await leaveDocument(docId);
    });

    async function leaveDocument(documentId: string) {
      socket.leave(documentId);

      const session = await yDocumentManager.getOrCreate(documentId);

      const ownedIds = socketAwarenessIds.get(socket.id);

      if (ownedIds && ownedIds.size > 0) {
        awarenessProtocol.removeAwarenessStates(
          session.awareness,
          Array.from(ownedIds),
          socket.id
        );
      }

      socketAwarenessIds.delete(socket.id);

      const destroyed = await yDocumentManager.removeConnection(documentId);

      if (destroyed) {
        const listeners = registeredDocuments.get(documentId);

        if (listeners) {
          session.doc.off("update", listeners.updateListener);
          session.awareness.off("update", listeners.awarenessListener);

          registeredDocuments.delete(documentId);
        }
      }
    }
  });
}

function decodeAwarenessClientIds(update: Uint8Array): number[] {
  const decoder = decoding.createDecoder(update);

  const numClients = decoding.readVarUint(decoder);

  const ids: number[] = [];

  for (let i = 0; i < numClients; i++) {
    ids.push(decoding.readVarUint(decoder));
    decoding.readVarUint(decoder);
    decoding.readVarString(decoder);
  }

  return ids;
}