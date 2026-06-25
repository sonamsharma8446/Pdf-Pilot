export type PageSize = "a4" | "letter" | "original" | "fit";
export type Orientation = "portrait" | "landscape" | "auto";
export type Margin = "none" | "small" | "medium" | "large";

export interface ImageToPdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  margin: Margin;
}

export interface ImageInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
}

// Page dimensions in points (1pt = 1/72 inch)
export const PAGE_DIMENSIONS: Record<Exclude<PageSize, "original" | "fit">, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

export const MARGIN_POINTS: Record<Margin, number> = {
  none: 0,
  small: 18,   // 0.25 inch
  medium: 36,  // 0.5 inch
  large: 72,   // 1 inch
};
