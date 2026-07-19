import { api } from "./api";
import type { DocumentMetadata } from "../types/document";

export function getDocuments(): Promise<DocumentMetadata[]> {
  return api.get<DocumentMetadata[]>("/documents");
}

export function createDocument(
  title: string
): Promise<DocumentMetadata> {
  return api.post<DocumentMetadata>("/documents", {
    title,
  });
}

export function renameDocument(
  id: string,
  title: string
): Promise<DocumentMetadata> {
  return api.patch<DocumentMetadata>(
    `/documents/${id}`,
    {
      title,
    }
  );
}

export function deleteDocument(id: string): Promise<void> {
  return api.delete<void>(`/documents/${id}`);
}