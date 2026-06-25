export type SplitMode = "all" | "ranges" | "extract";

export interface PageRange {
  start: number; // 1-indexed, inclusive
  end: number; // 1-indexed, inclusive
}

export interface SplitOutputFile {
  name: string;
  buffer: Buffer;
}

export interface SplitRequest {
  buffer: Buffer;
  originalName: string;
  mode: SplitMode;
  rangeInput?: string;
}
