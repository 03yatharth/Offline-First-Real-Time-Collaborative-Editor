import { useNavigate } from "react-router-dom";
import type { DocumentMetadata } from "../../types/document";

interface DocumentCardProps {
  document: DocumentMetadata;
  onRename: (document: DocumentMetadata) => void;
  onDelete: (document: DocumentMetadata) => void;
}

export default function DocumentCard({
  document,
  onRename,
  onDelete,
}: DocumentCardProps) {
  const navigate = useNavigate();

  const updatedAt = new Date(document.updatedAt).toLocaleString();

  return (
    <div
      style={{
        border: "1px solid #d1d5db",
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: 8,
        }}
      >
        📄 {document.title}
      </h3>

      <p
        style={{
          marginBottom: 16,
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        Updated {updatedAt}
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <button
          onClick={() => navigate(`/documents/${document._id}`)}
        >
          Open
        </button>

        <button
          onClick={() => onRename(document)}
        >
          Rename
        </button>

        <button
          onClick={() => onDelete(document)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}