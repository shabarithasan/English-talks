import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import { config } from "../config.js";
import type { AuthPayload } from "../types.js";

export const accessCookieName = "english_talks_access";
export const refreshCookieName = "english_talks_refresh";

function isSecureCookie() {
  return config.CLIENT_URL.startsWith("https://") || process.env.NODE_ENV === "production";
}

export function signAccessToken(payload: AuthPayload) {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.ACCESS_TOKEN_TTL_SECONDS });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.JWT_SECRET) as AuthPayload;
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}

export function setAuthCookies(response: Response, accessToken: string, refreshToken: string) {
  const secure = isSecureCookie();
  const sameSite = secure ? "none" : "lax";

  response.cookie(accessCookieName, accessToken, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: config.ACCESS_TOKEN_TTL_SECONDS * 1000,
  });

  response.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: config.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(response: Response) {
  response.clearCookie(accessCookieName);
  response.clearCookie(refreshCookieName);
}
