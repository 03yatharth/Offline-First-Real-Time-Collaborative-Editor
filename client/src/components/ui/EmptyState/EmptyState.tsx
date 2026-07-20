import { FileText } from "lucide-react";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon}>
        <FileText size={36} />
      </div>

      <h2>{title}</h2>

      <p>{description}</p>

      {actionLabel && onAction && (
        <button
          className={styles.button}
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}