import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

/**
 * Reads a PDF's page count entirely client-side. No network request — the
 * file never leaves the browser just to answer "how many pages is this."
 */
export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });

  try {
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    await loadingTask.destroy();
    return pageCount;
  } catch {
    throw new Error(`"${file.name}" couldn't be read — it may be corrupted or password-protected.`);
  }
}
