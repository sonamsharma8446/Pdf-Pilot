import { api } from "@/shared/lib/api";
import { getFilenameFromContentDisposition } from "@/shared/lib/downloadBlob";
import type { DpiLevel, ImageFormat } from "@/features/pdfToImages/types";

export interface PdfToImagesResult {
  blob: Blob;
  filename: string;
}

export async function convertPdfToImages(
  file: File,
  format: ImageFormat,
  dpi: DpiLevel,
  quality: number,
  rangeInput?: string
): Promise<PdfToImagesResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("format", format);
  formData.append("dpi", dpi);
  formData.append("quality", String(quality));
  if (rangeInput?.trim()) formData.append("rangeInput", rangeInput.trim());

  const response = await api.post<Blob>("/api/pdf-to-images", formData, {
    responseType: "blob",
  });

  const fallback = file.name.replace(/\.pdf$/i, "-images.zip");
  return {
    blob: response.data,
    filename: getFilenameFromContentDisposition(response.headers["content-disposition"], fallback),
  };
}
