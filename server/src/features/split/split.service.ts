import { PDFDocument } from "pdf-lib";
import { verifyFileContent } from "../../middleware/upload.js";
import { copyPdfMetadata } from "../../shared/utils/pdfMeta.js";
import { FileValidationError, PdfProcessingError } from "../../shared/errors/AppError.js";
import { parsePageRanges, flattenToPageNumbers } from "./pageRange.js";
import type { SplitRequest, SplitOutputFile, PageRange } from "./split.types.js";

const PDF_ONLY = new Set(["application/pdf"]);

function baseName(originalName: string): string {
  return originalName.replace(/\.pdf$/i, "");
}

async function buildPdfFromPages(source: PDFDocument, pageIndices: number[]): Promise<Buffer> {
  const output = await PDFDocument.create();
  await copyPdfMetadata(source, output);
  const copiedPages = await output.copyPages(source, pageIndices);
  copiedPages.forEach((page) => output.addPage(page));
  return Buffer.from(await output.save());
}

export async function splitPdf(request: SplitRequest): Promise<SplitOutputFile[]> {
  const { buffer, originalName, mode } = request;

  await verifyFileContent(buffer, PDF_ONLY, "PDF");

  let sourcePdf: PDFDocument;
  try {
    sourcePdf = await PDFDocument.load(buffer);
  } catch {
    throw new PdfProcessingError(
      `"${originalName}" couldn't be read — it may be corrupted or password-protected.`
    );
  }

  const totalPages = sourcePdf.getPageCount();
  const name = baseName(originalName);

  if (mode === "all") {
    const outputs: SplitOutputFile[] = [];
    for (let i = 0; i < totalPages; i++) {
      const fileBuffer = await buildPdfFromPages(sourcePdf, [i]);
      outputs.push({ name: `${name}-page-${i + 1}.pdf`, buffer: fileBuffer });
    }
    return outputs;
  }

  if (!request.rangeInput) {
    throw new FileValidationError("Enter at least one page or page range (e.g. 1-3,5,7-10).");
  }

  const ranges: PageRange[] = parsePageRanges(request.rangeInput, totalPages);

  if (mode === "extract") {
    const pageNumbers = flattenToPageNumbers(ranges);
    const pageIndices = pageNumbers.map((pageNumber) => pageNumber - 1);
    const fileBuffer = await buildPdfFromPages(sourcePdf, pageIndices);
    return [{ name: `${name}-extracted.pdf`, buffer: fileBuffer }];
  }

  // mode === "ranges" — each comma-separated segment becomes its own file
  const outputs: SplitOutputFile[] = [];
  for (const range of ranges) {
    const pageIndices = Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start - 1 + i);
    const fileBuffer = await buildPdfFromPages(sourcePdf, pageIndices);
    const label = range.start === range.end ? `page-${range.start}` : `pages-${range.start}-${range.end}`;
    outputs.push({ name: `${name}-${label}.pdf`, buffer: fileBuffer });
  }
  return outputs;
}
