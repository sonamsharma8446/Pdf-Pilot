import { api } from "@/shared/lib/api";
import { getFilenameFromContentDisposition } from "@/shared/lib/downloadBlob";
import type { RotationAngle, RotationTarget } from "@/features/rotate/types";

export interface RotateResult {
  blob: Blob;
  filename: string;
}

export async function rotatePdfFile(
  file: File,
  angle: RotationAngle,
  target: RotationTarget,
  selectedPages?: number[]
): Promise<RotateResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("angle", String(angle));
  formData.append("target", target);
  if (selectedPages && selectedPages.length > 0) {
    formData.append("pages", selectedPages.join(","));
  }

  const response = await api.post<Blob>("/api/rotate", formData, { responseType: "blob" });

  return {
    blob: response.data,
    filename: getFilenameFromContentDisposition(
      response.headers["content-disposition"],
      file.name.replace(/\.pdf$/i, "-rotated.pdf")
    ),
  };
}
