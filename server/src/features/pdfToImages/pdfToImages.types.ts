export type ImageFormat = "png" | "jpeg";
export type DpiLevel = "low" | "medium" | "high";

export const DPI_VALUES: Record<DpiLevel, number> = {
  low: 72,
  medium: 150,
  high: 300,
};

export interface PdfToImagesOptions {
  format: ImageFormat;
  dpi: DpiLevel;
  quality: number; // 1–100, only applies to JPEG
  rangeInput?: string; // optional page range e.g. "1-3,5"
}

export interface RenderedImage {
  pageNumber: number;
  buffer: Buffer;
  filename: string;
}
