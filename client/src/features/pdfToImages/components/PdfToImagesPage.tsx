import { Images, FileText, X, Loader2 } from "lucide-react";
import { UploadZone } from "@/shared/components/UploadZone";
import { Button } from "@/shared/components/Button";
import { TextField } from "@/shared/components/TextField";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatFileSize } from "@/shared/lib/format";
import { usePdfToImages } from "@/features/pdfToImages/hooks/usePdfToImages";
import { usePdfThumbnails } from "@/features/rotate/hooks/usePdfThumbnails";
import { useToast } from "@/shared/hooks/useToast";
import type { DpiLevel, ImageFormat } from "@/features/pdfToImages/types";

const PDF_ONLY = { "application/pdf": [".pdf"] };

const FORMAT_OPTIONS: { value: ImageFormat; label: string; description: string }[] = [
  { value: "jpeg", label: "JPEG", description: "Smaller files, great for photos" },
  { value: "png", label: "PNG", description: "Lossless, best for text" },
];

const DPI_OPTIONS: { value: DpiLevel; label: string; description: string }[] = [
  { value: "low", label: "Low", description: "72 DPI — screen viewing" },
  { value: "medium", label: "Medium", description: "150 DPI — general use" },
  { value: "high", label: "High", description: "300 DPI — print quality" },
];

export function PdfToImagesPage() {
  const {
    file, pageCount, isLoadingPageCount,
    format, setFormat,
    dpi, setDpi,
    quality, setQuality,
    rangeInput, setRangeInput, rangeError,
    isConverting,
    setFile, clearFile, convert,
  } = usePdfToImages();

  const { thumbnails, isLoadingThumbnails } = usePdfThumbnails(file);
  const { showToast } = useToast();

  function handleFilesAdded(files: File[]) {
    if (files.length > 1) showToast("error", "PDF to Images works on one file at a time — using the first file.");
    const next = files[0];
    if (next) setFile(next);
  }

  const canSubmit = !!file && !isConverting && !rangeError;

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6">
        <p className="mb-1 text-[13px] text-ink-faint">Tools</p>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">PDF to Images</h1>
        <p className="text-[14.5px] text-ink-soft">
          Convert PDF pages to JPEG or PNG images — all pages or a selected range.
        </p>
      </div>

      {!file ? (
        <UploadZone onFilesAdded={handleFilesAdded} accept={PDF_ONLY} acceptLabel="PDF" />
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-sm">
          <FileText className="h-4.5 w-4.5 shrink-0 text-coral" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{file.name}</span>
          <span className="hidden font-mono text-xs text-ink-faint sm:inline">{formatFileSize(file.size)}</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
            {isLoadingPageCount ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-label="Reading page count" />
            ) : pageCount !== null ? `${pageCount}p` : "—"}
          </span>
          <button
            type="button"
            onClick={clearFile}
            aria-label={`Remove ${file.name}`}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-faint hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {!file ? (
        <div className="mt-6">
          <EmptyState
            icon={Images}
            title="No file added yet"
            description="Add a PDF above to configure output format, resolution, and page range."
          />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          {/* Thumbnail preview */}
          <div>
            {isLoadingThumbnails && thumbnails.length === 0 ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-[1/1.414] animate-pulse rounded-lg bg-surface-2" aria-hidden="true" />
                ))}
              </div>
            ) : (
              <div
                className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6"
                aria-label="PDF page previews"
              >
                {thumbnails.map((thumb) => (
                  <div
                    key={thumb.pageNumber}
                    className="relative overflow-hidden rounded-lg border border-line bg-surface-2"
                  >
                    <div style={{ aspectRatio: `1 / ${thumb.aspectRatio}` }} className="w-full">
                      {thumb.dataUrl ? (
                        <img src={thumb.dataUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full animate-pulse bg-surface-2" />
                      )}
                    </div>
                    <span
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent py-0.5 text-center font-mono text-[10px] text-white"
                      aria-hidden="true"
                    >
                      {thumb.pageNumber}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings panel */}
          <div className="flex flex-col gap-4">
            {/* Format */}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Output format</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={format === opt.value}
                    onClick={() => setFormat(opt.value)}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors
                      ${format === opt.value ? "border-indigo bg-surface-2 text-indigo" : "border-line-strong bg-canvas text-ink-soft hover:bg-surface-2"}`}
                  >
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block text-[11px] text-ink-faint">{opt.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* DPI */}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Resolution</legend>
              <div className="flex flex-col gap-1.5">
                {DPI_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={dpi === opt.value}
                    onClick={() => setDpi(opt.value)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors
                      ${dpi === opt.value ? "border-indigo bg-surface-2 text-indigo" : "border-line-strong bg-canvas text-ink-soft hover:bg-surface-2"}`}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-[11px] text-ink-faint">{opt.description}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Quality (JPEG only) */}
            {format === "jpeg" && (
              <div>
                <label htmlFor="quality-input" className="mb-2 block text-sm font-semibold text-ink">
                  JPEG quality: {quality}%
                </label>
                <input
                  id="quality-input"
                  type="range"
                  min={40}
                  max={100}
                  step={5}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-indigo"
                />
                <div className="mt-1 flex justify-between font-mono text-[11px] text-ink-faint">
                  <span>40% smaller</span>
                  <span>100% best quality</span>
                </div>
              </div>
            )}

            {/* Page range */}
            <TextField
              id="ptoi-range"
              label="Pages (optional)"
              placeholder={`All pages${pageCount ? ` (1–${pageCount})` : ""}`}
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              error={rangeError}
            />

            <Button onClick={() => void convert()} isLoading={isConverting} disabled={!canSubmit}>
              <Images className="h-4 w-4" aria-hidden="true" />
              {isConverting ? "Converting…" : "Convert to Images"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
