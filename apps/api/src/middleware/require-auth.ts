import type { NextFunction, Response } from "express";
import { verifyToken } from "../lib/auth.js";
import type { AuthenticatedRequest } from "../types.js";

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const headerToken = req.headers.authorization?.replace("Bearer ", "");
  const cookieToken = req.cookies?.token as string | undefined;
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

