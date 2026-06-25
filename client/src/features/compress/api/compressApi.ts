import { api } from "@/shared/lib/api";
import { getFilenameFromContentDisposition } from "@/shared/lib/downloadBlob";

export type CompressionLevel = "low" | "medium" | "high";

export interface CompressResult {
  blob: Blob;
  filename: string;
  originalSize: number;
  compressedSize: number;
  imagesRecompressed: number;
}

export async function compressPdfFile(file: File, level: CompressionLevel): Promise<CompressResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("level", level);

  const response = await api.post<Blob>("/api/compress", formData, {
    responseType: "blob",
    onUploadProgress: (e) => {
            console.log("Uploading", e.loaded, e.total);
        }
  });
console.log("Received response");
  const originalSize = Number(response.headers["x-original-size"] ?? file.size);
  const compressedSize = Number(response.headers["x-compressed-size"] ?? 0);
  const imagesRecompressed = Number(response.headers["x-images-recompressed"] ?? 0);

  return {
    blob: response.data,
    filename: getFilenameFromContentDisposition(
      response.headers["content-disposition"],
      file.name.replace(/\.pdf$/i, "-compressed.pdf")
    ),
    originalSize,
    compressedSize,
    imagesRecompressed,
  };
}
