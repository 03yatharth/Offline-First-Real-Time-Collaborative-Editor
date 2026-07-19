import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
} from "../types/auth";
import type { DocumentMetadata } from "../types/document";

import { api } from "./api";

export function register(data: RegisterRequest) {
  return api.post<User>("/auth/register", data);
}

export function login(
  data: LoginRequest
): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", data);
}

export function createDocument(title: string) {
  return api.post<DocumentMetadata>("/documents", {
    title,
  });
}

export function renameDocument(
  id: string,
  title: string
) {
  return api.patch<DocumentMetadata>(
    `/documents/${id}`,
    { title }
  );
}

export function deleteDocument(id: string) {
  return api.delete<void>(`/documents/${id}`);
}