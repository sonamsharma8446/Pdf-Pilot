import { Scissors, FileText, X, Loader2 } from "lucide-react";
import { UploadZone } from "@/shared/components/UploadZone";
import { Button } from "@/shared/components/Button";
import { TextField } from "@/shared/components/TextField";
import { EmptyState } from "@/shared/components/EmptyState";
import { formatFileSize } from "@/shared/lib/format";
import { flattenToPageNumbers, parsePageRanges } from "@/shared/lib/pageRange";
import { useSplitPdf } from "@/features/split/hooks/useSplitPdf";
import { useToast } from "@/shared/hooks/useToast";
import type { SplitMode } from "@/features/split/types";

const PDF_ONLY_ACCEPT = { "application/pdf": [".pdf"] };

const MODE_OPTIONS: { value: SplitMode; label: string; description: string }[] = [
  { value: "all", label: "Every page", description: "Split into one PDF per page" },
  { value: "ranges", label: "Custom ranges", description: "Each range becomes its own file" },
  { value: "extract", label: "Extract pages", description: "Combine selected pages into one file" },
];

export function SplitPage() {
  const {
    file,
    pageCount,
    isLoadingPageCount,
    mode,
    setMode,
    rangeInput,
    setRangeInput,
    rangeError,
    isSplitting,
    setFile,
    clearFile,
    split,
  } = useSplitPdf();
  const { showToast } = useToast();

  function handleFilesAdded(files: File[]) {
    if (files.length > 1) {
      showToast("error", "Split works on one file at a time — using the first file.");
    }
    const next = files[0];
    if (next) setFile(next);
  }

  let extractPreview: string | null = null;
  if (mode === "extract" && rangeInput.trim() && !rangeError) {
    try {
      const pages = flattenToPageNumbers(parsePageRanges(rangeInput, pageCount ?? 0));
      extractPreview = `${pages.length} page${pages.length === 1 ? "" : "s"} selected`;
    } catch {
      extractPreview = null;
    }
  }

  const canSubmit = !!file && !isSplitting && (mode === "all" || (rangeInput.trim().length > 0 && !rangeError));

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6">
        <p className="mb-1 text-[13px] text-ink-faint">Tools</p>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Split PDF</h1>
        <p className="text-[14.5px] text-ink-soft">
          Split a PDF into separate files, or pull out exactly the pages you need.
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
            icon={Scissors}
            title="No file added yet"
            description="Add a PDF above to choose how you'd like to split it."
          />
        </div>
      ) : (
        <>
          <fieldset className="mb-5">
            <legend className="mb-2 text-sm font-semibold text-ink">Split mode</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {MODE_OPTIONS.map((option) => {
                const isSelected = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMode(option.value)}
                    aria-pressed={isSelected}
                    className={`rounded-xl border px-3.5 py-3 text-left transition-colors
                      ${isSelected ? "border-indigo bg-surface-2" : "border-line-strong bg-surface hover:bg-surface-2"}`}
                  >
                    <span className={`block text-sm font-semibold ${isSelected ? "text-indigo" : "text-ink"}`}>
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-ink-soft">{option.description}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {mode !== "all" && (
            <div className="mb-6">
              <TextField
                id="range-input"
                label="Pages"
                placeholder="e.g. 1-3,5,7-10"
                value={rangeInput}
                onChange={(event) => setRangeInput(event.target.value)}
                error={rangeError}
                success={extractPreview}
              />
            </div>
          )}

          <Button onClick={() => void split()} isLoading={isSplitting} disabled={!canSubmit}>
            <Scissors className="h-4 w-4" aria-hidden="true" />
            {isSplitting ? "Splitting…" : "Split PDF"}
          </Button>
        </>
      )}
    </div>
  );
}
