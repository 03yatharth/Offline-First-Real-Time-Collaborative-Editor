import bcrypt from "bcrypt";
import User from "../models/User.js";
import { RegisterRequest } from "../types/auth.js";
import { LoginRequest } from "../types/auth.js";
import { generateToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

export async function registerUser(data: RegisterRequest) {
  const { username, email, password } = data;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
  });

  return {
    id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function loginUser(data: LoginRequest) {
  const { email, password } = data;

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user._id.toString());

    return {
    user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
    },
    token,
    };
}