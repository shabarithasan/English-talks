import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "node:path";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import helmetImport from "helmet";
import { config, databaseEnabled } from "./config.js";
import { analyticsRouter } from "./routes/analytics.js";
import { authRouter } from "./routes/auth.js";
import { billingRouter } from "./routes/billing.js";
import { catalogRouter } from "./routes/catalog.js";
import { practiceRouter } from "./routes/practice.js";
import { userRouter } from "./routes/user.js";
import { vocabularyRouter } from "./routes/vocabulary.js";
import { webhookRouter } from "./routes/webhooks.js";
import { getMediaRootDirectory } from "./services/storage-service.js";

export function createApp() {
  const app = express();
  const helmet = helmetImport as unknown as () => RequestHandler;

  app.use(
    cors({
      origin: config.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/media", express.static(path.resolve(getMediaRootDirectory())));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "english-talks-api",
      version: "git-deploy-1",
      databaseMode: databaseEnabled ? "persistent" : "stateless-demo",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/user", userRouter);
  app.use("/api/v1/catalog", catalogRouter);
  app.use("/api/v1/practice", practiceRouter);
  app.use("/api/v1/vocabulary", vocabularyRouter);
  app.use("/api/v1/webhooks", webhookRouter);

  app.use((_req, res) => {
    res.status(404).json({
      error: "Route not found",
    });
  });

  // Vercel recommends robust error handling for Express so failed requests don't leave the
  // serverless function in an undefined state.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled API error", error);
    res.status(500).json({
      error: "Internal server error",
    });
  });

  return app;
}
