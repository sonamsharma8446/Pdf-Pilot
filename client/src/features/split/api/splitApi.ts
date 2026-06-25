import { api } from "@/shared/lib/api";
import { getFilenameFromContentDisposition } from "@/shared/lib/downloadBlob";
import type { SplitMode } from "@/features/split/types";

export interface SplitResult {
  blob: Blob;
  filename: string;
}

export async function splitPdfFile(file: File, mode: SplitMode, rangeInput?: string): Promise<SplitResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mode", mode);
  if (rangeInput) formData.append("rangeInput", rangeInput);

  const response = await api.post<Blob>("/api/split", formData, {
    responseType: "blob",
  });

  const fallback = mode === "extract" ? "split.pdf" : "split.zip";

  return {
    blob: response.data,
    filename: getFilenameFromContentDisposition(response.headers["content-disposition"], fallback),
  };
}
