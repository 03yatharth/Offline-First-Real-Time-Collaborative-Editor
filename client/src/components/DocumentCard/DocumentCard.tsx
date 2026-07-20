import { useNavigate } from "react-router-dom";
import type { DocumentMetadata } from "../../types/document";

import styles from "./DocumentCard.module.css";
import DropdownMenu from "../ui/DropdownMenu";

interface DocumentCardProps {
  document: DocumentMetadata;
  onRename: (document: DocumentMetadata) => void;
  onDelete: (document: DocumentMetadata) => void;
  onShare: (document: DocumentMetadata) => void;
}

export default function DocumentCard({
  document,
  onRename,
  onDelete,
  onShare,
}: DocumentCardProps) {
  const navigate = useNavigate();

  const updatedAt = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(document.updatedAt));

  return (
    <div className={`card ${styles.card}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{document.title}</h3>

        <DropdownMenu
          items={[
            {
              label: "Rename",
              onClick: () => onRename(document),
            },
            {
              label: "Share",
              onClick: () => onShare(document),
            },
            {
              label: "Delete",
              danger: true,
              onClick: () => onDelete(document),
            },
          ]}
        />
      </div>

      <div className={styles.meta}>
        <span className={styles.label}>Last Updated</span>
        <span>{updatedAt}</span>
      </div>

      <hr className={styles.divider} />

      <div className={styles.footer}>

        <button
          className={styles.openButton}
          onClick={() =>
            navigate(`/documents/${document._id}`)
          }
        >
          Open
        </button>
      </div>
    </div>
  );
}