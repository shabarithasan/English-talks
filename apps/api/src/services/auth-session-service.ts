import type { Request } from "express";
import type { User } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { generateRefreshToken, getRefreshExpiryDate, hashRefreshToken, signAccessToken } from "../lib/auth.js";

function getRequestMetadata(request: Request) {
  return {
    userAgent: request.headers["user-agent"]?.slice(0, 500),
    ipAddress: request.ip ?? request.headers["x-forwarded-for"]?.toString().slice(0, 120),
  };
}

export async function createAuthSessionForUser(user: User, request: Request) {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const expiresAt = getRefreshExpiryDate();
  const metadata = getRequestMetadata(request);

  const authSession = await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      expiresAt,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      lastUsedAt: new Date(),
    },
  });

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    authSessionId: authSession.id,
  });

  return {
    accessToken,
    refreshToken,
    authSession,
  };
}

export async function refreshAuthSession(refreshToken: string) {
  const refreshTokenHash = hashRefreshToken(refreshToken);
  const authSession = await prisma.authSession.findUnique({
    where: { refreshTokenHash },
    include: { user: true },
  });

  if (!authSession || authSession.revokedAt || authSession.expiresAt <= new Date()) {
    return null;
  }

  const nextRefreshToken = generateRefreshToken();
  const nextRefreshTokenHash = hashRefreshToken(nextRefreshToken);

  const updatedSession = await prisma.authSession.update({
    where: { id: authSession.id },
    data: {
      refreshTokenHash: nextRefreshTokenHash,
      lastUsedAt: new Date(),
      expiresAt: getRefreshExpiryDate(),
    },
  });

  const accessToken = signAccessToken({
    userId: authSession.user.id,
    email: authSession.user.email,
    role: authSession.user.role,
    authSessionId: updatedSession.id,
  });

  return {
    user: authSession.user,
    accessToken,
    refreshToken: nextRefreshToken,
  };
}

export async function revokeAuthSession(refreshToken?: string | null) {
  if (!refreshToken) {
    return null;
  }

  const refreshTokenHash = hashRefreshToken(refreshToken);
  return prisma.authSession.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
