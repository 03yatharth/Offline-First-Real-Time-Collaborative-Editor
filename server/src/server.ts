import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import documentRoutes from "./routes/documentRoutes";
import { createServer } from "http";
import { initializeSocket } from "./socket";
import { registerDocumentSocket } from "./socket/documentSocket";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);

app.use(express.json());
app.use(cors());
app.use("/api/documents", documentRoutes);

const startServer = async () => {
  try {
    await connectDB();
    const io = initializeSocket(server);
    registerDocumentSocket(io)
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
  }
};

startServer();
