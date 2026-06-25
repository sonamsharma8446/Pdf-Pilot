import type { Request, Response } from "express";
import { imagesToPdf } from "./imageToPdf.service.js";
import { FileValidationError } from "../../shared/errors/AppError.js";
import type { ImageToPdfOptions, Margin, Orientation, PageSize } from "./imageToPdf.types.js";

const VALID_PAGE_SIZES: PageSize[] = ["a4", "letter", "original", "fit"];
const VALID_ORIENTATIONS: Orientation[] = ["portrait", "landscape", "auto"];
const VALID_MARGINS: Margin[] = ["none", "small", "medium", "large"];

export async function convertImagesToPdf(req: Request, res: Response): Promise<void> {
  console.log("✅ imagesToPdf called");
  console.log("✅ Controller reached");
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new FileValidationError("No images received");
  }

  const { pageSize, orientation, margin } = req.body;

  if (!VALID_PAGE_SIZES.includes(pageSize)) {
    throw new FileValidationError("Invalid page size");
  }

  if (!VALID_ORIENTATIONS.includes(orientation)) {
    throw new FileValidationError("Invalid orientation");
  }

  if (!VALID_MARGINS.includes(margin)) {
    throw new FileValidationError("Invalid margin");
  }

  const images = files.map(f => ({
    buffer: f.buffer,
    originalName: f.originalname,
    mimeType: f.mimetype,
  }));

  const pdfBuffer = await imagesToPdf(images, {
    pageSize,
    orientation,
    margin,
  } as ImageToPdfOptions);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=\"images.pdf\"");
  res.setHeader("Content-Length", pdfBuffer.length.toString());
  res.send(pdfBuffer);
}
