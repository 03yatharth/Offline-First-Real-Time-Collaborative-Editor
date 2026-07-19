import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";

import connectDB from "./config/db.js";
import documentRoutes from "./routes/documentRoutes.js";
import { initializeSocket } from "./socket/index.js";

import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
  })
);

app.use(express.json());

app.use("/api/documents", documentRoutes);
app.use("/api/auth", authRoutes);

const httpServer = createServer(app);

async function startServer() {
  try {
    await connectDB();

    initializeSocket(httpServer);

    httpServer.listen(PORT, () => {
    });
  } catch (err) {
    console.error("[server] Failed to start server", err);
    process.exit(1);
  }
}

startServer();