import mongoose , {Schema,model} from "mongoose";

interface IDocument{
    title : string,
    content : string,
    owner : string,
    isPublic : Boolean,
    lastOpenedAt : Date,
    version: number,
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
      type: String,
      required: true,
    },

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

export default Document;