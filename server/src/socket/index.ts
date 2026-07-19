import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { registerDocumentSocket } from "./documentSocket.js";
import { verifyToken } from "../utils/jwt.js";

export const initializeSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    },
  });

  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const payload = verifyToken(token);

      socket.data.userId = payload.userId;

      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  registerDocumentSocket(io);

  io.on("connection", (socket: Socket) => {
    

    socket.on("disconnect", () => {
      
    });
  });

  return io;
};