export type PageSize = "a4" | "letter" | "original" | "fit";
export type Orientation = "portrait" | "landscape" | "auto";
export type Margin = "none" | "small" | "medium" | "large";

export interface ImageEntry {
  id: string;
  file: File;
  previewUrl: string | null;
}
