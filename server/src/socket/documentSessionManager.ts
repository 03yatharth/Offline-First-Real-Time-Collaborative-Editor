import Document from "../models/Document.js";
import { applyOperations, Operation } from "@collab/shared";

export interface DocumentSession {
    documentId: string;
    content: string;
    version: number;
    clients: Set<string>;
    isDirty: boolean;
    saveTimer?: NodeJS.Timeout;
}


class DocumentSessionManager {

    private sessions = new Map<string, DocumentSession>();
    private socketToDocument = new Map<string, string>();
    private loadingSessions = new Map<string,Promise<DocumentSession>>();

    private getSession(documentId: string) {
        return this.sessions.get(documentId);
    }

    private async loadSession(
        documentId: string
    ): Promise<DocumentSession> {

        try {

            const document =
                await Document.findById(documentId);

            if (!document) {
                throw new Error("Document not found");
            }

            const session: DocumentSession = {

                documentId,

                content: document.content,

                version: document.version,

                clients: new Set(),

                isDirty: false,
            };

            this.sessions.set(
                documentId,
                session
            );

            return session;

        } finally {

            this.loadingSessions.delete(
                documentId
            );

        }

    }

    public async getOrCreateSession(
        documentId: string
    ): Promise<DocumentSession> {

        // Already loaded
        const existingSession = this.sessions.get(documentId);

        if (existingSession) {
            return existingSession;
        }

        // Someone else is already loading it
        const loadingSession =
            this.loadingSessions.get(documentId);

        if (loadingSession) {
            return loadingSession;
        }

        // Need to load it
        const sessionPromise =
            this.loadSession(documentId);

        this.loadingSessions.set(
            documentId,
            sessionPromise
        );

        return sessionPromise;
    }

    public addClient(
        documentId: string,
        socketId: string
    ) {
        const session = this.sessions.get(documentId);

        if (!session) {
            throw new Error("Session not found");
        }

        session.clients.add(socketId);

        this.socketToDocument.set(
            socketId,
            documentId
        );
    }

    public removeClient(socketId: string) {

        const documentId =
            this.socketToDocument.get(socketId);

        if (!documentId) {
            return;
        }

        const session =
            this.sessions.get(documentId);

        if (!session) {
            
            return;
        }

        session.clients.delete(socketId);

        this.socketToDocument.delete(socketId);

        
    }

    public processOperations(
        operations: Operation[]
    ): DocumentSession {

        if (operations.length === 0) {
            throw new Error("No operations received.");
        }

        const session = this.sessions.get(
            operations[0].documentId
        );

        if (!session) {
            throw new Error("Session not found");
        }

        if (
            operations[0].baseVersion !== session.version
        ) {
            throw new Error(
                `Version mismatch. Expected ${session.version}, received ${operations[0].baseVersion}`
            );
        }

        session.content = applyOperations(
            session.content,
            operations
        );

        session.version++;
        session.isDirty = true;

        return session;
    }

}

export const documentSessionManager = new DocumentSessionManager();