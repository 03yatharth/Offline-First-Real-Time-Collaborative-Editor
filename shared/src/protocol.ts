/**
 * Shared Yjs-over-Socket.IO protocol constants.
 *
 * We follow the SAME message framing that y-websocket uses internally
 * (see yjs/y-websocket's bin.js / utils.js), just carried over Socket.IO
 * events instead of raw WebSocket frames.
 *
 * Every binary payload is a lib0 `encoding` buffer whose FIRST varUint
 * byte is one of the message type constants below. That's what lets a
 * single socket event ("doc:message") carry sync AND awareness traffic
 * without ambiguity.
 */

export const MESSAGE_SYNC = 0;
export const MESSAGE_AWARENESS = 1;

// Socket.IO event names — keep these identical on client & server.
export const EVT_JOIN = 'doc:join';
export const EVT_LEAVE = 'doc:leave';
export const EVT_MESSAGE = 'doc:message'; // binary: sync + awareness payloads
export const EVT_SYNCED = 'doc:synced'; // server -> client ack after initial sync

export interface JoinDocumentPayload {
  documentId: string;
}
