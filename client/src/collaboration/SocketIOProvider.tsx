import * as Y from "yjs";
import { io, Socket } from "socket.io-client";
import { IndexeddbPersistence } from "y-indexeddb";

import * as encoding from "lib0/encoding.js";
import * as decoding from "lib0/decoding.js";

import * as syncProtocol from "y-protocols/sync.js";
import * as awarenessProtocol from "y-protocols/awareness.js";

import {
  MESSAGE_SYNC,
  MESSAGE_AWARENESS,
  EVT_JOIN,
  EVT_LEAVE,
  EVT_MESSAGE,
  EVT_JOIN_ERROR,
} from "@collab/shared";

export type Status = "connecting" | "connected" | "disconnected";

type StatusListener = (status: Status) => void;
type SyncedListener = (synced: boolean) => void;

type MessageHandler = (
  encoder: encoding.Encoder,
  decoder: decoding.Decoder,
  provider: SocketIOProvider,
  emitSynced: boolean
) => void;

const messageHandlers: MessageHandler[] = [];

messageHandlers[MESSAGE_SYNC] = (
  encoder,
  decoder,
  provider,
  emitSynced
) => {
  encoding.writeVarUint(encoder, MESSAGE_SYNC);

  const syncMessageType = syncProtocol.readSyncMessage(
    decoder,
    encoder,
    provider.doc,
    provider
  );

  if (
    emitSynced &&
    syncMessageType === syncProtocol.messageYjsSyncStep2 &&
    !provider.synced
  ) {
    provider.setSynced(true);
  }
};

messageHandlers[MESSAGE_AWARENESS] = (
  _encoder,
  decoder,
  provider
) => {
  awarenessProtocol.applyAwarenessUpdate(
    provider.awareness,
    decoding.readVarUint8Array(decoder),
    provider
  );
};

export class SocketIOProvider {
  public readonly doc: Y.Doc;

  public readonly awareness: awarenessProtocol.Awareness;

  public readonly indexeddb: IndexeddbPersistence;

  public synced = false;

  private readonly socket: Socket;

  private readonly documentId: string;

  private readonly messageHandlers = messageHandlers.slice();

  private statusListeners = new Set<StatusListener>();

  private syncedListeners = new Set<SyncedListener>();

    constructor(serverUrl: string, documentId: string, doc: Y.Doc) {
    this.doc = doc;
    this.documentId = documentId;

    this.awareness = new awarenessProtocol.Awareness(doc);

    this.indexeddb = new IndexeddbPersistence(
      `doc-${documentId}`,
      doc
    );

    const token = localStorage.getItem("token");

    this.socket = io(serverUrl, {
      autoConnect: false,
      transports: ["websocket"],
      auth: {
        token,
      },
    });

    this.registerSocketEvents();

    this.doc.on("update", this.handleDocumentUpdate);

    this.awareness.on(
      "update",
      this.handleAwarenessUpdate
    );

    this.connect();
  }

    private readMessage(
    message: Uint8Array,
    emitSynced: boolean
  ) {
    const decoder = decoding.createDecoder(message);
    const encoder = encoding.createEncoder();

    const messageType = decoding.readVarUint(decoder);

    const handler = this.messageHandlers[messageType];

    if (handler) {
      handler(
        encoder,
        decoder,
        this,
        emitSynced
      );
    }

    return encoder;
  }

  private send(message: Uint8Array) {
    if (!this.socket.connected) {
      return;
    }

    this.socket.emit(
      EVT_MESSAGE,
      message,
      this.documentId
    );
  }

  private registerSocketEvents() {
    this.socket.on("connect", () => {
      this.emitStatus("connecting");

      this.socket.emit(EVT_JOIN, this.documentId);

      const encoder = encoding.createEncoder();

      encoding.writeVarUint(
        encoder,
        MESSAGE_SYNC
      );

      syncProtocol.writeSyncStep1(
        encoder,
        this.doc
      );

      this.send(
        encoding.toUint8Array(encoder)
      );

      const localState =
        this.awareness.getLocalState();

      if (localState !== null) {
        const awarenessEncoder =
          encoding.createEncoder();

        encoding.writeVarUint(
          awarenessEncoder,
          MESSAGE_AWARENESS
        );

        encoding.writeVarUint8Array(
          awarenessEncoder,
          awarenessProtocol.encodeAwarenessUpdate(
            this.awareness,
            [this.doc.clientID]
          )
        );

        this.send(
          encoding.toUint8Array(
            awarenessEncoder
          )
        );
      }

      this.emitStatus("connected");
    });

    this.socket.on("disconnect", () => {
      this.setSynced(false);
      this.emitStatus("disconnected");

            awarenessProtocol.removeAwarenessStates(
        this.awareness,
        Array.from(
          this.awareness.getStates().keys()
        ).filter(
          id => id !== this.doc.clientID
        ),
        this
      );
    });

    this.socket.on(
      EVT_MESSAGE,
      (
        payload: ArrayBuffer,
        incomingDocumentId: string
      ) => {
        if (
          incomingDocumentId !==
          this.documentId
        ) {
          return;
        }

        const encoder = this.readMessage(
          new Uint8Array(payload),
          true
        );

        if (
          encoding.length(encoder) > 1
        ) {
          this.send(
            encoding.toUint8Array(
              encoder
            )
          );
        }
      }
    );

    this.socket.on(EVT_JOIN_ERROR, (message: string) => {
      this.disconnect();

      window.dispatchEvent(
        new CustomEvent("document:join-error", {
          detail: {
            message,
          },
        })
      );
    });

    this.socket.on(
      "connect_error",
      (error) => {
        if (
          error.message ===
            "Authentication required" ||
          error.message ===
            "Invalid token"
        ) {
          this.disconnect();
          window.dispatchEvent(
            new Event("auth:logout")
          );
        }
      }
    );
  }

    private handleDocumentUpdate = (
    update: Uint8Array,
    origin: unknown
  ) => {
    if (origin === this) {
      return;
    }

    const encoder = encoding.createEncoder();

    encoding.writeVarUint(
      encoder,
      MESSAGE_SYNC
    );

    syncProtocol.writeUpdate(
      encoder,
      update
    );

    this.send(
      encoding.toUint8Array(encoder)
    );
  };

  private handleAwarenessUpdate = (
    {
      added,
      updated,
      removed,
    }: {
      added: number[];
      updated: number[];
      removed: number[];
    },
    origin: unknown
  ) => {
    if (origin === this) {
      return;
    }

    const changedClients = [
      ...added,
      ...updated,
      ...removed,
    ];

    if (changedClients.length === 0) {
      return;
    }

    const encoder = encoding.createEncoder();

    encoding.writeVarUint(
      encoder,
      MESSAGE_AWARENESS
    );

    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        changedClients
      )
    );

    this.send(
      encoding.toUint8Array(encoder)
    );
  };

    public connect() {
    if (this.socket.connected) {
      return;
    }

    this.socket.connect();
  }

  public disconnect() {
    if (!this.socket.connected) {
      return;
    }

    const localState = this.awareness.getLocalState();

    if (localState !== null) {
      awarenessProtocol.removeAwarenessStates(
        this.awareness,
        [this.doc.clientID],
        this
      );
    }

    this.socket.emit(
      EVT_LEAVE,
      this.documentId
    );

    this.socket.disconnect();

    this.setSynced(false);
  }

  public onStatus(listener: StatusListener) {
    this.statusListeners.add(listener);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public onSynced(listener: SyncedListener) {
    this.syncedListeners.add(listener);

    return () => {
      this.syncedListeners.delete(listener);
    };
  }

  private emitStatus(status: Status) {
    this.statusListeners.forEach(listener =>
      listener(status)
    );
  }

  public setSynced(value: boolean) {
    if (this.synced === value) {
      return;
    }

    this.synced = value;

    this.syncedListeners.forEach(listener =>
      listener(value)
    );
  }

  public destroy() {
    this.disconnect();

    this.doc.off(
      "update",
      this.handleDocumentUpdate
    );

    this.awareness.off(
      "update",
      this.handleAwarenessUpdate
    );

    this.awareness.destroy();

    this.indexeddb.destroy();

    this.statusListeners.clear();
    this.syncedListeners.clear();
  }
}