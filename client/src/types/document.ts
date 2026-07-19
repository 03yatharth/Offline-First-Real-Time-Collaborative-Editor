export interface Document {
  _id: string;
  title: string;
  content: string;
  owner: string;
  isPublic: boolean;
  lastOpenedAt: string;
  createdAt: string;
  updatedAt: string;
  version : number
}

export interface DocumentMetadata {
  _id: string;
  title: string;
  owner: string;
  isPublic: boolean;
  lastOpenedAt: string;
  createdAt: string;
  updatedAt: string;
}