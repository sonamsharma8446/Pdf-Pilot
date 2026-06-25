export interface PageRange {
  start: number;
  end: number;
}

const RANGE_TOKEN = /^(\d+)(?:-(\d+))?$/;

export function parsePageRanges(input: string, totalPages: number): PageRange[] {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Enter at least one page or page range (e.g. 1-3,5,7-10).");
  }

  const segments = trimmed.split(",").map((segment) => segment.trim());
  const ranges: PageRange[] = [];

  for (const segment of segments) {
    if (!segment) {
      throw new Error("Page ranges can't contain empty segments — check for stray commas.");
    }

    const match = RANGE_TOKEN.exec(segment);
    if (!match) {
      throw new Error(`"${segment}" isn't a valid page or range. Use page numbers and ranges like 1-3,5,7-10.`);
    }

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;

    if (start < 1 || end < 1) {
      throw new Error("Page numbers must be 1 or greater.");
    }
    if (start > end) {
      throw new Error(`"${segment}" is backwards — the start page must come before the end page.`);
    }
    if (totalPages > 0 && end > totalPages) {
      throw new Error(`Page ${end} doesn't exist — this PDF only has ${totalPages} page${totalPages === 1 ? "" : "s"}.`);
    }

    ranges.push({ start, end });
  }

  return ranges;
}

export function flattenToPageNumbers(ranges: PageRange[]): number[] {
  const pages = new Set<number>();
  for (const range of ranges) {
    for (let page = range.start; page <= range.end; page++) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}

export function getPageRangeError(input: string, totalPages: number): string | null {
  try {
    parsePageRanges(input, totalPages);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid page range.";
  }
}
