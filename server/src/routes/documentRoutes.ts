import { Router } from "express";
import {
  createDocument,
  deleteDocument,
  getDocumentById,
  getDocuments,
  patchDocument,
  addCollaborator,
  removeCollaborator,
} from "../controllers/documentController.js";

import { authenticate } from "../middleware/authMiddleware.js";


const router = Router();


router.use(authenticate);


router.post("/", createDocument);

router.get("/", getDocuments);

router.get("/:id", getDocumentById);

router.patch("/:id", patchDocument);

router.delete("/:id", deleteDocument);


// sharing routes
router.post(
  "/:id/collaborators",
  addCollaborator
);


router.delete(
  "/:id/collaborators/:userId",
  removeCollaborator
);


export default router;