import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { deleteDocument, getDocumentById } from "../../api/documentApi";
import type { Document } from "../../types/document";
import { socket } from "../../socket/socket";

import {
  applyOperations,
  generateOperations,
} from "@collab/shared";

function Editor() {
  const { id } = useParams();

  const [document, setDocument] = useState<Document>();
  const navigate = useNavigate();
  const currentVersion = useRef(0);

  // Socket Connection
  useEffect(() => {
    const handleConnect = () => {
      if (!id) return;

      socket.emit("join-document", id);
    };

    socket.on("connect", handleConnect);
    
    socket.on(
      "document-load",
      ({
        content,
        version,
      }: {
        content: string;
        version: number;
      }) => {
        currentVersion.current = version;
        setDocument((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            content,
            version,
          };
        });
      }
    );

    socket.on(
      "document-operation",
      ({
        operations,
        version,
      }: {
        operations: any[];
        version: number;
      }) => {
        setDocument((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            content: applyOperations(
              prev.content,
              operations
            ),
            version,
          };
        });
        currentVersion.current = version;
      }
    );

    socket.on(
      "operation-accepted",
      ({ version }: { version: number }) => {
        currentVersion.current = version;
        setDocument((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            version,
          };
        });
      }
    );

    socket.on(
      "operation-error",
      ({ message }: { message: string }) => {
        console.error("Operation Error:", message);
      }
    );

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("document-load");
      socket.off("document-operation");
      socket.off("operation-accepted");
      socket.off("operation-error");

      socket.disconnect();
    };
  }, [id]);

  // Initial Document Fetch
  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      try {
        const data = await getDocumentById(id);
        setDocument(data);
        currentVersion.current = data.version;
      } catch (error) {
        console.error("Can't find document:", error);
      }
    };

    fetchDocument();
  }, [id]);

  // Delete Document
  const handleDelete = async () => {
    if (!document) return;

    try {
      await deleteDocument(document._id);
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  // Local Edit
  const handleContentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!document) return;

    const newContent = e.target.value;

    const operations = generateOperations({
      documentId: document._id,
      baseVersion: currentVersion.current,
      oldText: document.content,
      newText: newContent,
    });

    if (operations.length === 0) return;

    socket.emit("document-operation", operations);
    

    // Immediate local update for responsiveness
    setDocument({
      ...document,
      content: newContent,
    });
  };

  if (!document) {
    return <h2>Loading...</h2>;
  }

  return (
    <>
      <h1>Editor Page</h1>

      <h2>{document.title}</h2>

      <p>Owner: {document.owner}</p>

      <button onClick={handleDelete}>
        Delete Document
      </button>

      <textarea
        value={document.content}
        onChange={handleContentChange}
        rows={15}
        cols={80}
        style={{
          margin: "10px 10px",
        }}
      />
    </>
  );
}

export default Editor;