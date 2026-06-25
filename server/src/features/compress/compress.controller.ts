import type { Request, Response } from "express";
import { compressPdf } from "./compress.service.js";
import { FileValidationError } from "../../shared/errors/AppError.js";
import { COMPRESSION_QUALITY, type CompressionLevel } from "./compress.types.js";

const VALID_LEVELS = Object.keys(COMPRESSION_QUALITY) as CompressionLevel[];

export async function compressFile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new FileValidationError("No file was received. Select a PDF file and try again.");
  }

  const level = req.body.level as string | undefined;
  if (!level || !VALID_LEVELS.includes(level as CompressionLevel)) {
    throw new FileValidationError("Select a valid compression level: low, medium, or high.");
  }

  const result = await compressPdf(file.buffer, file.originalname, level as CompressionLevel);

  const pct = (((result.originalSize - result.compressedSize) / result.originalSize) * 100).toFixed(1);
  console.info(
    `[compress] level=${level} ${file.originalname} — ${result.originalSize}→${result.compressedSize} bytes (${pct}% reduction, ${result.imagesRecompressed} images)`
  );

  const outputName = file.originalname.replace(/\.pdf$/i, `-compressed.pdf`);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${outputName}"`);
  res.setHeader("Content-Length", result.compressedSize.toString());
  res.setHeader("X-Original-Size", result.originalSize.toString());
  res.setHeader("X-Compressed-Size", result.compressedSize.toString());
  res.setHeader("X-Images-Recompressed", result.imagesRecompressed.toString());
  res.send(result.buffer);
}
