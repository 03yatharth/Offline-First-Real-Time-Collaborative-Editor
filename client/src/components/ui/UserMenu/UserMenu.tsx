import styles from "./UserMenu.module.css";
import { getInitials } from "../../../utils/getInitials";

interface User {
  name: string;
  email: string;
}

interface UserMenuProps {
  user: User;
  onLogout: () => void;
}

export default function UserMenu({
  user,
  onLogout,
}: UserMenuProps) {
  return (
    <div className={styles.userMenu}>
      <div className={styles.avatar}>
        {getInitials(user.name)}
      </div>

      <div className={styles.info}>
        <span className={styles.name}>{user.name}</span>
        <span className={styles.email}>{user.email}</span>
      </div>

      <button
        className={styles.logout}
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  );
}