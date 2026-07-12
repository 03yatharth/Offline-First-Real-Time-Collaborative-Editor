import { useEffect, useState } from "react";
import { getDocuments, createDocument } from "../../api/documentApi";
import type { Document } from "../../types/document";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const navigate = useNavigate();
  // Fetch all documents
  const fetchDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    }
  };

  // Run once when component loads
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Create a new document
  const handleCreateDocument = async () => {
    try {
      if (!title.trim() || !owner.trim()) {
          alert("Title and Owner are required.");
          return;
      }
      const newDocument = await createDocument({
          title,
          owner,
      });
      setTitle("");
      setOwner("");
      setDocuments((prev) => [...prev, newDocument]);
    } catch (error) {
      console.error("Failed to create document:", error);
    }
  };

  return (
    <div>
      <h1>Documents</h1>


      <input
          value={title}
          placeholder="title of the document"
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px 7px",
          }}
          onChange={(e) => setTitle(e.target.value)}
      />

      <input
          value={owner}
          placeholder="owner"
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px 7px",
          }}
          onChange={(e) => setOwner(e.target.value)}
      />
      <button onClick={handleCreateDocument}>
        + Create Document
      </button>
      <hr />
        
      {documents.map((document) => (
        <div
          key={document._id}
          style={{
            border: "1px solid gray",
            padding: "10px",
            margin: "10px 0",
          }}

          onClick={()=>navigate(`/documents/${document._id}`)}
        >
          <h3>{document.title}</h3>
          <p>Owner: {document.owner}</p>
          <p>content: {document.content}</p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;