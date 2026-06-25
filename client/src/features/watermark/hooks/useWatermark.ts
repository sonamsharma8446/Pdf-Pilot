import { useCallback, useState } from "react";
import { applyWatermark } from "@/features/watermark/api/watermarkApi";
import type { WatermarkPosition, WatermarkTarget, WatermarkType } from "@/features/watermark/types";
import { useRecentFiles } from "@/features/recentFiles/hooks/useRecentFiles";
import { useToast } from "@/shared/hooks/useToast";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { extractApiErrorMessage } from "@/shared/lib/apiError";
import { getPdfPageCount } from "@/shared/lib/pdf";

export function useWatermark() {
  const [pdfFile, setPdfFileState] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [isLoadingPageCount, setIsLoadingPageCount] = useState(false);

  const [type, setType] = useState<WatermarkType>("text");
  const [target, setTarget] = useState<WatermarkTarget>("all");
  const [position, setPosition] = useState<WatermarkPosition>("center");
  const [opacity, setOpacity] = useState(0.4);
  const [rotation, setRotation] = useState(0);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  // text
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#000000");

  // image
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [watermarkImagePreview, setWatermarkImagePreview] = useState<string | null>(null);
  const [widthPercent, setWidthPercent] = useState(30);

  const [isApplying, setIsApplying] = useState(false);

  const { showToast } = useToast();
  const { addEntry } = useRecentFiles();

  const setPdfFile = useCallback((file: File) => {
    setPdfFileState(file);
    setPageCount(null);
    setSelectedPages(new Set());
    setIsLoadingPageCount(true);
    getPdfPageCount(file)
      .then(setPageCount)
      .catch(() => setPageCount(null))
      .finally(() => setIsLoadingPageCount(false));
  }, []);

  const clearPdfFile = useCallback(() => {
    setPdfFileState(null);
    setPageCount(null);
    setSelectedPages(new Set());
  }, []);

  const setWatermarkImg = useCallback((file: File | null) => {
    if (watermarkImagePreview) URL.revokeObjectURL(watermarkImagePreview);
    setWatermarkImage(file);
    setWatermarkImagePreview(file ? URL.createObjectURL(file) : null);
  }, [watermarkImagePreview]);

  const togglePage = useCallback((n: number) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n); else next.add(n);
      return next;
    });
  }, []);

  const apply = useCallback(async () => {
    if (!pdfFile) { showToast("error", "Add a PDF file first."); return; }
    if (type === "text" && !text.trim()) { showToast("error", "Enter watermark text."); return; }
    if (type === "image" && !watermarkImage) { showToast("error", "Upload a watermark image."); return; }
    if (target === "selected" && selectedPages.size === 0) {
      showToast("error", "Select at least one page.");
      return;
    }

    setIsApplying(true);
    try {
      const { blob, filename } = await applyWatermark({
        pdfFile, type, target, position, opacity, rotation,
        selectedPages: target === "selected" ? [...selectedPages] : undefined,
        text: type === "text" ? text : undefined,
        fontSize: type === "text" ? fontSize : undefined,
        color: type === "text" ? color : undefined,
        watermarkImage: type === "image" ? (watermarkImage ?? undefined) : undefined,
        widthPercent: type === "image" ? widthPercent : undefined,
      });
      downloadBlob(blob, filename);
      addEntry({ fileName: filename, operation: "Watermarked", pageCount: pageCount ?? undefined });
      showToast("success", "Your watermarked PDF is downloading now.");
      clearPdfFile();
    } catch (error) {
      const message = await extractApiErrorMessage(error);
      showToast("error", message);
    } finally {
      setIsApplying(false);
    }
  }, [pdfFile, type, target, position, opacity, rotation, selectedPages, text, fontSize, color,
    watermarkImage, widthPercent, pageCount, showToast, addEntry, clearPdfFile]);

  return {
    pdfFile, setPdfFile, clearPdfFile,
    pageCount, isLoadingPageCount,
    type, setType,
    target, setTarget,
    position, setPosition,
    opacity, setOpacity,
    rotation, setRotation,
    selectedPages, togglePage,
    text, setText,
    fontSize, setFontSize,
    color, setColor,
    watermarkImage, watermarkImagePreview, setWatermarkImg,
    widthPercent, setWidthPercent,
    isApplying, apply,
  };
}
