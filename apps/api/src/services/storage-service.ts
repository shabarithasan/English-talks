import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

type StoreObjectInput = {
  buffer: Buffer;
  mimeType: string;
  folder: "audio" | "reports";
  extension: string;
  fileNamePrefix: string;
};

type StoredObject = {
  storageKey: string;
  publicUrl: string;
  bytes: number;
  mimeType: string;
};

const mediaRoot = path.resolve(process.cwd(), config.MEDIA_ROOT_DIR);

async function ensureFolder(folder: string) {
  await fs.mkdir(path.join(mediaRoot, folder), { recursive: true });
}

function buildPublicUrl(storageKey: string) {
  return `${config.PUBLIC_API_URL.replace(/\/$/, "")}/media/${storageKey.replace(/\\/g, "/")}`;
}

export async function storeObject(input: StoreObjectInput): Promise<StoredObject> {
  const normalizedExtension = input.extension.startsWith(".") ? input.extension : `.${input.extension}`;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${input.fileNamePrefix}-${timestamp}-${crypto.randomUUID()}${normalizedExtension}`;
  const storageKey = path.join(input.folder, fileName);
  const absolutePath = path.join(mediaRoot, storageKey);

  await ensureFolder(input.folder);
  await fs.writeFile(absolutePath, input.buffer);

  return {
    storageKey,
    publicUrl: buildPublicUrl(storageKey),
    bytes: input.buffer.byteLength,
    mimeType: input.mimeType,
  };
}

export async function generateReportFile(sessionId: string, reportText: string) {
  return storeObject({
    buffer: Buffer.from(reportText, "utf-8"),
    mimeType: "text/plain",
    folder: "reports",
    extension: ".txt",
    fileNamePrefix: `report-${sessionId}`,
  });
}

export function getMediaRootDirectory() {
  return mediaRoot;
}
