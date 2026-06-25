import { useCallback, useState } from "react";
import { splitPdfFile } from "@/features/split/api/splitApi";
import type { SplitMode } from "@/features/split/types";
import { useRecentFiles } from "@/features/recentFiles/hooks/useRecentFiles";
import { useToast } from "@/shared/hooks/useToast";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { getPdfPageCount } from "@/shared/lib/pdf";
import { getPageRangeError } from "@/shared/lib/pageRange";

export function useSplitPdf() {
  const [file, setFileState] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);
  const [mode, setMode] = useState<SplitMode>("all");
  const [rangeInput, setRangeInput] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);

  const { showToast } = useToast();
  const { addEntry } = useRecentFiles();

  const setFile = useCallback((newFile: File) => {
    setFileState(newFile);
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
    setRangeInput("");
  }, []);

  const rangeError =
    mode !== "all" && rangeInput.trim().length > 0 ? getPageRangeError(rangeInput, pageCount ?? 0) : null;

  const split = useCallback(async () => {
    if (!file) {
      showToast("error", "Add a PDF file to split.");
      return;
    }

    if (mode !== "all") {
      const validationError = getPageRangeError(rangeInput, pageCount ?? 0);
      if (validationError) {
        showToast("error", validationError);
        return;
      }
    }

    setIsSplitting(true);
    try {
      const { blob, filename } = await splitPdfFile(file, mode, mode === "all" ? undefined : rangeInput);
      downloadBlob(blob, filename);

      const operationLabel = mode === "all" ? "Split (every page)" : mode === "extract" ? "Extracted pages" : "Split (ranges)";
      addEntry({ fileName: filename, operation: operationLabel, pageCount: pageCount ?? undefined });

      showToast("success", "Your file is ready and downloading now.");
      clearFile();
    } catch (error) {
      const message = await extractApiErrorMessage(error);
      showToast("error", message);
    } finally {
      setIsSplitting(false);
    }
  }, [file, mode, rangeInput, pageCount, showToast, addEntry, clearFile]);

  return {
    file,
    pageCount,
    isLoadingPageCount,
    mode,
    setMode,
    rangeInput,
    setRangeInput,
    rangeError,
    isSplitting,
    setFile,
    clearFile,
    split,
  };
}
