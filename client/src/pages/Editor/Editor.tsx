import { useContext, useEffect, useRef, useState } from "react";
import { useYDocument } from '../../hooks/useYDocument';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from "../../context/AuthContext";
import Collaborators from "../../components/Collaborators/Collaborators";


export default function Editor() {
  const { id } = useParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const applyingRemoteChange = useRef(false);
  const { doc, provider, status, synced } = useYDocument(id || "");
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!doc) return;
    const ytext = doc.getText('content');

    setText(ytext.toString());

    const observer = () => {
      

      applyingRemoteChange.current = true;
      setText(ytext.toString());
      applyingRemoteChange.current = false;
    };
    ytext.observe(observer);
    return () => ytext.unobserve(observer);
  }, [doc]);

  useEffect(() => {
    if (!provider) return;
    if (!auth?.user) return;

    provider.awareness.setLocalStateField("user", {
      id: auth.user.id,
      name: auth.user.username,
    });

    return () => {
      provider.awareness.setLocalState(null);
    };
  }, [provider, auth?.user]);

  useEffect(() => {
  function handleJoinError() {
    navigate("/", { replace: true });
  }

  window.addEventListener(
    "document:join-error",
    handleJoinError
  );

  return () => {
    window.removeEventListener(
      "document:join-error",
      handleJoinError
    );
  };
}, [navigate]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!doc || applyingRemoteChange.current) return;
    
    const ytext = doc.getText('content');
    const newValue = e.target.value;
    const oldValue = ytext.toString();

    
    let start = 0;
    while (
      start < oldValue.length &&
      start < newValue.length &&
      oldValue[start] === newValue[start]
    ) {
      start++;
    }
    let oldEnd = oldValue.length;
    let newEnd = newValue.length;
    while (
      oldEnd > start &&
      newEnd > start &&
      oldValue[oldEnd - 1] === newValue[newEnd - 1]
    ) {
      oldEnd--;
      newEnd--;
    }

    doc.transact(() => {
      if (oldEnd > start) ytext.delete(start, oldEnd - start);
      if (newEnd > start) ytext.insert(start, newValue.slice(start, newEnd));
    }, 'local-user-edit');

  }

  if (!id || id.length==0) {
    return <div>Invalid document id.</div>;
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: 24 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <StatusBadge status={status} synced={synced} />
        {provider && (
          <div style={{ marginBottom: 16 }}>
            <Collaborators awareness={provider.awareness} />
          </div>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder={doc ? 'Start typing...' : 'Connecting...'}
        disabled={!doc}
        style={{
          width: '100%',
          minHeight: 400,
          padding: 16,
          fontSize: 16,
          fontFamily: 'ui-monospace, monospace',
          lineHeight: 1.5,
        }}
      />
    </div>
  );
}

function StatusBadge({
  status,
  synced,
}: {
  status: 'connecting' | 'connected' | 'disconnected';
  synced: boolean;
}) {
  const label =
    status === 'disconnected'
      ? 'Offline — edits saved locally, will sync on reconnect'
      : status === 'connecting'
        ? 'Connecting...'
        : synced
          ? 'Synced'
          : 'Syncing...';

  const color =
    status === 'disconnected' ? '#b45309' : status === 'connected' && synced ? '#15803d' : '#6b7280';

  return (
    <span style={{ fontSize: 13, color, display: 'flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      {label}
    </span>
  );
}
