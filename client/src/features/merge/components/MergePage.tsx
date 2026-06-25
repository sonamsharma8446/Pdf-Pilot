import { Combine } from "lucide-react";
import { UploadZone } from "@/shared/components/UploadZone";
import { Button } from "@/shared/components/Button";
import { EmptyState } from "@/shared/components/EmptyState";
import { ReorderableFileList } from "@/features/merge/components/ReorderableFileList";
import { useMergeFiles } from "@/features/merge/hooks/useMergeFiles";

const PDF_ONLY_ACCEPT = { "application/pdf": [".pdf"] };

export function MergePage() {
  const { files, isMerging, addFiles, removeFile, moveFile, reorderFiles, merge } = useMergeFiles();

  return (
    <div className="mx-auto max-w-[840px]">
      <div className="mb-6">
        <p className="mb-1 text-[13px] text-ink-faint">Tools</p>
        <h1 className="font-display text-[26px] font-bold tracking-tight text-ink">Merge PDF</h1>
        <p className="text-[14.5px] text-ink-soft">
          Combine multiple PDFs into one file, in whatever order you like.
        </p>
      </div>

      <div className="mb-6">
        <UploadZone onFilesAdded={addFiles} accept={PDF_ONLY_ACCEPT} acceptLabel="PDF" />
      </div>

      {files.length === 0 ? (
        <EmptyState
          icon={Combine}
          title="No files added yet"
          description="Add two or more PDFs above — you'll be able to drag them into the order you want before merging."
        />
      ) : (
        <>
          <ReorderableFileList files={files} onReorder={reorderFiles} onRemove={removeFile} onMove={moveFile} />

          <div className="mt-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-soft">
              {files.length} file{files.length === 1 ? "" : "s"} ·{" "}
              {files.length < 2 ? "add at least one more to merge" : "ready to merge"}
            </p>
            <Button onClick={() => void merge()} isLoading={isMerging} disabled={files.length < 2}>
              <Combine className="h-4 w-4" aria-hidden="true" />
              {isMerging ? "Merging…" : "Merge PDFs"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
