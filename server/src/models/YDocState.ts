import mongoose, { Schema, Document } from 'mongoose';

/**
 * We persist the Yjs document as its raw encoded state (a Buffer),
 * NOT as parsed text. This is the standard approach — Y.encodeStateAsUpdate()
 * gives you a binary blob that Y.applyUpdate() can consume directly on
 * next load. Trying to store "the text" separately and reconstruct a
 * Y.Doc from it throws away all CRDT metadata (client IDs, clocks) that
 * make future merges conflict-free.
 */
export interface IYDocState extends Document {
  documentId: string;
  state: Buffer;
  updatedAt: Date;
}

const YDocStateSchema = new Schema<IYDocState>({
  documentId: { type: String, required: true, unique: true, index: true },
  state: { type: Buffer, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const YDocStateModel = mongoose.model<IYDocState>('YDocState', YDocStateSchema);
