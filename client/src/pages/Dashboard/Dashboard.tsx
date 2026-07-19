import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DocumentCard from "../../components/DocumentCard/DocumentCard";
import DocumentModal from "../../components/DocumentModal/DocumentModal";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";

import { useAuth } from "../../hooks/useAuth";

import {
  createDocument,
  deleteDocument,
  getDocuments,
  renameDocument,
} from "../../services/documentApi";

import type { DocumentMetadata } from "../../types/document";

import styles from "./Dashboard.module.css";


export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [joinError, setJoinError] = useState("");

  function isAuthError(error: unknown) {
    return (
      error instanceof Error &&
      error.message === "Invalid or expired token"
    );
  }
  const [pageError, setPageError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<DocumentMetadata | null>(null);

  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentMetadata | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      setLoading(true);

      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error(error);

      if (isAuthError(error)) {
        return;
      }

      setPageError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  }

  function handleCreateClick() {
    setEditingDocument(null);
    setIsModalOpen(true);
  }

  function handleRename(document: DocumentMetadata) {
    setEditingDocument(document);
    setIsModalOpen(true);
  }

  useEffect(() => {
    function handleJoinError(event: Event) {
      const customEvent = event as CustomEvent<{
        message: string;
      }>;

      setJoinError(customEvent.detail.message);
    }

    window.addEventListener(
      "document:join-error",
      handleJoinError
    );

    return () => {
      window.removeEventListener(
        "document:join-error",
        handleJoinError
      );
    };
  }, []);

  async function handleModalConfirm(title: string) {
    try {
      if (editingDocument) {
        const updated = await renameDocument(
          editingDocument._id,
          title
        );

        setDocuments((docs) =>
          docs.map((doc) =>
            doc._id === updated._id ? updated : doc
          )
        );

        setIsModalOpen(false);
        return;
      }

      setCreating(true);

      const document = await createDocument(title);

      setIsModalOpen(false);

      navigate(`/documents/${document._id}`);
    } catch (error) {
      console.error(error);

      if (isAuthError(error)) {
        return;
      }

      setPageError("Failed to save document.");
    } finally {
      setCreating(false);
    }
  }

  function handleDelete(document: DocumentMetadata) {
    setDocumentToDelete(document);
  }

  async function confirmDelete() {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete._id);

      setDocuments((docs) =>
        docs.filter(
          (doc) => doc._id !== documentToDelete._id
        )
      );
    } catch (error) {
      console.error(error);

      if (isAuthError(error)) {
        return;
      }

      setPageError("Failed to delete document.");
    } finally {
      setDocumentToDelete(null);
    }
  }

  function handleLogout() {
    logout();
  }

  useEffect(() => {
    if (!joinError) return;

    const timer = setTimeout(() => {
      setJoinError("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [joinError]);

  useEffect(() => {
    if (!pageError) return;

    const timer = setTimeout(() => {
      setPageError("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [pageError]);

  return (
    <div className={styles.page}>

      <DocumentModal
        isOpen={isModalOpen}
        title={
          editingDocument
            ? "Rename Document"
            : "Create Document"
        }
        initialValue={editingDocument?.title}
        confirmText={
          editingDocument ? "Save" : "Create"
        }
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
      />

      <ConfirmDialog
        isOpen={documentToDelete !== null}
        title="Delete Document"
        message={
          documentToDelete
            ? `Are you sur̥e you want to delete "${documentToDelete.title}"?`
            : ""
        }
        onCancel={() => setDocumentToDelete(null)}
        onConfirm={confirmDelete}
      />

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Offline-First Collaborative Editor</h1>
          <p>
            Welcome, <strong>{user?.username}</strong>
          </p>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            Logout
          </button>

          <button
            className={styles.createButton}
            onClick={handleCreateClick}
            disabled={creating}
          >
            {creating ? "Creating..." : "+ New Document"}
          </button>
        </div>
      </div>

      {joinError && (
        <div className={styles.error}>
          {joinError}
        </div>
      )}

      {pageError && (
        <div className={styles.error}>
          {pageError}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No documents yet</h2>
          <p>Create your first collaborative document.</p>
        </div>
      ) : (
        <div className={styles.documents}>
          {documents.map((document) => (
            <DocumentCard
              key={document._id}
              document={document}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}