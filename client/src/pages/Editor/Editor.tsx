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
  <div
    style={{
      maxWidth: 1100,
      margin: "40px auto",
      padding: "0 24px",
    }}
  >
    {/* Header */}

    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
      }}
    >
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
          cursor: "pointer",
          background: "white",
          color : "black",
        }}
      >
        Dashboard
      </button>

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
        }}
      >
        {editingTitle ? (
          <input
            autoFocus
            value={titleInput}
            onChange={(e) =>
              setTitleInput(e.target.value)
            }
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveTitle();
              }

              if (e.key === "Escape") {
                setTitleInput(document?.title ?? "");
                setEditingTitle(false);
              }
            }}
            style={{
              fontSize: 24,
              fontWeight: 600,
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: "6px 12px",
              minWidth: 350,
              textAlign: "center",
            }}
          />
        ) : (
          <>
            <h2
              style={{
                margin: 0,
                fontWeight: 600,
              }}
            >
              {document?.title ?? "Loading..."}
            </h2>

            {isOwner && (
              <button
                onClick={() =>
                  setEditingTitle(true)
                }
                title="Rename document"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ✏️
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
      <div
        style={{
          marginBottom: 16,
        }}
      >
        <Collaborators
          awareness={provider.awareness}
        />
      </div>
    )}

    {/* Editor */}

    <div
      style={{
        background: "#fff",
        border: "1px solid #ddd",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow:
          "0 4px 18px rgba(0,0,0,.08)",
      }}
    >
      {doc && provider ? (
        <TipTapEditor
          ydoc={doc}
          provider={provider}
        />
      ) : (
        <div
          style={{
            padding: 40,
            textAlign: "center",
          }}
        >
          Connecting...
        </div>
      )}
    </div>
  </div>
);
}
function StatusBadge({
  status,
  synced,
}: {
  status: "connecting" | "connected" | "disconnected";
  synced: boolean;
}) {
  const label =
    status === "disconnected"
      ? "Offline — edits saved locally, will sync on reconnect"
      : status === "connecting"
      ? "Connecting..."
      : synced
      ? "Synced"
      : "Syncing...";

  const color =
    status === "disconnected"
      ? "#b45309"
      : status === "connected" && synced
      ? "#15803d"
      : "#6b7280";

  return (
    <span
      style={{
        fontSize: 13,
        color,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}