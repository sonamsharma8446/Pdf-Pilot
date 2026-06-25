import { api } from "@/shared/lib/api";
import { getFilenameFromContentDisposition } from "@/shared/lib/downloadBlob";

export async function convertImagesToPdf(
  files: File[],
  pageSize: string,
  orientation: string,
  margin: string
) {
  const formData = new FormData();

  files.forEach(file => formData.append("images", file));
  formData.append("pageSize", pageSize);
  formData.append("orientation", orientation);
  formData.append("margin", margin);

  const response = await api.post<Blob>("/api/image-to-pdf", formData, {
    responseType: "blob",
  });

  const fallback = "images.pdf";
  return {
    blob: response.data,
    filename: getFilenameFromContentDisposition(
      response.headers["content-disposition"],
      fallback
    ),
  };
}