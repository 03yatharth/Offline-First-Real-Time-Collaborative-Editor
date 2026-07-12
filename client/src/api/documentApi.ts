import api from "./axios";

export const getDocuments = async()=>{
    const response = await api.get("/documents");
    return response.data;
}

export const createDocument = async (documentData: {
  title: string;
  owner: string;
}) => {
  const response = await api.post("/documents", documentData);
  return response.data;
};

export const getDocumentById = async(id:string)=>{
    const response = await api.get("/documents/"+id);
    return response.data;
};

type UpdateDocumentData = {
  title?: string;
  content?: string;
  isPublic?: boolean;
};
export const updateDocument = async (
  id: string,
  updatedData: UpdateDocumentData
) => {
  const response = await api.patch(`/documents/${id}`, updatedData);
  return response.data;
};

export const deleteDocument = async(id:string)=>{
    const response = await api.delete("/documents/"+id);
    return response.data;
};