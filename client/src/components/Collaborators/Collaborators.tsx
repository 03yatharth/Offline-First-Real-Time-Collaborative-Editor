import { useEffect, useState } from "react";
import * as awarenessProtocol from "y-protocols/awareness.js";

interface UserPresence {
  id: string;
  name: string;
}

interface Props {
  awareness: awarenessProtocol.Awareness;
}

export default function Collaborators({ awareness }: Props) {
  const [users, setUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    const updateUsers = () => {
      const unique = new Map<string, UserPresence>();

      awareness.getStates().forEach((state) => {
        const user = state.user as UserPresence | undefined;

        if (!user) return;

        unique.set(user.id, user);
      });

      setUsers(Array.from(unique.values()));
    };

    updateUsers();

    awareness.on("change", updateUsers);

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [awareness]);

  return (
    <div>
      <strong>Online ({users.length})</strong>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 8,
          flexWrap: "wrap",
        }}
      >
        {users.map((user) => (
          <span
            key={user.id}
            style={{
              background: "#eef2ff",
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 13,
            }}
          >
            {user.name}
          </span>
        ))}
      </div>
    </div>
  );
}