import { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import styles from "./DropdownMenu.module.css";

interface DropdownItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownMenuProps {
  items: DropdownItem[];
}

export default function DropdownMenu({
  items,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handleClick);

    return () =>
      window.removeEventListener(
        "mousedown",
        handleClick
      );
  }, []);

  return (
    <div className={styles.dropdown} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div className={styles.menu}>
          {items.map((item) => (
            <button
              key={item.label}
              className={`${styles.item} ${
                item.danger ? styles.danger : ""
              }`}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}