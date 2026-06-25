// ⚠️  This import MUST come first — it registers DOMMatrix, ImageData, and
// Path2D as Node.js globals before pdfjs-dist is loaded. pdfjs v6 checks for
// these globals at module evaluation time, so order matters.
import "../../shared/setup/nodePolyfills.js";

import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { verifyFileContent } from "../../middleware/upload.js";
import {
  AppError,
  PdfProcessingError,
  FileValidationError,
} from "../../shared/errors/AppError.js";
import {
  parsePageRanges,
  flattenToPageNumbers,
} from "./pageRange.js";
import {
  DPI_VALUES,
  type PdfToImagesOptions,
  type RenderedImage,
} from "./pdfToImages.types.js";

const PDF_ONLY = new Set(["application/pdf"]);

// ---------------------------------------------------------------------------
// pdfjs v6 worker setup
//
// Setting workerSrc = "" does NOT work in pdfjs v6 — it treats "" as falsy
// and overwrites it with "./pdf.worker.mjs" (a relative URL that doesn't
// resolve in Node.js). We must point to the actual worker file using a
// file:// URL so pdfjs can load it as a module worker in Node.js.
// ---------------------------------------------------------------------------
const _require = createRequire(import.meta.url);
const pdfjsLegacyDir = _require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
const workerPath = pdfjsLegacyDir.replace(/pdf\.mjs$/, "pdf.worker.mjs");
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyCtx = any;

function baseName(originalName: string): string {
  return originalName.replace(/\.pdf$/i, "");
}

async function renderPage(
  pdf: pdfjs.PDFDocumentProxy,
  pageNum: number,
  scale: number,
  whiteBackground: boolean
) {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = createCanvas(
    Math.ceil(viewport.width),
    Math.ceil(viewport.height)
  );

  const ctx = canvas.getContext("2d") as AnyCtx;

  if (whiteBackground) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  await page.render({
    canvasContext: ctx,
    canvas,
    viewport,
  }).promise;

  page.cleanup();

  return canvas;
}

export async function pdfToImages(
  buffer: Buffer,
  originalName: string,
  options: PdfToImagesOptions
): Promise<RenderedImage[]> {
  await verifyFileContent(buffer, PDF_ONLY, "PDF");

  let loadingTask: ReturnType<typeof pdfjs.getDocument> | null = null;

  try {
    loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      // Suppress verbose logging
      verbosity: 0,
    });

    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    const name = baseName(originalName);
    const scale = DPI_VALUES[options.dpi] / 72;

    let pageNumbers: number[];

    if (options.rangeInput?.trim()) {
      const ranges = parsePageRanges(
        options.rangeInput,
        totalPages
      );
      pageNumbers = flattenToPageNumbers(ranges);
    } else {
      pageNumbers = Array.from(
        { length: totalPages },
        (_, i) => i + 1
      );
    }

    if (pageNumbers.length === 0) {
      throw new FileValidationError(
        "No pages selected for conversion."
      );
    }

    const results: RenderedImage[] = [];
    const padding = String(totalPages).length;

    for (const pageNum of pageNumbers) {
      const canvas = await renderPage(
        pdf,
        pageNum,
        scale,
        options.format === "jpeg"
      );

      const imageBuffer =
        options.format === "jpeg"
          ? canvas.toBuffer("image/jpeg", options.quality / 100)
          : canvas.toBuffer("image/png");

      const ext = options.format === "jpeg" ? "jpg" : "png";

      results.push({
        pageNumber: pageNum,
        filename: `${name}-page-${String(pageNum).padStart(
          padding,
          "0"
        )}.${ext}`,
        buffer: imageBuffer,
      });
    }

    return results;
  } catch (err) {
    // Re-throw known operational errors (e.g. FileValidationError) as-is so
    // the client receives the correct user-facing message instead of the
    // generic "corrupted or password-protected" fallback.
    if (err instanceof AppError) throw err;

    console.error("PDFJS ERROR:", err);

    throw new PdfProcessingError(
      `"${originalName}" couldn't be read — it may be corrupted or password-protected.`
    );
  } finally {
    if (loadingTask) {
      await loadingTask.destroy();
    }
  }
}
