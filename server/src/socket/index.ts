import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { registerDocumentSocket } from "./documentSocket";

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });
    registerDocumentSocket(io);
    io.on("connection", (socket: Socket) => {
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });
    
  return io;
};