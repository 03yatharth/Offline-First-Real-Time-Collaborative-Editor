import mongoose, { Schema, model } from "mongoose";
import { HydratedDocument } from "mongoose";

export interface IDocument {
  title: string;
  content: string;
  owner: mongoose.Types.ObjectId;

  collaborators: mongoose.Types.ObjectId[];

  isPublic: boolean;
  lastOpenedAt: Date;
  version: number;
}

const documentSchema = new Schema<IDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    content: {
      type: String,
      default: "",
    },

    version: {
      type: Number,
      default: 0,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    collaborators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],

    isPublic: {
      type: Boolean,
      default: false,
    },

    lastOpenedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Document = model<IDocument>("Document", documentSchema);

export type DocumentModel = HydratedDocument<IDocument>;

export default Document;