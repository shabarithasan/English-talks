import bcrypt from "bcryptjs";
import type { Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { config, databaseEnabled } from "../config.js";
import { accessCookieName, clearAuthCookies, refreshCookieName, setAuthCookies } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";
import { serializeUser } from "../lib/serializers.js";
import { requireAuth } from "../middleware/require-auth.js";
import { createAuthSessionForUser, refreshAuthSession, revokeAuthSession } from "../services/auth-session-service.js";
import { recordAnalyticsEvent } from "../services/analytics-service.js";
import type { AuthenticatedRequest } from "../types.js";

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(2),
  timezone: z.string().min(2).optional(),
  preferredLocale: z.string().min(2).max(10).optional(),
});

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const googleTokenResponseSchema = z.object({
  access_token: z.string(),
  id_token: z.string().optional(),
});

const googleUserSchema = z.object({
  sub: z.string(),
  email: z.email(),
  name: z.string().min(1),
  picture: z.string().url().optional(),
});

function assertPersistentDatabase() {
  return databaseEnabled;
}

async function sendAuthenticatedResponse(
  request: AuthenticatedRequest,
  response: Response,
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Authenticated user not found");
  }

  const { accessToken, refreshToken } = await createAuthSessionForUser(user, request);
  setAuthCookies(response, accessToken, refreshToken);

  return {
    accessToken,
    user: serializeUser(user),
  };
}

async function exchangeGoogleCodeForUser(code: string) {
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.GOOGLE_CLIENT_ID ?? "",
      client_secret: config.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: config.GOOGLE_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error("Google token exchange failed");
  }

  const tokenPayload = googleTokenResponseSchema.parse(await tokenResponse.json());
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error("Google user info fetch failed");
  }

  return googleUserSchema.parse(await userResponse.json());
}

export const authRouter = Router();

authRouter.post("/register", async (req: AuthenticatedRequest, res) => {
  if (!assertPersistentDatabase()) {
    return res.status(503).json({ error: "Registration requires a persistent database. Configure Turso to enable auth." });
  }

  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (existingUser) {
    return res.status(409).json({ error: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      fullName: parsed.data.name,
      passwordHash,
      role: "LEARNER",
      cefrLevel: "A2",
      timezone: parsed.data.timezone,
      preferredLocale: parsed.data.preferredLocale ?? "en",
      lastActiveAt: new Date(),
    },
  });

  const authPayload = await sendAuthenticatedResponse(req, res, user.id);
  await recordAnalyticsEvent({
    userId: user.id,
    eventName: "auth.register.success",
    eventGroup: "auth",
    path: "/api/v1/auth/register",
  });

  return res.status(201).json({
    message: "Registration successful",
    accessToken: authPayload.accessToken,
    user: authPayload.user,
  });
});

authRouter.post("/login", async (req: AuthenticatedRequest, res) => {
  if (!assertPersistentDatabase()) {
    return res.status(503).json({ error: "Login requires a persistent database. Configure Turso to enable auth." });
  }

  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const authPayload = await sendAuthenticatedResponse(req, res, user.id);
  await recordAnalyticsEvent({
    userId: user.id,
    eventName: "auth.login.success",
    eventGroup: "auth",
    path: "/api/v1/auth/login",
  });

  return res.json({
    message: "Logged in",
    accessToken: authPayload.accessToken,
    user: authPayload.user,
  });
});

authRouter.post("/refresh", async (req, res) => {
  if (!assertPersistentDatabase()) {
    return res.status(503).json({ error: "Token refresh requires a persistent database." });
  }

  const refreshToken = req.cookies?.[refreshCookieName] as string | undefined;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  const refreshed = await refreshAuthSession(refreshToken);

  if (!refreshed) {
    clearAuthCookies(res);
    return res.status(401).json({ error: "Refresh token expired or invalid" });
  }

  setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken);

  return res.json({
    message: "Session refreshed",
    accessToken: refreshed.accessToken,
    user: serializeUser(refreshed.user),
  });
});

authRouter.post("/logout", async (req, res) => {
  const refreshToken = req.cookies?.[refreshCookieName] as string | undefined;
  await revokeAuthSession(refreshToken);
  clearAuthCookies(res);
  return res.json({ message: "Logged out" });
});

authRouter.get("/google/start", (_req, res) => {
  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_REDIRECT_URI) {
    return res.status(503).json({ error: "Google OAuth is not configured in this environment." });
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", config.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", config.GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");

  return res.json({ authorizationUrl: url.toString() });
});

authRouter.get("/google/callback", async (req: AuthenticatedRequest, res) => {
  if (!assertPersistentDatabase()) {
    return res.status(503).json({ error: "Google OAuth requires a persistent database." });
  }

  if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET || !config.GOOGLE_REDIRECT_URI) {
    return res.status(503).json({ error: "Google OAuth is not configured in this environment." });
  }

  const code = req.query.code;

  if (typeof code !== "string" || code.length === 0) {
    return res.status(400).json({ error: "Missing Google authorization code" });
  }

  try {
    const googleUser = await exchangeGoogleCodeForUser(code);
    const existingByGoogle = await prisma.user.findUnique({
      where: { googleId: googleUser.sub },
    });

    let user = existingByGoogle;

    if (!user) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: googleUser.email.toLowerCase() },
      });

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId: googleUser.sub,
            avatarUrl: googleUser.picture,
            lastActiveAt: new Date(),
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            email: googleUser.email.toLowerCase(),
            fullName: googleUser.name,
            googleId: googleUser.sub,
            avatarUrl: googleUser.picture,
            role: "LEARNER",
            cefrLevel: "A2",
            preferredLocale: "en",
            lastActiveAt: new Date(),
          },
        });
      }
    }

    const authPayload = await sendAuthenticatedResponse(req, res, user.id);
    await recordAnalyticsEvent({
      userId: user.id,
      eventName: "auth.google.success",
      eventGroup: "auth",
      path: "/api/v1/auth/google/callback",
    });

    const redirectUrl = new URL("/dashboard", config.CLIENT_URL);
    redirectUrl.searchParams.set("signedIn", "1");
    redirectUrl.searchParams.set("user", authPayload.user.id);
    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Google OAuth callback failed", error);
    return res.status(500).json({ error: "Google sign-in failed" });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  if (!assertPersistentDatabase()) {
    return res.status(503).json({ error: "Persistent auth is unavailable in stateless demo mode." });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
  });

  if (!user) {
    clearAuthCookies(res);
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({
    user: serializeUser(user),
    auth: {
      accessCookieName,
      refreshCookieName,
    },
  });
});
