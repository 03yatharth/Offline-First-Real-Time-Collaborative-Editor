  import { useContext, useEffect, useState } from "react";
  import { useNavigate, useParams } from "react-router-dom";

  import { AuthContext } from "../../context/AuthContext";
  import { useYDocument } from "../../hooks/useYDocument";

  import Collaborators from "../../components/Collaborators/Collaborators";
  import TipTapEditor from "../../components/TipTapEditor";

  import {
    getDocumentById,
    renameDocument,
  } from "../../services/documentApi";

  import type { DocumentMetadata } from "../../types/document";

  import styles from "./Editor.module.css";
  import { Pencil, ArrowLeft } from "lucide-react";
import StatusBadge from "../../components/ui/StatusBadge";

  export default function Editor() {
    const { id } = useParams();

    const navigate = useNavigate();

    const auth = useContext(AuthContext);

    const {
      doc,
      provider,
      status,
      synced,
    } = useYDocument(id || "");

    const [document, setDocument] =
      useState<DocumentMetadata | null>(null);

    const [editingTitle, setEditingTitle] =
      useState(false);

    const [titleInput, setTitleInput] =
      useState("");

    useEffect(() => {
      if (!provider || !auth?.user) return;

      provider.awareness.setLocalStateField("user", {
        id: auth.user.id,
        name: auth.user.username,
      });

      return () => {
        provider.awareness.setLocalState(null);
      };
    }, [provider, auth?.user]);

    useEffect(() => {
      function handleJoinError() {
        navigate("/", { replace: true });
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
    }, [navigate]);

    useEffect(() => {
      if (!id || id==undefined) return;

      async function loadDocument() {
        try {
          if (!id || id==undefined) return;
          const data = await getDocumentById(id);

          setDocument(data);
          setTitleInput(data.title);
        } catch (error) {
          console.error(error);
        }
      }

      loadDocument();
    }, [id]);

    if (!id) {
      return <div>Invalid document.</div>;
    }

    const isOwner =
      document?.owner === auth?.user?.id;

    async function saveTitle() {
      if (!id || !document) return;

      const trimmed = titleInput.trim();

      if (!trimmed) {
        setTitleInput(document.title);
        setEditingTitle(false);
        return;
      }

      if (trimmed === document.title) {
        setEditingTitle(false);
        return;
      }

      try {
        const updated = await renameDocument(
          id,
          trimmed
        );

        setDocument(updated);
        setTitleInput(updated.title);
      } catch (error) {
        console.error(error);

        setTitleInput(document.title);
      }

      setEditingTitle(false);
    }
    return (
    <div className={styles.page}>
      {/* Header */}

      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        <div className={styles.titleContainer}>
          {editingTitle ? (
            <input
              autoFocus
              className={styles.titleInput}
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveTitle();

                if (e.key === "Escape") {
                  setTitleInput(document?.title ?? "");
                  setEditingTitle(false);
                }
              }}
            />
          ) : (
            <>
              <h2 className={styles.title}>
                {document?.title ?? "Loading..."}
              </h2>

              {isOwner && (
                <button
                  className={styles.editButton}
                  onClick={() => setEditingTitle(true)}
                  title="Rename document"
                >
                  <Pencil size={16} />
                </button>
              )}
            </>
          )}
        </div>

        <StatusBadge
          status={status}
          synced={synced}
        />
      </div>

      {/* Collaborators */}

      {provider && (
       <div className={styles.collaborators}>
          <Collaborators
            awareness={provider.awareness}
          />
        </div>
      )}

      {/* Editor */}

      <div className={styles.editorContainer}>
        {doc && provider ? (
          <TipTapEditor
            ydoc={doc}
            provider={provider}
          />
        ) : (
          <div className={styles.loading}>
            Connecting...
          </div>
        )}
      </div>
    </div>
  );
}
