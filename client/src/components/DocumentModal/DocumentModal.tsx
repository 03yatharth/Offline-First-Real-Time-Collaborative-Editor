import { useEffect, useState } from "react";
import styles from "./DocumentModal.module.css";

interface DocumentModalProps {
  isOpen: boolean;
  title: string;

  initialValue?: string;
  placeholder?: string;
  inputType?: "text" | "email";

  confirmText: string;

  onClose: () => void;
  onConfirm: (value: string) => Promise<void> | void;
}

export default function DocumentModal({
  isOpen,
  title,
  initialValue = "",
  confirmText,
  onClose,
  onConfirm,
  placeholder = "Enter value",
  inputType = "text",
}: DocumentModalProps) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    try {
      setSubmitting(true);
      await onConfirm(trimmed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>{title}</h2>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type={inputType}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className={styles.input}
          />

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancel}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className={styles.confirm}
            >
              {submitting ? "Please wait..." : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}