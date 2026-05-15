import express from "express";
import type { NextFunction, Request, Response } from "express";
import { createApp } from "../src/app.js";
import { databaseEnabled } from "../src/config.js";
import { ensureSeedData } from "../src/lib/bootstrap.js";
import { prisma } from "../src/lib/prisma.js";

const api = createApp();
const handler = express();

let startupPromise: Promise<void> | null = null;

async function ensureRuntimeReady() {
  if (!startupPromise) {
    startupPromise = (async () => {
      if (databaseEnabled) {
        await prisma.$connect();
        await ensureSeedData();
      } else {
        console.log("English Talks API running on Vercel in stateless demo mode");
      }
    })().catch((error) => {
      startupPromise = null;
      throw error;
    });
  }

  await startupPromise;
}

handler.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await ensureRuntimeReady();
    next();
  } catch (error) {
    next(error);
  }
});

handler.use(api);

export default handler;
