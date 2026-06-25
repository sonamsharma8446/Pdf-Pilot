import { useCallback, useState } from "react";
import { compressPdfFile, type CompressionLevel, type CompressResult } from "@/features/compress/api/compressApi";
import { useRecentFiles } from "@/features/recentFiles/hooks/useRecentFiles";
import { useToast } from "@/shared/hooks/useToast";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { getPdfPageCount } from "@/shared/lib/pdf";

export interface CompressState {
  file: File | null;
  pageCount: number | null;
  isLoadingPageCount: boolean;
  level: CompressionLevel;
  isCompressing: boolean;
  result: CompressResult | null;
}

export function useCompressPdf() {
  const [file, setFileState] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
  const [level, setLevel] = useState<CompressionLevel>("medium");
  const [isCompressing, setIsCompressing] = useState(false);
  const [result, setResult] = useState<CompressResult | null>(null);

  const { showToast } = useToast();
  const { addEntry } = useRecentFiles();

  const setFile = useCallback((newFile: File) => {
    setFileState(newFile);
    setResult(null);
    setPageCount(null);
    setIsLoadingPageCount(true);
    getPdfPageCount(newFile)
      .then((count) => setPageCount(count))
      .catch(() => setPageCount(null))
      .finally(() => setIsLoadingPageCount(false));
  }, []);

  const clearFile = useCallback(() => {
    setFileState(null);
    setPageCount(null);
    setResult(null);
  }, []);

  const compress = useCallback(async () => {
    if (!file) {
      showToast("error", "Add a PDF file to compress.");
      return;
    }

    setIsCompressing(true);
    setResult(null);
    try {
      const compressResult = await compressPdfFile(file, level);
      setResult(compressResult);

      addEntry({
        fileName: compressResult.filename,
        operation: `Compressed (${level})`,
        pageCount: pageCount ?? undefined,
      });

      showToast("success", "Compression complete — check the results below before downloading.");
    } catch (error) {
      const message = await extractApiErrorMessage(error);
      showToast("error", message);
    } finally {
      setIsCompressing(false);
    }
  }, [file, level, pageCount, showToast, addEntry]);

  const download = useCallback(() => {
    if (!result) return;
    downloadBlob(result.blob, result.filename);
  }, [result]);

  return {
    file,
    pageCount,
    isLoadingPageCount,
    level,
    setLevel,
    isCompressing,
    result,
    setFile,
    clearFile,
    compress,
    download,
  };
}
