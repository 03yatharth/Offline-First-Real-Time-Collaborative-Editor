import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { registerDocumentSocket } from "./documentSocket.js";

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    },
  });

  registerDocumentSocket(io);

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  return io;
};