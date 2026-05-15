import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
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

  return app;
}
