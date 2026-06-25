export type CompressionLevel = "low" | "medium" | "high";

export interface CompressResult {
  buffer: Buffer;
  originalSize: number;
  compressedSize: number;
  imagesRecompressed: number;
}

export const COMPRESSION_QUALITY: Record<CompressionLevel, number> = {
  low: 80,
  medium: 55,
  high: 35,
};
