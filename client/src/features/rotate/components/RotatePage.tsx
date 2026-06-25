import { RotateCw, RotateCcw, RefreshCw, FileText, X, CheckSquare, Square, RotateCcw as RotateCcwIcon } from "lucide-react";
import { UploadZone } from "@/shared/components/UploadZone";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatFileSize } from "@/shared/lib/format";
import { useRotatePdf } from "@/features/rotate/hooks/useRotatePdf";
import { usePdfThumbnails } from "@/features/rotate/hooks/usePdfThumbnails";
import { useToast } from "@/shared/hooks/useToast";
import type { RotationAngle, RotationTarget } from "@/features/rotate/types";
import type { PageThumbnail } from "@/features/rotate/hooks/usePdfThumbnails";

const PDF_ONLY = { "application/pdf": [".pdf"] };

const ANGLE_OPTIONS: { value: RotationAngle; label: string; icon: typeof RotateCw }[] = [
  { value: 90, label: "90° Clockwise", icon: RotateCw },
  { value: 180, label: "180°", icon: RefreshCw },
  { value: 270, label: "90° Counter-CW", icon: RotateCcw },
];

const TARGET_OPTIONS: { value: RotationTarget; label: string }[] = [
  { value: "all", label: "All pages" },
  { value: "odd", label: "Odd pages" },
  { value: "even", label: "Even pages" },
  { value: "selected", label: "Selected pages" },
];

function willPageRotate(
  pageNumber: number,
  target: RotationTarget,
  selectedPages: Set<number>
): boolean {
  if (target === "all") return true;
  if (target === "odd") return pageNumber % 2 === 1;
  if (target === "even") return pageNumber % 2 === 0;
  return selectedPages.has(pageNumber);
}

interface PageThumbProps {
  thumb: PageThumbnail;
  rotate: boolean;
  angle: RotationAngle;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
}

function PageThumb({ thumb, rotate: willRotate, angle, selectable, selected, onToggle }: PageThumbProps) {
  const borderClass = selected
    ? "border-indigo shadow-[0_0_0_2px_var(--color-indigo)]"
    : willRotate
    ? "border-indigo/40"
    : "border-line";

  return (
    <button
      type="button"
      onClick={selectable ? onToggle : undefined}
      aria-pressed={selectable ? selected : undefined}
      aria-label={`Page ${thumb.pageNumber}${willRotate ? `, will rotate ${angle}°` : ""}${selectable ? (selected ? ", selected" : ", click to select") : ""}`}
      className={`group relative overflow-hidden rounded-lg border-2 bg-surface-2 transition-colors
        ${borderClass}
        ${selectable ? "cursor-pointer hover:border-indigo" : "cursor-default"}`}
    >
      {/* Thumbnail */}
      <div style={{ aspectRatio: `1 / ${thumb.aspectRatio}` }} className="w-full overflow-hidden">
        {thumb.dataUrl ? (
          <img
            src={thumb.dataUrl}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full animate-pulse bg-surface-2" />
        )}
      </div>

      {/* Rotation preview overlay */}
      {willRotate && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-indigo/10 opacity-0 transition-opacity group-hover:opacity-100"
          aria-hidden="true"
        >
          <div className="rounded-full bg-indigo/90 p-2">
            <RotateCw className="h-5 w-5 text-white" />
          </div>
        </div>
      )}

      {/* Rotation badge */}
      {willRotate && (
        <div
          className="absolute right-1 top-1 rounded-full bg-indigo p-0.5 shadow-sm"
          aria-hidden="true"
        >
          <RotateCw className="h-2.5 w-2.5 text-white" />
        </div>
      )}

      {/* Selected checkmark */}
      {selectable && selected && (
        <div
          className="absolute left-1 top-1 rounded-full bg-indigo p-0.5 shadow-sm"
          aria-hidden="true"
        >
          <CheckSquare className="h-2.5 w-2.5 text-white" />
        </div>
      )}

      {/* Page number */}
      <span
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent py-1 text-center font-mono text-[10px] text-white"
        aria-hidden="true"
      >
        {thumb.pageNumber}
      </span>
    </button>
  );
}

export function RotatePage() {
  const {
    file,
    angle,
    setAngle,
    target,
    setTarget,
    selectedPages,
    togglePage,
    selectAll,
    clearSelection,
    isRotating,
    setFile,
    clearFile,
    rotate,
  } = useRotatePdf();

  const { thumbnails, pageCount, isLoadingThumbnails } = usePdfThumbnails(file);
  const { showToast } = useToast();

  function handleFilesAdded(files: File[]) {
    if (files.length > 1) showToast("error", "Rotate works on one file at a time — using the first file.");
    const next = files[0];
    if (next) setFile(next);
  }

  const isSelectable = target === "selected";
  const rotatingCount =
    target === "all"
      ? pageCount ?? 0
      : target === "odd"
      ? Math.ceil((pageCount ?? 0) / 2)
      : target === "even"
      ? Math.floor((pageCount ?? 0) / 2)
      : selectedPages.size;

  const canSubmit = !!file && !isRotating && (target !== "selected" || selectedPages.size > 0);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6">
        <p className="mb-1 text-[13px] text-ink-faint">Tools</p>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Rotate PDF</h1>
        <p className="text-[14.5px] text-ink-soft">
          Rotate all pages or choose which ones to turn — 90°, 180°, or 270°.
        </p>
      </div>

      {!file ? (
        <UploadZone onFilesAdded={handleFilesAdded} accept={PDF_ONLY} acceptLabel="PDF" />
      ) : (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-sm">
          <FileText className="h-4.5 w-4.5 shrink-0 text-coral" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{file.name}</span>
          <span className="hidden font-mono text-xs text-ink-faint sm:inline">{formatFileSize(file.size)}</span>
          {pageCount !== null && (
            <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
              {pageCount}p
            </span>
          )}
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
            icon={RotateCcwIcon}
            title="No file added yet"
            description="Add a PDF above, then choose which pages to rotate and by how much."
          />
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="mb-6 rounded-xl border border-line bg-surface p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              {/* Target */}
              <fieldset className="flex-1">
                <legend className="mb-2 text-sm font-semibold text-ink">Pages to rotate</legend>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {TARGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={target === opt.value}
                      onClick={() => {
                        setTarget(opt.value);
                        if (opt.value !== "selected") clearSelection();
                      }}
                      className={`rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors
                        ${target === opt.value
                          ? "border-indigo bg-surface-2 text-indigo font-semibold"
                          : "border-line-strong bg-canvas text-ink-soft hover:bg-surface-2 hover:text-ink"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Angle */}
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-ink">Rotation</legend>
                <div className="flex gap-1.5">
                  {ANGLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        aria-pressed={angle === opt.value}
                        onClick={() => setAngle(opt.value)}
                        className={`flex flex-col items-center gap-1 rounded-lg border px-2.5 py-2 transition-colors
                          ${angle === opt.value
                            ? "border-indigo bg-surface-2 text-indigo"
                            : "border-line-strong bg-canvas text-ink-soft hover:bg-surface-2 hover:text-ink"
                          }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                        <span className="whitespace-nowrap text-[11px] font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            {/* Action row */}
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              {isSelectable && pageCount !== null && (
                <>
                  <button
                    type="button"
                    onClick={() => selectAll(pageCount)}
                    className="flex items-center gap-1.5 text-sm font-medium text-indigo hover:underline"
                  >
                    <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink hover:underline"
                  >
                    <Square className="h-3.5 w-3.5" aria-hidden="true" />
                    Clear
                  </button>
                </>
              )}
              <p className="ml-auto text-sm text-ink-soft">
                {rotatingCount > 0
                  ? `${rotatingCount} page${rotatingCount === 1 ? "" : "s"} will rotate ${angle}°`
                  : "No pages selected"}
              </p>
              <Button onClick={() => void rotate(pageCount)} isLoading={isRotating} disabled={!canSubmit}>
                <RotateCw className="h-4 w-4" aria-hidden="true" />
                {isRotating ? "Rotating…" : "Rotate PDF"}
              </Button>
            </div>
          </div>

          {/* Thumbnail grid */}
          {isLoadingThumbnails && thumbnails.length === 0 ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[1/1.414] w-full animate-pulse rounded-lg bg-surface-2"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : (
            <div
              className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8"
              role="group"
              aria-label={isSelectable ? "Select pages to rotate" : "PDF page thumbnails"}
            >
              {thumbnails.map((thumb) => (
                <PageThumb
                  key={thumb.pageNumber}
                  thumb={thumb}
                  rotate={willPageRotate(thumb.pageNumber, target, selectedPages)}
                  angle={angle}
                  selectable={isSelectable}
                  selected={selectedPages.has(thumb.pageNumber)}
                  onToggle={() => togglePage(thumb.pageNumber)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
