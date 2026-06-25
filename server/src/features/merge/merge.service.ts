import { PDFDocument } from "pdf-lib";
import { verifyFileContent } from "../../middleware/upload.js";
import { FileValidationError, PdfProcessingError } from "../../shared/errors/AppError.js";
import type { MergeInput } from "./merge.types.js";

const PDF_ONLY = new Set(["application/pdf"]);

/**
 * Multiple files held in memory simultaneously, multiplied by the upload
 * size ceiling, is what actually bounds RAM usage per request — keeping
 * this lower than the route's raw multer maxCount is a deliberate guard,
 * not an oversight. Revisit if/when the server moves off a memory-only
 * upload strategy.
 */
const MAX_FILES_PER_MERGE = 10;

export async function mergePdfs(inputs: MergeInput[]): Promise<Buffer> {
  if (inputs.length < 2) {
    throw new FileValidationError("Select at least two PDF files to merge.");
  }

  if (inputs.length > MAX_FILES_PER_MERGE) {
    throw new FileValidationError(`You can merge up to ${MAX_FILES_PER_MERGE} files at once.`);
  }

  const mergedPdf = await PDFDocument.create();

  for (const { buffer, originalName } of inputs) {
    await verifyFileContent(buffer, PDF_ONLY, "PDF");

    let sourcePdf: PDFDocument;
    try {
      sourcePdf = await PDFDocument.load(buffer);
    } catch {
      throw new PdfProcessingError(
        `"${originalName}" couldn't be read — it may be corrupted or password-protected.`
      );
    }

    const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  return Buffer.from(mergedBytes);
}
