import { Minimize2, FileText, X, Loader2, Download, ArrowRight, Info } from "lucide-react";
import { UploadZone } from "@/shared/components/UploadZone";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatFileSize } from "@/shared/lib/format";
import { useCompressPdf } from "@/features/compress/hooks/useCompressPdf";
import { useToast } from "@/shared/hooks/useToast";
import type { CompressionLevel } from "@/features/compress/api/compressApi";

const PDF_ONLY_ACCEPT = { "application/pdf": [".pdf"] };

const LEVEL_OPTIONS: {
  value: CompressionLevel;
  label: string;
  description: string;
  badge: string;
}[] = [
  { value: "low", label: "Low", description: "Gentle recompression, best quality", badge: "~30–45% smaller" },
  { value: "medium", label: "Medium", description: "Balanced quality and size", badge: "~50–65% smaller" },
  { value: "high", label: "High", description: "Maximum reduction, some quality loss", badge: "~60–75% smaller" },
];

function SizeBar({ originalSize, compressedSize }: { originalSize: number; compressedSize: number }) {
  const compressedPct = Math.min(100, (compressedSize / originalSize) * 100);

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2">
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-indigo to-violet transition-all duration-700 ease-out"
        style={{ width: `${compressedPct}%` }}
        role="presentation"
      />
      <div
        className="absolute right-0 top-0 h-full rounded-full bg-line-strong"
        style={{ width: `${100 - compressedPct}%` }}
        role="presentation"
      />
    </div>
  );
}

export function CompressPage() {
  const {
    file,
    pageCount,
    isLoadingPageCount,
    level,
    setLevel,
    isCompressing,
    result,
    setFile,
    clearFile,
    compress,
    download,
  } = useCompressPdf();
  const { showToast } = useToast();

  function handleFilesAdded(files: File[]) {
    if (files.length > 1) showToast("error", "Compress works on one file at a time — using the first file.");
    const next = files[0];
    if (next) setFile(next);
  }

  const savings =
    result && result.originalSize > result.compressedSize
      ? ((result.originalSize - result.compressedSize) / result.originalSize) * 100
      : null;

  const grew = result && result.compressedSize >= result.originalSize;

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6">
        <p className="mb-1 text-[13px] text-ink-faint">Tools</p>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Compress PDF</h1>
        <p className="text-[14.5px] text-ink-soft">
          Reduce PDF file size by recompressing embedded images and optimizing the document structure.
        </p>
      </div>

      {!file ? (
        <UploadZone onFilesAdded={handleFilesAdded} accept={PDF_ONLY_ACCEPT} acceptLabel="PDF" />
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-sm">
          <FileText className="h-4.5 w-4.5 shrink-0 text-coral" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{file.name}</span>
          <span className="hidden font-mono text-xs text-ink-faint sm:inline">{formatFileSize(file.size)}</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
            {isLoadingPageCount ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-label="Reading page count" />
            ) : pageCount !== null ? (
              `${pageCount}p`
            ) : (
              "—"
            )}
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
            icon={Minimize2}
            title="No file added yet"
            description="Add a PDF above, then choose a compression level."
          />
        </div>
      ) : (
        <>
          <fieldset className="mb-6">
            <legend className="mb-2 text-sm font-semibold text-ink">Compression level</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {LEVEL_OPTIONS.map((option) => {
                const isSelected = level === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLevel(option.value)}
                    aria-pressed={isSelected}
                    className={`rounded-xl border px-3.5 py-3 text-left transition-colors
                      ${isSelected ? "border-indigo bg-surface-2" : "border-line-strong bg-surface hover:bg-surface-2"}`}
                  >
                    <span className={`block text-sm font-semibold ${isSelected ? "text-indigo" : "text-ink"}`}>
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{option.description}</span>
                    <span className="mt-1.5 inline-block rounded-full bg-surface px-2 py-0.5 font-mono text-[11px] text-ink-faint">
                      {option.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void compress()} isLoading={isCompressing} disabled={isCompressing}>
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
              {isCompressing ? "Compressing…" : result ? "Compress again" : "Compress PDF"}
            </Button>
          </div>

          {result && (
            <div className="mt-6 rounded-xl border border-line bg-surface p-5 shadow-sm">
              <h2 className="mb-4 font-display text-[15px] font-semibold text-ink">Compression results</h2>

              <div className="mb-4">
                <SizeBar originalSize={result.originalSize} compressedSize={result.compressedSize} />
              </div>

              <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-mono text-xs text-ink-faint">Original</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{formatFileSize(result.originalSize)}</p>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-ink-faint" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-mono text-xs text-ink-faint">Compressed</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{formatFileSize(result.compressedSize)}</p>
                </div>
              </div>

              {grew ? (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
                  <p className="text-[13px] text-ink-soft">
                    This PDF is already well-optimized — the file didn't get smaller at this level. Try a higher
                    compression level, or the file may contain no recompressible images.
                  </p>
                </div>
              ) : (
                savings !== null && (
                  <p className="mb-4 text-center font-display text-[22px] font-bold text-success">
                    {savings.toFixed(1)}% smaller
                  </p>
                )
              )}

              <Button onClick={download} variant={grew ? "secondary" : "primary"}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download {grew ? "file" : `(${formatFileSize(result.compressedSize)})`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
