import { useCallback, useState } from "react";
import { rotatePdfFile } from "@/features/rotate/api/rotateApi";
import type { RotationAngle, RotationTarget } from "@/features/rotate/types";
import { useRecentFiles } from "@/features/recentFiles/hooks/useRecentFiles";
import { useToast } from "@/shared/hooks/useToast";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

export function useRotatePdf() {
  const [file, setFileState] = useState<File | null>(null);
  const [angle, setAngle] = useState<RotationAngle>(90);
  const [target, setTarget] = useState<RotationTarget>("all");
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [isRotating, setIsRotating] = useState(false);

  const { showToast } = useToast();
  const { addEntry } = useRecentFiles();

  const setFile = useCallback((newFile: File) => {
    setFileState(newFile);
    setSelectedPages(new Set());
    setTarget("all");
  }, []);

  const clearFile = useCallback(() => {
    setFileState(null);
    setSelectedPages(new Set());
  }, []);

  const togglePage = useCallback((pageNumber: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) next.delete(pageNumber);
      else next.add(pageNumber);
      return next;
    });
  }, []);

  const selectAll = useCallback((pageCount: number) => {
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
  }, []);

  const clearSelection = useCallback(() => setSelectedPages(new Set()), []);

  const rotate = useCallback(
    async (pageCount: number | null) => {
      if (!file) { showToast("error", "Add a PDF file to rotate."); return; }
      if (target === "selected" && selectedPages.size === 0) {
        showToast("error", "Select at least one page to rotate.");
        return;
      }

      setIsRotating(true);
      try {
        const { blob, filename } = await rotatePdfFile(
          file,
          angle,
          target,
          target === "selected" ? [...selectedPages] : undefined
        );
        downloadBlob(blob, filename);
        addEntry({ fileName: filename, operation: `Rotated ${angle}°`, pageCount: pageCount ?? undefined });
        showToast("success", "Your rotated PDF is ready and downloading now.");
        clearFile();
      } catch (error) {
        const message = await extractApiErrorMessage(error);
        showToast("error", message);
      } finally {
        setIsRotating(false);
      }
    },
    [file, angle, target, selectedPages, showToast, addEntry, clearFile]
  );

  return {
    file,
    angle,
    setAngle,
    target,
    setTarget,
    selectedPages,
    togglePage,
    selectAll,
    clearSelection,
    isRotating,
    setFile,
    clearFile,
    rotate,
  };
}
