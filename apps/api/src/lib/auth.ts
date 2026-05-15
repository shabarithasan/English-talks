import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { AuthPayload } from "../types.js";

export function signToken(payload: AuthPayload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET) as AuthPayload;
}

