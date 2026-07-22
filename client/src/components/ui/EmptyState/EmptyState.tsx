import type { ReactNode } from "react";
import { FileText, type LucideIcon } from "lucide-react";

import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles.container}>
      <div className={styles.icon}>
        <Icon />
      </div>

      <h2 className={styles.title}>{title}</h2>

      <p className={styles.description}>{description}</p>

      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}