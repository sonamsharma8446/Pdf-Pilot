import { useCallback, useState } from "react";
import { convertPdfToImages } from "@/features/pdfToImages/api/pdfToImagesApi";
import type { DpiLevel, ImageFormat } from "@/features/pdfToImages/types";
import { useRecentFiles } from "@/features/recentFiles/hooks/useRecentFiles";
import { useToast } from "@/shared/hooks/useToast";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { getPdfPageCount } from "@/shared/lib/pdf";
import { getPageRangeError } from "@/shared/lib/pageRange";

export function usePdfToImages() {
  const [file, setFileState] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
  const [format, setFormat] = useState<ImageFormat>("jpeg");
  const [dpi, setDpi] = useState<DpiLevel>("medium");
  const [quality, setQuality] = useState(85);
  const [rangeInput, setRangeInput] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  const { showToast } = useToast();
  const { addEntry } = useRecentFiles();

  const setFile = useCallback((newFile: File) => {
    setFileState(newFile);
    setPageCount(null);
    setRangeInput("");
    setIsLoadingPageCount(true);
    getPdfPageCount(newFile)
      .then((count) => setPageCount(count))
      .catch(() => setPageCount(null))
      .finally(() => setIsLoadingPageCount(false));
  }, []);

  const clearFile = useCallback(() => {
    setFileState(null);
    setPageCount(null);
    setRangeInput("");
  }, []);

  const rangeError =
    rangeInput.trim().length > 0 ? getPageRangeError(rangeInput, pageCount ?? 0) : null;

  const convert = useCallback(async () => {
    if (!file) { showToast("error", "Add a PDF file to convert."); return; }
    if (rangeInput.trim() && rangeError) { showToast("error", rangeError); return; }

    setIsConverting(true);
    try {
      const { blob, filename } = await convertPdfToImages(
        file, format, dpi, quality,
        rangeInput.trim() || undefined
      );
      downloadBlob(blob, filename);
      addEntry({ fileName: filename, operation: `PDF → ${format.toUpperCase()}`, pageCount: pageCount ?? undefined });
      showToast("success", "Your images are ready and downloading now.");
      clearFile();
    } catch (error) {
      const message = await extractApiErrorMessage(error);
      showToast("error", message);
    } finally {
      setIsConverting(false);
    }
  }, [file, format, dpi, quality, rangeInput, rangeError, pageCount, showToast, addEntry, clearFile]);

  return {
    file, pageCount, isLoadingPageCount,
    format, setFormat,
    dpi, setDpi,
    quality, setQuality,
    rangeInput, setRangeInput, rangeError,
    isConverting,
    setFile, clearFile, convert,
  };
}
