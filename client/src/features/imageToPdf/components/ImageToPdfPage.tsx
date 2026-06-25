import { Image as ImageIcon, X, GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "framer-motion";
import { UploadZone } from "@/shared/components/UploadZone";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatFileSize } from "@/shared/lib/format";
import { useImageToPdf } from "@/features/imageToPdf/hooks/useImageToPdf";
import type { ImageEntry, Margin, Orientation, PageSize } from "@/features/imageToPdf/types";

const IMAGE_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

const PAGE_SIZE_OPTIONS: { value: PageSize; label: string; description: string }[] = [
  { value: "a4", label: "A4", description: "210 × 297 mm" },
  { value: "letter", label: "Letter", description: "8.5 × 11 in" },
  { value: "fit", label: "Fit", description: "Match image size" },
  { value: "original", label: "Original", description: "1:1 pixel size" },
];

const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

const MARGIN_OPTIONS: { value: Margin; label: string }[] = [
  { value: "none", label: "None" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

function SegmentedControl<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string; description?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={`rounded-lg border px-3 py-1.5 text-left text-sm transition-colors
              ${value === opt.value
                ? "border-indigo bg-surface-2 font-semibold text-indigo"
                : "border-line-strong bg-canvas text-ink-soft hover:bg-surface-2 hover:text-ink"
              }`}
          >
            <span>{opt.label}</span>
            {opt.description && (
              <span className="ml-1.5 text-[11px] text-ink-faint">{opt.description}</span>
            )}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ImageCard({
  entry,
  onRemove,
}: {
  entry: ImageEntry;
  onRemove: (id: string) => void;
}) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="li"
      value={entry}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2.5 shadow-sm"
    >
      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        aria-label={`Drag to reorder ${entry.file.name}`}
        className="cursor-grab touch-none text-ink-faint hover:text-ink-soft active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
        {entry.previewUrl ? (
          <img
            src={entry.previewUrl}
            alt=""
            className="h-full w-full object-cover"
            onLoad={() => {
        
              console.log("Image loaded");
            }}
            onError={(e) => {
              
              console.log("Image failed");
    
              console.log(entry.previewUrl);
              
              console.log(e.currentTarget.src);
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-faint">
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{entry.file.name}</p>
        <p className="font-mono text-xs text-ink-faint">{formatFileSize(entry.file.size)}</p>
      </div>

      <button
        type="button"
        onClick={() => onRemove(entry.id)}
        aria-label={`Remove ${entry.file.name}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-ink-faint hover:bg-surface-2 hover:text-ink"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </Reorder.Item>
  );
}

export function ImageToPdfPage() {
  const {
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
    convert,
  } = useImageToPdf();

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="mb-6">
        <p className="mb-1 text-[13px] text-ink-faint">Tools</p>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Image to PDF</h1>
        <p className="text-[14.5px] text-ink-soft">
          Convert PNG, JPEG, or WebP images into a single PDF — drag to reorder.
        </p>
      </div>

      <div className="mb-5">
        <UploadZone
          onFilesAdded={addImages}
          accept={IMAGE_ACCEPT}
          acceptLabel="PNG · JPG · WebP"
        />
      </div>

      {images.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="No images added yet"
          description="Add PNG, JPEG, or WebP images above — drag to set the order they'll appear in the PDF."
        />
      ) : (
        <>
          <Reorder.Group
            as="ul"
            axis="y"
            values={images}
            onReorder={reorderImages}
            className="mb-5 flex flex-col gap-2"
            aria-label="Images in order"
          >
            {images.map((entry) => (
              <ImageCard key={entry.id} entry={entry} onRemove={removeImage} />
            ))}
          </Reorder.Group>

          <div className="mb-6 rounded-xl border border-line bg-surface p-4 shadow-sm">
            <h2 className="mb-4 font-display text-[15px] font-semibold text-ink">Page settings</h2>
            <div className="flex flex-col gap-4">
              <SegmentedControl
                legend="Page size"
                options={PAGE_SIZE_OPTIONS}
                value={pageSize}
                onChange={setPageSize}
              />
              <SegmentedControl
                legend="Orientation"
                options={ORIENTATION_OPTIONS}
                value={orientation}
                onChange={setOrientation}
              />
              <SegmentedControl
                legend="Margins"
                options={MARGIN_OPTIONS}
                value={margin}
                onChange={setMargin}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void convert()} isLoading={isConverting}>
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              {isConverting
                ? "Converting…"
                : `Convert ${images.length} image${images.length === 1 ? "" : "s"} to PDF`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
