import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const configSchema = z.object({
  API_PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  PUBLIC_API_URL: z.string().default("http://localhost:4000"),
  JWT_SECRET: z.string().default("change-me"),
  DATABASE_URL: z.string().default("file:./english-talks.db"),
  TURSO_DATABASE_URL: z.string().optional(),
  TURSO_AUTH_TOKEN: z.string().optional(),
  ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().default(60 * 60),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
  MEDIA_ROOT_DIR: z.string().default("storage"),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

export const config = configSchema.parse(process.env);

export const databaseEnabled = Boolean(config.TURSO_DATABASE_URL) || !process.env.VERCEL;
