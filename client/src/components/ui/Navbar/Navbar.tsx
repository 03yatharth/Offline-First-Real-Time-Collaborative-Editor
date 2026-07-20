import { FileText } from "lucide-react";
import styles from "./Navbar.module.css";

interface NavbarProps {
  title?: string;
  rightContent?: React.ReactNode;
}

export default function Navbar({
  title = "Collaborative Editor",
  rightContent,
}: NavbarProps) {
  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <FileText size={18} />
          </div>

          <span className={styles.title}>{title}</span>
        </div>

        <div className={styles.actions}>{rightContent}</div>
      </div>
    </header>
  );
}