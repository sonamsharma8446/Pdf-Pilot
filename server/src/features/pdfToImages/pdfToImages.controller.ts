import type { Request, Response } from "express";
import JSZip from "jszip";
import { pdfToImages } from "./pdfToImages.service.js";
import { FileValidationError } from "../../shared/errors/AppError.js";
import type { DpiLevel, ImageFormat } from "./pdfToImages.types.js";

const VALID_FORMATS: ImageFormat[] = ["png", "jpeg"];
const VALID_DPI_LEVELS: DpiLevel[] = ["low", "medium", "high"];

export async function convertPdfToImages(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new FileValidationError("No file was received. Select a PDF file and try again.");
  }

  const format = req.body.format as string | undefined;
  const dpi = req.body.dpi as string | undefined;
  const rawQuality = Number(req.body.quality ?? 85);
  const rangeInput = typeof req.body.rangeInput === "string" ? req.body.rangeInput : undefined;

  if (!format || !VALID_FORMATS.includes(format as ImageFormat)) {
    throw new FileValidationError("Select a valid output format: png or jpeg.");
  }
  if (!dpi || !VALID_DPI_LEVELS.includes(dpi as DpiLevel)) {
    throw new FileValidationError("Select a valid DPI level: low, medium, or high.");
  }
  if (isNaN(rawQuality) || rawQuality < 1 || rawQuality > 100) {
    throw new FileValidationError("Quality must be a number between 1 and 100.");
  }

  const images = await pdfToImages(file.buffer, file.originalname, {
    format: format as ImageFormat,
    dpi: dpi as DpiLevel,
    quality: rawQuality,
    rangeInput,
  });

  console.info(
    `[pdf-to-images] ${file.originalname} → ${images.length} ${format} @ ${dpi} DPI`
  );

  if (images.length === 1) {
    const single = images[0]!;
    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `attachment; filename="${single.filename}"`);
    res.setHeader("Content-Length", single.buffer.length.toString());
    res.send(single.buffer);
    return;
  }

  const zip = new JSZip();
  images.forEach((img) => zip.file(img.filename, img.buffer));
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  const zipName = file.originalname.replace(/\.pdf$/i, "-images.zip");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipName}"`);
  res.setHeader("Content-Length", zipBuffer.length.toString());
  res.send(zipBuffer);
}
