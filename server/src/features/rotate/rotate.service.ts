import { PDFDocument, degrees } from "pdf-lib";
import { verifyFileContent } from "../../middleware/upload.js";
import { FileValidationError, PdfProcessingError } from "../../shared/errors/AppError.js";
import type { RotateRequest, RotationTarget } from "./rotate.types.js";

const PDF_ONLY = new Set(["application/pdf"]);

function resolvePageIndices(
  target: RotationTarget,
  totalPages: number,
  selectedPages?: number[]
): number[] {
  switch (target) {
    case "all":
      return Array.from({ length: totalPages }, (_, i) => i);
    case "odd":
      // page 1, 3, 5… → indices 0, 2, 4…
      return Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 0);
    case "even":
      return Array.from({ length: totalPages }, (_, i) => i).filter((i) => i % 2 === 1);
    case "selected": {
      if (!selectedPages || selectedPages.length === 0) {
        throw new FileValidationError("Select at least one page to rotate.");
      }
      return selectedPages
        .map((p) => p - 1)
        .filter((i) => i >= 0 && i < totalPages);
    }
  }
}

export async function rotatePdf(request: RotateRequest): Promise<Buffer> {
  const { buffer, originalName, angle, target, selectedPages } = request;

  await verifyFileContent(buffer, PDF_ONLY, "PDF");

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(buffer);
  } catch {
    throw new PdfProcessingError(
      `"${originalName}" couldn't be read — it may be corrupted or password-protected.`
    );
  }

  const pages = doc.getPages();
  const indices = resolvePageIndices(target, pages.length, selectedPages);

  for (const index of indices) {
    const page = pages[index]!;
    // Accumulate with the existing rotation so pre-rotated pages are respected.
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }

  return Buffer.from(await doc.save());
}
