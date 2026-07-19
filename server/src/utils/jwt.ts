import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export function generateToken(userId: string) {
  const secret = env.jwtSecret;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const options: SignOptions = {
    expiresIn: "7d",
  };

  return jwt.sign({ userId }, secret, options);
}

export interface AuthTokenPayload extends JwtPayload {
  userId: string;
}

export function verifyToken(token: string): AuthTokenPayload {
  const secret = env.jwtSecret;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.verify(token, secret) as AuthTokenPayload;
}