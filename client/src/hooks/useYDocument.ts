import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { SocketIOProvider } from '../collaboration/SocketIOProvider';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export interface UseYDocumentResult {
  doc: Y.Doc | null;
  provider: SocketIOProvider | null;
  status: 'connecting' | 'connected' | 'disconnected';
  synced: boolean;
}

/**
 * One Y.Doc + provider per documentId, torn down cleanly on unmount or
 * when documentId changes (e.g. navigating between documents).
 */
export function useYDocument(documentId: string): UseYDocumentResult {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [synced, setSynced] = useState(false);
  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<SocketIOProvider | null>(null);
  // useYDocument.ts
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';  // client tries 4000

  useEffect(() => {
    const newDoc = new Y.Doc();
    const newProvider = new SocketIOProvider(SERVER_URL, documentId, newDoc);

    // Using state (not refs) here so the doc/provider are available to
    // consumers on the very next render, rather than only after some
    // later socket event happens to trigger a re-render.
    setDoc(newDoc);
    setProvider(newProvider);
    setSynced(false);

    const unsubStatus = newProvider.onStatus(setStatus);
    const unsubSynced = newProvider.onSynced(setSynced);

    return () => {
      unsubStatus();
      unsubSynced();
      newProvider.destroy();
      newDoc.destroy();
      setDoc(null);
      setProvider(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  return { doc, provider, status, synced };
}
