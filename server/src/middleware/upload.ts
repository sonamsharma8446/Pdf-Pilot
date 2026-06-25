import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import type { Request } from "express";
import { env } from "../config/env.js";
import { FileValidationError } from "../shared/errors/AppError.js";

export const PDF_MIME_TYPES = new Set([
  "application/pdf",
]);

export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ACCEPTED_UPLOAD_TYPES = new Set([
  ...PDF_MIME_TYPES,
  ...IMAGE_MIME_TYPES,
]);

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, // per-file cap
    files: 30,       // max files per request (matches client MAX_IMAGES = 30)
    fields: 10,      // max non-file form fields per request
    fieldSize: 1024, // 1 KB per text field — these are just option strings (pageSize, margin…)
    parts: 40,       // fields + files combined — keeps multipart parsing bounded
  },
  fileFilter: (_req: Request, file, callback) => {
    if (!ACCEPTED_UPLOAD_TYPES.has(file.mimetype)) {
      callback(
        new FileValidationError(
          `Unsupported file type: ${file.mimetype}`
        )
      );
      return;
    }

    callback(null, true);
  },
});

export async function verifyFileContent(
  buffer: Buffer,
  allowedTypes: Set<string>,
  description: string
): Promise<void> {
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected || !allowedTypes.has(detected.mime)) {
    throw new FileValidationError(
      `This file's content doesn't match a supported ${description}.`
    );
  }
}
