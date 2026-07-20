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
  addCollaborator,
} from "../../services/documentApi";

import type { DocumentMetadata } from "../../types/document";

import styles from "./Dashboard.module.css";
import Navbar from "../../components/ui/Navbar/Navbar";
import UserMenu from "../../components/ui/UserMenu";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";


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
  
  const [shareDocument, setShareDocument] =
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

  function handleShare(document: DocumentMetadata) {
    setShareDocument(document);
  }

  async function handleShareConfirm(email: string) {
    if (!shareDocument) return;

    try {
      await addCollaborator(
        shareDocument._id,
        email
      );

      await loadDocuments();

      setShareDocument(null);

    } catch (error) {
      console.error(error);
      setPageError("Failed to share document.");
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
      <Navbar
        rightContent={
          <UserMenu 
            user={{
              name: user?.username ?? "",
              email: user?.email ?? "",
            }}
            onLogout={handleLogout}
          />
        }
      />
      <DocumentModal
        isOpen={isModalOpen}
        title={
          editingDocument
            ? "Rename Document"
            : "Create Document"
        }
        initialValue={editingDocument?.title}
        placeholder="Document title"
        confirmText={
          editingDocument ? "Save" : "Create"
        }
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
      />

      <DocumentModal
        isOpen={shareDocument !== null}
        title="Share Document"
        placeholder="Enter collaborator email"
        inputType="email"
        confirmText="Share"
        onClose={() => setShareDocument(null)}
        onConfirm={handleShareConfirm}
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

      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Documents</h1>
          <p>Your collaborative workspace</p>
        </div>

        <button
          className={styles.createButton}
          onClick={handleCreateClick}
          disabled={creating}
        >
          {creating ? "Creating..." : "New Document"}
        </button>
      </div>

      {loading ? (
        <Spinner label="Loading documents..." />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents"
          description="Create your first collaborative document."
          actionLabel="New Document"
          onAction={handleCreateClick}
        />
      ) : (
        <div className={styles.documents}>
          {documents.map((document) => (
            <DocumentCard
              key={document._id}
              document={document}
              onRename={handleRename}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}