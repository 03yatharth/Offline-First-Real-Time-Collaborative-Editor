import { Request, Response } from "express";
import Document from "../models/Document.js";
import mongoose from "mongoose";
import User from "../models/User.js";


export const createDocument = async (
  req: Request,
  res: Response
) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const document = await Document.create({
      title,
      owner: new mongoose.Types.ObjectId(req.user!.userId),
      collaborators: [],
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
    const userId = req.user!.userId;

    const documents = await Document.find({
      $or: [
        { owner: userId },
        { collaborators: userId },
      ],
    })
    .sort({
      updatedAt: -1,
    });

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
      });
    }


    const userId = req.user!.userId;

    const document = await Document.findOne({
      _id: id,
      $or: [
        { owner: userId },
        { collaborators: userId },
      ],
    });


    if(!document){
      return res.status(404).json({
        message : "No Document Found"
      });
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


    const document = await Document.findOne({
      _id: id,
      owner: req.user!.userId,
    });


    if (!document) {
      return res.status(403).json({
        message: "Only owner can update document details",
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
      });
    }


    const document = await Document.findOne({
      _id: id,
      owner: req.user!.userId,
    });


    if(!document){
      return res.status(403).json({
        message : "Only owner can delete document"
      });
    }


    await document.deleteOne();


    return res.status(200).json({
      message : "Document successfully deleted",
    });


  }
  catch (error){

    console.error(error);

    return res.status(500).json({
        message: "Internal Server Error",
    });
  }
};



// Add collaborator
export const addCollaborator = async(
  req: Request,
  res: Response
)=>{
  try {

    const { id } = req.params;
    const { email } = req.body;


    if(
      !mongoose.isValidObjectId(id) ||
      !email
    ){
      return res.status(400).json({
        message:"Invalid request"
      });
    }


    const document = await Document.findOne({
      _id:id,
      owner:req.user!.userId
    });


    if(!document){
      return res.status(403).json({
        message:"Only owner can share document"
      });
    }


    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });


    if(!user){
      return res.status(404).json({
        message:"User not found"
      });
    }


    if(
      user._id.toString() ===
      document.owner.toString()
    ){
      return res.status(400).json({
        message:"Owner already has access"
      });
    }


    if(
      !document.collaborators.some(
        (c)=>c.toString()===user._id.toString()
      )
    ){
      document.collaborators.push(
        user._id
      );
    }


    await document.save();


    return res.status(200).json(document);


  } catch(error){

    console.error(error);

    return res.status(500).json({
      message:"Internal Server Error"
    });
  }
};



// Remove collaborator
export const removeCollaborator = async(
  req:Request,
  res:Response
)=>{
  try{

    const {id,userId}=req.params;


    const document = await Document.findOne({
      _id:id,
      owner:req.user!.userId
    });


    if(!document){
      return res.status(403).json({
        message:"Only owner can modify sharing"
      });
    }


    document.collaborators =
      document.collaborators.filter(
        (c)=>c.toString()!==userId
      );


    await document.save();


    return res.status(200).json(document);


  }catch(error){

    console.error(error);

    return res.status(500).json({
      message:"Internal Server Error"
    });
  }
};