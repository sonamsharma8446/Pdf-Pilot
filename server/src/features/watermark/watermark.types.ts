export type WatermarkType = "text" | "image";
export type WatermarkPosition =
  | "center"
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
export type WatermarkTarget = "all" | "odd" | "even" | "selected";

export interface TextWatermarkOptions {
  type: "text";
  text: string;
  fontSize: number;
  color: string; // hex e.g. "#ff0000"
  opacity: number; // 0–1
  rotation: number; // degrees
  position: WatermarkPosition;
}

export interface ImageWatermarkOptions {
  type: "image";
  imageBuffer: Buffer;
  imageMime: string;
  widthPercent: number; // % of page width
  opacity: number;
  rotation: number;
  position: WatermarkPosition;
}

export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions;

export interface WatermarkRequest {
  pdfBuffer: Buffer;
  originalName: string;
  watermark: WatermarkOptions;
  target: WatermarkTarget;
  selectedPages?: number[];
}
