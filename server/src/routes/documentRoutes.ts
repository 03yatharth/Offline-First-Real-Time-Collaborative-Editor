import { Router } from "express";
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  getDocuments,
  patchDocument,
} from "../controllers/documentController.js";

const router = Router();

router.post("/", createDocument);
router.get("/", getDocuments);
router.get("/:id", getDocumentById);
router.patch("/:id", patchDocument);
router.delete("/:id", deleteDocument);

export default router;