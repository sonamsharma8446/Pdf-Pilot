import { PDFDocument, type PDFImage } from "pdf-lib";
import sharp from "sharp";
import { FileValidationError, PdfProcessingError } from "../../shared/errors/AppError.js";
import {
  PAGE_DIMENSIONS,
  MARGIN_POINTS,
  type ImageToPdfOptions,
  type ImageInput,
  type PageSize,
  type Orientation,
} from "./imageToPdf.types.js";

const IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Convert a Node.js Buffer to a fresh Uint8Array whose byteOffset is 0.
 *
 * Node allocates Buffers from a shared 16 MB pool, so a typical Buffer has
 * a non-zero byteOffset into that pool. pdf-lib's JpegEmbedder / PngEmbedder
 * do `new DataView(imageData.buffer)` which ignores byteOffset and reads from
 * position 0 of the pool instead of from the start of the image data.
 * The result is "SOI not found in JPEG" (or the PNG equivalent) for every
 * buffer that sharp or multer produces.
 *
 * `new Uint8Array(buf)` copies the bytes into a standalone typed array with
 * byteOffset === 0, which is what pdf-lib requires.
 */
function toOwnedUint8Array(buf: Buffer): Uint8Array {
  return new Uint8Array(buf);
}

/**
 * Prepare an image buffer for embedding into pdf-lib.
 *
 * Strategy:
 * - JPEG / PNG from multer: pass directly to pdf-lib after copying to a
 *   fresh Uint8Array (avoids the Node Buffer pool byteOffset bug).
 *   We deliberately skip re-encoding through sharp for these types because:
 *   (a) pdf-lib can embed them natively without transcoding, and
 *   (b) calling sharp on Windows inside a tsx ESM context can hang on
 *       certain Node.js + native-addon combinations.
 * - WebP: must be transcoded because pdf-lib has no WebP embedder.
 *   We convert to JPEG (or PNG if the image has an alpha channel) via sharp.
 */
async function prepareForEmbed(
  buffer: Buffer,
  mimeType: string
): Promise<{ data: Uint8Array; type: "jpeg" | "png" }> {
  if (mimeType === "image/jpeg") {
    return { data: toOwnedUint8Array(buffer), type: "jpeg" };
  }

  if (mimeType === "image/png") {
    return { data: toOwnedUint8Array(buffer), type: "png" };
  }

  // WebP — transcode via sharp
  const meta = await sharp(buffer).metadata();
  if (meta.hasAlpha) {
    const pngBuf = await sharp(buffer).png().toBuffer();
    return { data: toOwnedUint8Array(pngBuf), type: "png" };
  }
  const jpegBuf = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
  return { data: toOwnedUint8Array(jpegBuf), type: "jpeg" };
}

async function embedImage(doc: PDFDocument, data: Uint8Array, type: "jpeg" | "png"): Promise<PDFImage> {
  return type === "png" ? doc.embedPng(data) : doc.embedJpg(data);
}

function resolvePageDimensions(
  imgWidth: number,
  imgHeight: number,
  pageSize: PageSize,
  orientation: Orientation
): { pageWidth: number; pageHeight: number } {
  if (pageSize === "original") {
    // Convert pixels (96 dpi assumed) to points
    const pxToPt = 72 / 96;
    return { pageWidth: imgWidth * pxToPt, pageHeight: imgHeight * pxToPt };
  }

  if (pageSize === "fit") {
    // Page exactly matches the image's natural aspect ratio using A4 long edge
    const longEdge = 841.89;
    const aspect = imgWidth / imgHeight;
    const isLandscape = aspect > 1;
    return isLandscape
      ? { pageWidth: longEdge, pageHeight: longEdge / aspect }
      : { pageWidth: longEdge * aspect, pageHeight: longEdge };
  }

  const base = PAGE_DIMENSIONS[pageSize];
  const isLandscapeImage = imgWidth > imgHeight;
  const shouldRotate =
    orientation === "auto"
      ? isLandscapeImage
      : orientation === "landscape";

  return shouldRotate
    ? { pageWidth: base.height, pageHeight: base.width }
    : { pageWidth: base.width, pageHeight: base.height };
}

export async function imagesToPdf(
  images: ImageInput[],
  options: ImageToPdfOptions
): Promise<Buffer> {
  if (images.length === 0) {
    throw new FileValidationError("Upload at least one image.");
  }

  for (const img of images) {
    if (!IMAGE_MIME_TYPES.has(img.mimeType)) {
      throw new FileValidationError(
        `"${img.originalName}" is not a supported image type. Upload PNG, JPEG, or WebP files.`
      );
    }
  }

  const doc = await PDFDocument.create();
  const margin = MARGIN_POINTS[options.margin];

  for (const image of images) {
    let prepared: { data: Uint8Array; type: "jpeg" | "png" };

    try {
      prepared = await prepareForEmbed(image.buffer, image.mimeType);
    } catch (err) {
      console.error("Image prepare failed:", err);
      throw new PdfProcessingError(
        `"${image.originalName}" couldn't be decoded.`
      );
    }

    let embedded: PDFImage;
    try {
      embedded = await embedImage(doc, prepared.data, prepared.type);
    } catch (err) {
      console.error("Embed failed:", err);
      throw new PdfProcessingError(
        `Failed to embed "${image.originalName}" into the PDF.`
      );
    }

    const { pageWidth, pageHeight } = resolvePageDimensions(
      embedded.width,
      embedded.height,
      options.pageSize,
      options.orientation
    );

    const page = doc.addPage([pageWidth, pageHeight]);
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    // Scale the image to fill the content area while preserving aspect ratio.
    const imgAspect = embedded.width / embedded.height;
    const contentAspect = contentWidth / contentHeight;
    let drawWidth: number;
    let drawHeight: number;

    if (imgAspect > contentAspect) {
      drawWidth = contentWidth;
      drawHeight = contentWidth / imgAspect;
    } else {
      drawHeight = contentHeight;
      drawWidth = contentHeight * imgAspect;
    }

    const x = margin + (contentWidth - drawWidth) / 2;
    const y = margin + (contentHeight - drawHeight) / 2;

    page.drawImage(embedded, { x, y, width: drawWidth, height: drawHeight });
  }

  return Buffer.from(await doc.save());
}
