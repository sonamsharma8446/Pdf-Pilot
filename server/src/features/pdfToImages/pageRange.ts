import { FileValidationError } from "../../shared/errors/AppError.js";

export interface PageRange {
  start: number;
  end: number;
}

const RANGE_TOKEN = /^(\d+)(?:-(\d+))?$/;

export function parsePageRanges(input: string, totalPages: number): PageRange[] {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new FileValidationError("Enter at least one page or page range (e.g. 1-3,5,7-10).");
  }

  const segments = trimmed.split(",").map((s) => s.trim());
  const ranges: PageRange[] = [];

  for (const segment of segments) {
    if (!segment) {
      throw new FileValidationError("Page ranges can't contain empty segments — check for stray commas.");
    }

    const match = RANGE_TOKEN.exec(segment);
    if (!match) {
      throw new FileValidationError(
        `"${segment}" isn't a valid page or range. Use page numbers and ranges like 1-3,5,7-10.`
      );
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;

    if (start < 1 || end < 1) throw new FileValidationError("Page numbers must be 1 or greater.");
    if (start > end) {
      throw new FileValidationError(
        `"${segment}" is backwards — the start page must come before the end page.`
      );
    }
    if (end > totalPages) {
      throw new FileValidationError(
        `Page ${end} doesn't exist — this PDF only has ${totalPages} page${totalPages === 1 ? "" : "s"}.`
      );
    }

    ranges.push({ start, end });
  }

  return ranges;
}

export function flattenToPageNumbers(ranges: PageRange[]): number[] {
  const pages = new Set<number>();
  for (const range of ranges) {
    for (let p = range.start; p <= range.end; p++) pages.add(p);
  }
  return [...pages].sort((a, b) => a - b);
}
