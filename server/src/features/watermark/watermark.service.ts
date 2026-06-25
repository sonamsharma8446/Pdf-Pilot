import { PDFDocument, degrees, rgb, StandardFonts, type PDFPage } from "pdf-lib";
import sharp from "sharp";
import { verifyFileContent } from "../../middleware/upload.js";
import { FileValidationError, PdfProcessingError } from "../../shared/errors/AppError.js";
import type {
  WatermarkRequest,
  WatermarkTarget,
  WatermarkPosition,
  TextWatermarkOptions,
  ImageWatermarkOptions,
} from "./watermark.types.js";

const PDF_ONLY = new Set(["application/pdf"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  const int = parseInt(clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean, 16);
  return { r: ((int >> 16) & 255) / 255, g: ((int >> 8) & 255) / 255, b: (int & 255) / 255 };
}

function resolvePageIndices(
  target: WatermarkTarget,
  totalPages: number,
  selectedPages?: number[]
): number[] {
  switch (target) {
    case "all": return Array.from({ length: totalPages }, (_, i) => i);
    case "odd": return Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 0);
    case "even": return Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 1);
    case "selected":
      if (!selectedPages || selectedPages.length === 0) {
        throw new FileValidationError("Select at least one page for the watermark.");
      }
      return selectedPages.map((p) => p - 1).filter((i) => i >= 0 && i < totalPages);
  }
}

function getWatermarkXY(
  position: WatermarkPosition,
  pageWidth: number,
  pageHeight: number,
  drawWidth: number,
  drawHeight: number,
  margin = 36
): { x: number; y: number } {
  const cx = pageWidth / 2 - drawWidth / 2;
  const cy = pageHeight / 2 - drawHeight / 2;
  const left = margin;
  const right = pageWidth - drawWidth - margin;
  const bottom = margin;
  const top = pageHeight - drawHeight - margin;

  const map: Record<WatermarkPosition, { x: number; y: number }> = {
    center:        { x: cx, y: cy },
    "top-left":    { x: left, y: top },
    "top-center":  { x: cx, y: top },
    "top-right":   { x: right, y: top },
    "bottom-left": { x: left, y: bottom },
    "bottom-center": { x: cx, y: bottom },
    "bottom-right":  { x: right, y: bottom },
  };
  return map[position];
}

async function applyTextWatermark(
  page: PDFPage,
  doc: PDFDocument,
  opts: TextWatermarkOptions
): Promise<void> {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const textWidth = font.widthOfTextAtSize(opts.text, opts.fontSize);
  const textHeight = opts.fontSize;
  const { width, height } = page.getSize();
  const { r, g, b } = hexToRgb(opts.color);
  const { x, y } = getWatermarkXY(opts.position, width, height, textWidth, textHeight);

  page.drawText(opts.text, {
    x,
    y,
    size: opts.fontSize,
    font,
    color: rgb(r, g, b),
    opacity: opts.opacity,
    rotate: degrees(opts.rotation),
  });
}

async function applyImageWatermark(
  page: PDFPage,
  doc: PDFDocument,
  opts: ImageWatermarkOptions
): Promise<void> {
  // Always normalise to PNG so we only need one embed path and alpha is preserved.
  const pngBuffer = await sharp(opts.imageBuffer).png().toBuffer();
  const embedded = await doc.embedPng(pngBuffer);

  const { width, height } = page.getSize();
  const drawWidth = (opts.widthPercent / 100) * width;
  const drawHeight = (embedded.height / embedded.width) * drawWidth;
  const { x, y } = getWatermarkXY(opts.position, width, height, drawWidth, drawHeight);

  page.drawImage(embedded, {
    x,
    y,
    width: drawWidth,
    height: drawHeight,
    opacity: opts.opacity,
    rotate: degrees(opts.rotation),
  });
}

export async function applyWatermark(request: WatermarkRequest): Promise<Buffer> {
  const { pdfBuffer, originalName, watermark, target, selectedPages } = request;

  await verifyFileContent(pdfBuffer, PDF_ONLY, "PDF");

  if (watermark.type === "image" && !IMAGE_TYPES.has(watermark.imageMime)) {
    throw new FileValidationError("Watermark image must be a PNG, JPEG, or WebP file.");
  }

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(pdfBuffer);
  } catch {
    throw new PdfProcessingError(
      `"${originalName}" couldn't be read — it may be corrupted or password-protected.`
    );
  }

  const pages = doc.getPages();
  const indices = resolvePageIndices(target, pages.length, selectedPages);

  for (const index of indices) {
    const page = pages[index]!;
    if (watermark.type === "text") {
      await applyTextWatermark(page, doc, watermark);
    } else {
      await applyImageWatermark(page, doc, watermark);
    }
  }

  return Buffer.from(await doc.save());
}
