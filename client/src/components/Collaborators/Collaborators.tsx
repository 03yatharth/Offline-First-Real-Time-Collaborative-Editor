import { useEffect, useState } from "react";
import * as awarenessProtocol from "y-protocols/awareness.js";

import styles from "./Collaborators.module.css";

interface UserPresence {
  id: string;
  name: string;
}

interface Props {
  awareness: awarenessProtocol.Awareness;
}

export default function Collaborators({
  awareness,
}: Props) {
  const [users, setUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    function updateUsers() {
      const unique = new Map<string, UserPresence>();

      awareness.getStates().forEach((state) => {
        const user = state.user as UserPresence | undefined;

        if (!user) return;

        unique.set(user.id, user);
      });

      setUsers(Array.from(unique.values()));
    }

    updateUsers();

    awareness.on("change", updateUsers);

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [awareness]);

  return (
    <div className={styles.container}>
      <span className={styles.label}>
        Online ({users.length})
      </span>

      <div className={styles.users}>
        {users.map((user) => (
          <div
            key={user.id}
            className={styles.user}
            title={user.name}
          >
            <div className={styles.avatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>

            <span className={styles.name}>
              {user.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}