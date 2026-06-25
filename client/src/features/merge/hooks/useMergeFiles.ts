import { useCallback, useState } from "react";
import { mergePdfFiles } from "@/features/merge/api/mergeApi";
import { useRecentFiles } from "@/features/recentFiles/hooks/useRecentFiles";
import { useToast } from "@/shared/hooks/useToast";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { getPdfPageCount } from "@/shared/lib/pdf";

export interface MergeFileEntry {
  id: string;
  file: File;
  pageCount: number | null;
  isLoadingPageCount: boolean;
}

const MAX_FILES = 10; // mirrors the server's MAX_FILES_PER_MERGE

export function useMergeFiles() {
  const [files, setFiles] = useState<MergeFileEntry[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const { showToast } = useToast();
  const { addEntry } = useRecentFiles();

  const loadPageCount = useCallback((id: string, file: File) => {
    getPdfPageCount(file)
      .then((pageCount) => {
        setFiles((current) => current.map((entry) => (entry.id === id ? { ...entry, pageCount, isLoadingPageCount: false } : entry)));
      })
      .catch(() => {
        // Page count is informational, not load-bearing — if it fails to
        // parse client-side, the server's own validation is still the real
        // gate when the user actually hits Merge. Just stop the spinner.
        setFiles((current) =>
          current.map((entry) => (entry.id === id ? { ...entry, isLoadingPageCount: false } : entry))
        );
      });
  }, []);

  const addFiles = useCallback(
    (newFiles: File[]) => {
      setFiles((current) => {
        const availableSlots = MAX_FILES - current.length;
        if (availableSlots <= 0) {
          showToast("error", `You can merge up to ${MAX_FILES} files at once.`);
          return current;
        }

        const filesToAdd = newFiles.slice(0, availableSlots);
        if (newFiles.length > filesToAdd.length) {
          showToast("error", `Only added ${filesToAdd.length} file(s) — the ${MAX_FILES}-file limit was reached.`);
        }

        const newEntries: MergeFileEntry[] = filesToAdd.map((file) => ({
          id: crypto.randomUUID(),
          file,
          pageCount: null,
          isLoadingPageCount: true,
        }));

        newEntries.forEach((entry) => loadPageCount(entry.id, entry.file));

        return [...current, ...newEntries];
      });
    },
    [loadPageCount, showToast]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const moveFile = useCallback((id: string, direction: "up" | "down") => {
    setFiles((current) => {
      const index = current.findIndex((entry) => entry.id === id);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
      return next;
    });
  }, []);

  const reorderFiles = useCallback((newOrder: MergeFileEntry[]) => {
    setFiles(newOrder);
  }, []);

  const merge = useCallback(async () => {
    if (files.length < 2) {
      showToast("error", "Add at least two PDF files to merge.");
      return;
    }

    setIsMerging(true);
    try {
      const { blob, filename } = await mergePdfFiles(files.map((entry) => entry.file));
      downloadBlob(blob, filename);

      const totalPages = files.reduce((sum, entry) => sum + (entry.pageCount ?? 0), 0);
      addEntry({ fileName: filename, operation: "Merged", pageCount: totalPages || undefined });

      showToast("success", "Your merged PDF is ready and downloading now.");
      setFiles([]);
    } catch (error) {
      const message = await extractApiErrorMessage(error);
      showToast("error", message);
    } finally {
      setIsMerging(false);
    }
  }, [files, showToast, addEntry]);

  return { files, isMerging, addFiles, removeFile, moveFile, reorderFiles, merge };
}
