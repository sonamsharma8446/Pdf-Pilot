import { api } from "@/shared/lib/api";
import { getFilenameFromContentDisposition } from "@/shared/lib/downloadBlob";
import type { WatermarkPosition, WatermarkTarget, WatermarkType } from "@/features/watermark/types";

export interface WatermarkResult {
  blob: Blob;
  filename: string;
}

export interface WatermarkApiParams {
  pdfFile: File;
  type: WatermarkType;
  target: WatermarkTarget;
  position: WatermarkPosition;
  opacity: number;
  rotation: number;
  selectedPages?: number[];
  // text
  text?: string;
  fontSize?: number;
  color?: string;
  // image
  watermarkImage?: File;
  widthPercent?: number;
}

export async function applyWatermark(params: WatermarkApiParams): Promise<WatermarkResult> {
  const form = new FormData();
  form.append("file", params.pdfFile);
  form.append("type", params.type);
  form.append("target", params.target);
  form.append("position", params.position);
  form.append("opacity", String(params.opacity));
  form.append("rotation", String(params.rotation));

  if (params.selectedPages && params.selectedPages.length > 0) {
    form.append("pages", params.selectedPages.join(","));
  }

  if (params.type === "text") {
    form.append("text", params.text ?? "");
    form.append("fontSize", String(params.fontSize ?? 48));
    form.append("color", params.color ?? "#000000");
  } else {
    if (params.watermarkImage) form.append("watermarkImage", params.watermarkImage);
    form.append("widthPercent", String(params.widthPercent ?? 30));
  }

  const response = await api.post<Blob>("/api/watermark", form, { responseType: "blob" });

  return {
    blob: response.data,
    filename: getFilenameFromContentDisposition(
      response.headers["content-disposition"],
      params.pdfFile.name.replace(/\.pdf$/i, "-watermarked.pdf")
    ),
  };
}
