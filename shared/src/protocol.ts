export const MESSAGE_SYNC = 0;
export const MESSAGE_AWARENESS = 1;

// Socket.IO event names — identical on client & server.
export const EVT_JOIN = 'doc:join';
export const EVT_LEAVE = 'doc:leave';
export const EVT_MESSAGE = 'doc:message'; 
export const EVT_SYNCED = 'doc:synced'; 
export const EVT_JOIN_ERROR = "join-error";

export interface JoinDocumentPayload {
  documentId: string;
}
