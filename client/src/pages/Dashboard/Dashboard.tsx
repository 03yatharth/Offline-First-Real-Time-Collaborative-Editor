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
import { useToast } from "../../hooks/useToast";


export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toast = useToast();
  const [editingDocument, setEditingDocument] =
  useState<DocumentMetadata | null>(null);

  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentMetadata | null>(null);
  
  const [shareDocument, setShareDocument] =
  useState<DocumentMetadata | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);


  function isAuthError(error: unknown) {
    return (
      error instanceof Error &&
      error.message === "Invalid or expired token"
    );
  }

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

      toast.error(
        "Failed to load documents",
        "Please try again."
      );
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

      toast.error(
        "Unable to join document",
        customEvent.detail.message
      );
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
        toast.success(
          "Document renamed"
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

      toast.error(
        "Failed to save document",
        "Please try again."
      );
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
      toast.success(
        "Collaborator added"
      );
      setShareDocument(null);

    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to share document",
        "Please check the email address."
      );
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
      toast.success(
        "Document deleted"
      );
    } catch (error) {
      console.error(error);

      if (isAuthError(error)) {
        return;
      }

      toast.error(
        "Failed to delete document",
        "Please try again."
      );
    } finally {
      setDocumentToDelete(null);
    }
  }

  function handleLogout() {
    logout();
  }

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
            ? `Are you sure you want to delete "${documentToDelete.title}"?`
            : ""
        }
        onCancel={() => setDocumentToDelete(null)}
        onConfirm={confirmDelete}
      />


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
          action={
            <button
              className={styles.createButton}
              onClick={handleCreateClick}
            >
              New Document
            </button>
          }
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