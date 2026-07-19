import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/authService.js";

export async function register(req: Request, res: Response) {
  try {
    const user = await registerUser(req.body);

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const user = await loginUser(req.body);
    res.status(200).json(user);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({
        message: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
    });
  }
}