import { Request, Response } from "express";
import Document from "../models/Document.js";
import mongoose from "mongoose";

export const createDocument = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        message: "Request body is missing",
      });
    }

    const { title, owner } = req.body;

    if (!title || !owner) {
      return res.status(400).json({
        message: "Title and Owner are required",
      });
    }

    const document = await Document.create({
      title,
      owner,
    });

    return res.status(201).json(document);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getDocuments = async (
  req: Request,
  res: Response
) => {
  try {
    const documents = await Document.find();

    return res.status(200).json(documents);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

export const getDocumentById = async(
  req : Request,
  res : Response
)=>{
  try {
    const {id} = req.params;
    if(!mongoose.isValidObjectId(id)){
      return res.status(400).json({
        message : "Invalid document ID"
      })
    }
    const document = await Document.findById(id);
    if(!document){
      return res.status(404).json({
        message : "No Document Found"
      })
    }
    return res.status(200).json(document);
  }
  catch (error) {
    console.error(error);

    return res.status(500).json({
        message: "Internal Server Error",
    });
  }
};

export const patchDocument = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid document ID",
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const { title, content, isPublic } = req.body;

    if (title !== undefined) {
      document.title = title;
    }

    if (content !== undefined) {
      document.content = content;
    }

    if (isPublic !== undefined) {
      document.isPublic = isPublic;
    }

    await document.save();

    return res.status(200).json(document);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const deleteDocument = async(
  req : Request,
  res : Response
)=>{
  try{
    const {id} = req.params;
    if(!mongoose.isValidObjectId(id)){
      return res.status(400).json({
        message : "Invalid document ID"
      })
    }
    const document = await Document.findById(id);
    if(!document){
      return res.status(404).json({
        message : "No Document Found"
      })
    }
    await document.deleteOne();
    return res.status(200).json({
      message : "document successfully deleted",
      document  : document
    })
  }
  catch (error){
    console.error(error);
    return res.status(500).json({
        message: "Internal Server Error",
    });
  }
}