import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { catalogRouter } from "./routes/catalog.js";
import { practiceRouter } from "./routes/practice.js";
import { userRouter } from "./routes/user.js";
import { vocabularyRouter } from "./routes/vocabulary.js";
import { webhookRouter } from "./routes/webhooks.js";

export function createApp() {
  const app = express();

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

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "english-talks-api",
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/api/v1/auth", authRouter);
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
