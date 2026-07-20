import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: "connecting" | "connected" | "disconnected";
  synced: boolean;
}

export default function StatusBadge({
  status,
  synced,
}: StatusBadgeProps) {
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
      className={styles.badge}
      style={{ color }}
    >
      <span
        className={styles.dot}
        style={{ backgroundColor: color }}
      />

      {label}
    </span>
  );
}