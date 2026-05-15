import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";
import { config } from "../config.js";

declare global {
  var __englishTalksPrisma__: PrismaClient | undefined;
}

function createPrismaClient() {
  const useTurso = Boolean(config.TURSO_DATABASE_URL);

  if (useTurso) {
    const adapter = new PrismaLibSQL({
      url: config.TURSO_DATABASE_URL!,
      authToken: config.TURSO_AUTH_TOKEN,
    });

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma =
  globalThis.__englishTalksPrisma__ ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__englishTalksPrisma__ = prisma;
}
