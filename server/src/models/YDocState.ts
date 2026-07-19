import mongoose, { Schema, Document } from 'mongoose';

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
