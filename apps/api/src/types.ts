import type { Request } from "express";

export type AuthPayload = {
  userId: string;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthPayload;
};
