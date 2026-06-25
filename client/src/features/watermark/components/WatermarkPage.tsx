import { Droplet, FileText, X, Loader2, CheckSquare, Square } from "lucide-react";
import { UploadZone } from "@/shared/components/UploadZone";
import { Button } from "@/shared/components/Button";
import { TextField } from "@/shared/components/TextField";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatFileSize } from "@/shared/lib/format";
import { useWatermark } from "@/features/watermark/hooks/useWatermark";
import { usePdfThumbnails } from "@/features/rotate/hooks/usePdfThumbnails";
import { useToast } from "@/shared/hooks/useToast";
import type { WatermarkPosition, WatermarkTarget, WatermarkType } from "@/features/watermark/types";

const PDF_ONLY = { "application/pdf": [".pdf"] };
const IMAGE_ACCEPT = { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] };

const TYPE_OPTIONS: { value: WatermarkType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "image", label: "Image" },
];

const TARGET_OPTIONS: { value: WatermarkTarget; label: string }[] = [
  { value: "all", label: "All pages" },
  { value: "odd", label: "Odd pages" },
  { value: "even", label: "Even pages" },
  { value: "selected", label: "Select pages" },
];

const POSITION_OPTIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "↖" },
  { value: "top-center", label: "↑" },
  { value: "top-right", label: "↗" },
  { value: "center", label: "⊙" },
  { value: "bottom-left", label: "↙" },
  { value: "bottom-center", label: "↓" },
  { value: "bottom-right", label: "↘" },
];

export function WatermarkPage() {
  const {
    pdfFile, setPdfFile, clearPdfFile,
    pageCount, isLoadingPageCount,
    type, setType,
    target, setTarget,
    position, setPosition,
    opacity, setOpacity,
    rotation, setRotation,
    selectedPages, togglePage,
    text, setText,
    fontSize, setFontSize,
    color, setColor,
    watermarkImage, watermarkImagePreview, setWatermarkImg,
    widthPercent, setWidthPercent,
    isApplying, apply,
  } = useWatermark();

  const { thumbnails, isLoadingThumbnails } = usePdfThumbnails(pdfFile);
  const { showToast } = useToast();

  function handlePdfAdded(files: File[]) {
    if (files.length > 1) showToast("error", "Watermark works on one file at a time — using the first file.");
    const next = files[0];
    if (next) setPdfFile(next);
  }

  function handleImageAdded(files: File[]) {
    const next = files[0];
    if (next) setWatermarkImg(next);
  }

  const isSelectable = target === "selected";
  const canSubmit =
    !!pdfFile &&
    !isApplying &&
    (type === "text" ? text.trim().length > 0 : !!watermarkImage) &&
    (target !== "selected" || selectedPages.size > 0);

  return (
    <div className="mx-auto max-w-[1050px]">
      <div className="mb-6">
        <p className="mb-1 text-[13px] text-ink-faint">Tools</p>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Watermark PDF</h1>
        <p className="text-[14.5px] text-ink-soft">
          Add a text or image watermark to your PDF pages.
        </p>
      </div>

      {!pdfFile ? (
        <UploadZone onFilesAdded={handlePdfAdded} accept={PDF_ONLY} acceptLabel="PDF" />
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-sm">
          <FileText className="h-4.5 w-4.5 shrink-0 text-coral" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{pdfFile.name}</span>
          <span className="hidden font-mono text-xs text-ink-faint sm:inline">{formatFileSize(pdfFile.size)}</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
            {isLoadingPageCount ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-label="Reading page count" />
            ) : pageCount !== null ? `${pageCount}p` : "—"}
          </span>
          <button
            type="button"
            onClick={clearPdfFile}
            aria-label="Remove file"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-faint hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      )}

      {!pdfFile ? (
        <div className="mt-6">
          <EmptyState
            icon={Droplet}
            title="No file added yet"
            description="Add a PDF above, then configure your watermark."
          />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* Page thumbnails */}
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
                role="group"
                aria-label={isSelectable ? "Select pages for watermark" : "PDF page previews"}
              >
                {thumbnails.map((thumb) => {
                  const willWatermark =
                    target === "all" ||
                    (target === "odd" && thumb.pageNumber % 2 === 1) ||
                    (target === "even" && thumb.pageNumber % 2 === 0) ||
                    (target === "selected" && selectedPages.has(thumb.pageNumber));
                  const isSelected = selectedPages.has(thumb.pageNumber);

                  return (
                    <button
                      key={thumb.pageNumber}
                      type="button"
                      onClick={isSelectable ? () => togglePage(thumb.pageNumber) : undefined}
                      aria-pressed={isSelectable ? isSelected : undefined}
                      aria-label={`Page ${thumb.pageNumber}${isSelectable ? (isSelected ? ", selected" : ", click to select") : ""}`}
                      className={`relative overflow-hidden rounded-lg border-2 bg-surface-2 transition-colors
                        ${isSelected ? "border-indigo" : willWatermark ? "border-indigo/30" : "border-line"}
                        ${isSelectable ? "cursor-pointer hover:border-indigo" : "cursor-default"}`}
                    >
                      <div style={{ aspectRatio: `1 / ${thumb.aspectRatio}` }} className="w-full">
                        {thumb.dataUrl ? (
                          <img src={thumb.dataUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full animate-pulse bg-surface-2" />
                        )}
                      </div>
                      {isSelected && (
                        <div className="absolute left-1 top-1 rounded-full bg-indigo p-0.5" aria-hidden="true">
                          <CheckSquare className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      {willWatermark && !isSelected && target !== "selected" && (
                        <div className="absolute right-1 top-1 rounded-full bg-indigo/80 p-0.5" aria-hidden="true">
                          <Droplet className="h-2.5 w-2.5 text-white" />
                        </div>
                      )}
                      <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent py-0.5 text-center font-mono text-[10px] text-white" aria-hidden="true">
                        {thumb.pageNumber}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {isSelectable && pageCount !== null && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const all = Array.from({ length: pageCount }, (_, i) => i + 1);
                    all.forEach((n) => { if (!selectedPages.has(n)) togglePage(n); });
                  }}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo hover:underline"
                >
                  <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" /> Select all
                </button>
                <button
                  type="button"
                  onClick={() => { [...selectedPages].forEach(togglePage); }}
                  className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:underline"
                >
                  <Square className="h-3.5 w-3.5" aria-hidden="true" /> Clear
                </button>
                <span className="ml-auto text-sm text-ink-faint">{selectedPages.size} selected</span>
              </div>
            )}
          </div>

          {/* Settings panel */}
          <div className="flex flex-col gap-4">
            {/* Type */}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Watermark type</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={type === opt.value}
                    onClick={() => setType(opt.value)}
                    className={`rounded-lg border py-2 text-sm font-semibold transition-colors
                      ${type === opt.value ? "border-indigo bg-surface-2 text-indigo" : "border-line-strong bg-canvas text-ink-soft hover:bg-surface-2"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Text options */}
            {type === "text" && (
              <div className="flex flex-col gap-3">
                <TextField
                  id="wm-text"
                  label="Text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="CONFIDENTIAL"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="wm-fontsize" className="mb-1.5 block text-sm font-semibold text-ink">
                      Font size
                    </label>
                    <input
                      id="wm-fontsize"
                      type="number"
                      min={8}
                      max={200}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink outline-none focus:border-indigo focus:shadow-[0_0_0_3px_rgb(70_64_222_/_0.14)]"
                    />
                  </div>
                  <div>
                    <label htmlFor="wm-color" className="mb-1.5 block text-sm font-semibold text-ink">
                      Color
                    </label>
                    <div className="flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3">
                      <input
                        id="wm-color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                      <span className="font-mono text-xs text-ink-soft">{color}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Image options */}
            {type === "image" && (
              <div className="flex flex-col gap-3">
                {watermarkImagePreview ? (
                  <div className="relative overflow-hidden rounded-xl border border-line bg-surface-2">
                    <img
                      src={watermarkImagePreview}
                      alt="Watermark preview"
                      className="mx-auto max-h-24 object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setWatermarkImg(null)}
                      aria-label="Remove watermark image"
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-ink-faint hover:text-danger"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-ink">Watermark image</p>
                    <UploadZone
                      onFilesAdded={handleImageAdded}
                      accept={IMAGE_ACCEPT}
                      acceptLabel="PNG · JPG · WebP"
                    />
                  </div>
                )}
                <div>
                  <label htmlFor="wm-width" className="mb-1.5 block text-sm font-semibold text-ink">
                    Width: {widthPercent}% of page
                  </label>
                  <input
                    id="wm-width"
                    type="range"
                    min={5}
                    max={90}
                    step={5}
                    value={widthPercent}
                    onChange={(e) => setWidthPercent(Number(e.target.value))}
                    className="w-full accent-indigo"
                  />
                </div>
              </div>
            )}

            {/* Position */}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Position</legend>
              <div className="grid grid-cols-3 gap-1">
                {POSITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={position === opt.value}
                    aria-label={opt.value.replace(/-/g, " ")}
                    onClick={() => setPosition(opt.value)}
                    className={`rounded-lg border py-2 text-center text-base transition-colors
                      ${position === opt.value ? "border-indigo bg-surface-2 text-indigo" : "border-line-strong bg-canvas text-ink-soft hover:bg-surface-2"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Target */}
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-ink">Apply to</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {TARGET_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={target === opt.value}
                    onClick={() => setTarget(opt.value)}
                    className={`rounded-lg border py-2 text-sm font-medium transition-colors
                      ${target === opt.value ? "border-indigo bg-surface-2 font-semibold text-indigo" : "border-line-strong bg-canvas text-ink-soft hover:bg-surface-2"}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Opacity */}
            <div>
              <label htmlFor="wm-opacity" className="mb-1.5 block text-sm font-semibold text-ink">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                id="wm-opacity"
                type="range"
                min={0.05}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-indigo"
              />
            </div>

            {/* Rotation */}
            <div>
              <label htmlFor="wm-rotation" className="mb-1.5 block text-sm font-semibold text-ink">
                Rotation: {rotation}°
              </label>
              <input
                id="wm-rotation"
                type="range"
                min={-180}
                max={180}
                step={5}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full accent-indigo"
              />
            </div>

            <Button onClick={() => void apply()} isLoading={isApplying} disabled={!canSubmit}>
              <Droplet className="h-4 w-4" aria-hidden="true" />
              {isApplying ? "Applying…" : "Apply watermark"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
