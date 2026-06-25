import { useCallback, useState } from "react";
import { convertImagesToPdf } from "@/features/imageToPdf/api/imageToPdfApi";
import type { ImageEntry, Margin, Orientation, PageSize } from "@/features/imageToPdf/types";
import { useRecentFiles } from "@/features/recentFiles/hooks/useRecentFiles";
import { useToast } from "@/shared/hooks/useToast";
import { downloadBlob } from "@/shared/lib/downloadBlob";
import { extractApiErrorMessage } from "@/shared/lib/apiError";

const MAX_IMAGES = 30;

export function useImageToPdf() {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState<Margin>("small");
  const [isConverting, setIsConverting] = useState(false);

  const { showToast } = useToast();
  const { addEntry } = useRecentFiles();

  const addImages = useCallback(
    (files: File[]) => {
      setImages((current) => {
        const available = MAX_IMAGES - current.length;
        if (available <= 0) {
          showToast("error", `You can convert up to ${MAX_IMAGES} images at once.`);
          return current;
        }
        const toAdd = files.slice(0, available);
        if (files.length > toAdd.length) {
          showToast("error", `Only added ${toAdd.length} image(s) — the ${MAX_IMAGES}-image limit was reached.`);
        }

        const newEntries: ImageEntry[] = toAdd.map((file) => ({
          id: crypto.randomUUID(),
          file,
          previewUrl: null,
        }));

        const next = [...current, ...newEntries];

        // Prefer blob URLs for previews (more reliable and fast); fall back
        // to data-URL generation if createObjectURL fails.
        newEntries.forEach((entry, idx) => {
          const file = toAdd[idx];
          try {
            const url = URL.createObjectURL(file);
            setImages((cur) => cur.map((e) => (e.id === entry.id ? { ...e, previewUrl: url } : e)));
            
            console.log("useImageToPdf: created blob URL preview", { name: file.name, size: file.size, url });

            // Optionally generate a data URL in the background if you need one later.
            // We skip that for now to avoid extra memory/cpu work.
            return;
          } catch (err) {
           
            console.warn("useImageToPdf: createObjectURL failed, falling back to FileReader", err, file.name);
          }

          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string | null;
            if (result) {
              setImages((cur) => cur.map((e) => (e.id === entry.id ? { ...e, previewUrl: result } : e)));
              
              console.log("useImageToPdf: generated data URL preview", { name: file.name, size: file.size });
            }
          };
          reader.onerror = (err) => {
            
            console.error("useImageToPdf: failed to read file for preview", err, file.name);
          };
          try {
            reader.readAsDataURL(file);
          } catch (err) {
            
            console.error("useImageToPdf: readAsDataURL threw", err, file.name);
          }
        });

        return next;
      });
    },
    [showToast]
  );

  const removeImage = useCallback((id: string) => {
    setImages((current) => {
      const entry = current.find((e) => e.id === id);
      if (entry && entry.previewUrl && entry.previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(entry.previewUrl);
        } catch {
          // ignore
        }
      }
      return current.filter((e) => e.id !== id);
    });
  }, []);

  const reorderImages = useCallback((newOrder: ImageEntry[]) => {
    setImages(newOrder);
  }, []);

const clearAll = useCallback(() => {
  setImages((current) => {
    current.forEach((e) => {
      if (e.previewUrl && e.previewUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(e.previewUrl);
        } catch {
          // ignore
        }
      }
    });
    return [];
  });
}, []);

  const convert = useCallback(async () => {
    if (images.length === 0) {
      showToast("error", "Add at least one image to convert.");
      return;
    }

    setIsConverting(true);
    try {
      const { blob, filename } = await convertImagesToPdf(
        images.map((e) => e.file),
        pageSize,
        orientation,
        margin
      );
      downloadBlob(blob, filename);
      addEntry({ fileName: filename, operation: "Images → PDF", pageCount: images.length });
      showToast("success", "Your PDF is ready and downloading now.");
      clearAll();
    } catch (error) {
      const message = await extractApiErrorMessage(error);
      showToast("error", message);
    } finally {
      setIsConverting(false);
    }
  }, [images, pageSize, orientation, margin, showToast, addEntry, clearAll]);

  return {
    images,
    pageSize,
    setPageSize,
    orientation,
    setOrientation,
    margin,
    setMargin,
    isConverting,
    addImages,
    removeImage,
    reorderImages,
    clearAll,
    convert,
  };
}
