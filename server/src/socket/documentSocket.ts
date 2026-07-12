import { Server, Socket } from "socket.io";
import { documentSessionManager } from "./documentSessionManager.js";
import { Operation } from "@collab/shared";

export function registerDocumentSocket(io: Server) {
    io.on("connection", (socket: Socket) => {
        
        console.log("Client connected:", socket.id);
        
        socket.on(
            "join-document",
            async (documentId: string) => {

                const session =
                    await documentSessionManager.getOrCreateSession(
                        documentId
                    );

                documentSessionManager.addClient(
                    documentId,
                    socket.id
                );

                socket.join(documentId);

                socket.emit(
                    "document-load",
                    {
                        content: session.content,
                        version: session.version,
                    }
                );

            }
        );

        socket.on(
            "document-operation",
            (operations: Operation[]) => {

                try {

                    const session =
                        documentSessionManager.processOperations(
                            operations
                        );

                    socket.emit(
                        "operation-accepted",
                        {
                            version: session.version,
                        }
                    );

                    socket.to(
                        operations[0].documentId
                    ).emit(
                        "document-operation",
                        {
                            operations,
                            version: session.version,
                        }
                    );

                } catch (err) {

                    socket.emit(
                        "operation-error",
                        {
                            message:
                                err instanceof Error
                                    ? err.message
                                    : "Unknown error",
                        }
                    );

                }

            }
        );

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });

    }); 
}