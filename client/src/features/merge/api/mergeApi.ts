import { api } from "@/shared/lib/api";
import { getFilenameFromContentDisposition } from "@/shared/lib/downloadBlob";

export interface MergeResult {
  blob: Blob;
  filename: string;
}

export async function mergePdfFiles(files: File[]): Promise<MergeResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await api.post<Blob>("/api/merge", formData, {
    responseType: "blob",
  });

  return {
    blob: response.data,
    filename: getFilenameFromContentDisposition(response.headers["content-disposition"], "merged.pdf"),
  };
}
