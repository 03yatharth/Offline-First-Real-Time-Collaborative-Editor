import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

import type { ToastItem } from "./types";
import styles from "./Toast.module.css";

interface ToastProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
}

const AUTO_DISMISS_MS = 3500;

export function Toast({ toast, onRemove }: ToastProps) {
  const [leaving, setLeaving] = useState(false);

  const timerRef = useRef<number>(0);
  const remainingRef = useRef(AUTO_DISMISS_MS);
  const startRef = useRef(0);

  const startTimer = () => {
    startRef.current = Date.now();

    timerRef.current = window.setTimeout(() => {
      handleRemove();
    }, remainingRef.current);
  };

  const pauseTimer = () => {
    clearTimeout(timerRef.current);

    remainingRef.current -= Date.now() - startRef.current;
  };

  const resumeTimer = () => {
    startTimer();
  };

  const handleRemove = () => {
    setLeaving(true);

    window.setTimeout(() => {
      onRemove(toast.id);
    }, 200);
  };

  useEffect(() => {
    startTimer();

    return () => clearTimeout(timerRef.current);
  }, []);

  const Icon = {
    success: CheckCircle2,
    error: CircleAlert,
    warning: TriangleAlert,
    info: Info,
  }[toast.variant];

  return (
    <div
      className={`${styles.toast} ${styles[toast.variant]} ${
        leaving ? styles.leaving : ""
      }`}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      <Icon className={styles.icon} size={20} />

      <div className={styles.content}>
        <p className={styles.title}>{toast.title}</p>

        {toast.description && (
          <p className={styles.description}>{toast.description}</p>
        )}
      </div>

      <button
        className={styles.closeButton}
        onClick={handleRemove}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}