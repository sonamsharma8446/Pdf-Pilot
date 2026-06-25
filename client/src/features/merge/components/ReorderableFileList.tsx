import { Reorder, useDragControls } from "framer-motion";
import { FileText, GripVertical, ChevronUp, ChevronDown, X, Loader2 } from "lucide-react";
import type { MergeFileEntry } from "@/features/merge/hooks/useMergeFiles";
import { formatFileSize } from "@/shared/lib/format";

interface ReorderableFileListProps {
  files: MergeFileEntry[];
  onReorder: (newOrder: MergeFileEntry[]) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

export function ReorderableFileList({ files, onReorder, onRemove, onMove }: ReorderableFileListProps) {
  return (
    <Reorder.Group
      as="ul"
      axis="y"
      values={files}
      onReorder={onReorder}
      className="flex flex-col gap-2"
      aria-label="Files to merge, in order"
    >
      {files.map((entry, index) => (
        <FileRow
          key={entry.id}
          entry={entry}
          index={index}
          isFirst={index === 0}
          isLast={index === files.length - 1}
          onRemove={onRemove}
          onMove={onMove}
        />
      ))}
    </Reorder.Group>
  );
}

interface FileRowProps {
  entry: MergeFileEntry;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

function FileRow({ entry, index, isFirst, isLast, onRemove, onMove }: FileRowProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      as="li"
      value={entry}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-sm"
    >
      <span className="font-mono text-xs text-ink-faint" aria-hidden="true">
        {index + 1}
      </span>

      <button
        type="button"
        onPointerDown={(event) => dragControls.start(event)}
        aria-label={`Drag to reorder ${entry.file.name}`}
        className="cursor-grab touch-none text-ink-faint hover:text-ink-soft active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      <FileText className="h-4.5 w-4.5 shrink-0 text-coral" aria-hidden="true" />

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{entry.file.name}</span>

      <span className="hidden font-mono text-xs text-ink-faint sm:inline">
        {formatFileSize(entry.file.size)}
      </span>

      <span className="hidden rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-soft sm:inline">
        {entry.isLoadingPageCount ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-label="Reading page count" />
        ) : entry.pageCount !== null ? (
          `${entry.pageCount}p`
        ) : (
          "—"
        )}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMove(entry.id, "up")}
          disabled={isFirst}
          aria-label={`Move ${entry.file.name} up`}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-surface-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onMove(entry.id, "down")}
          disabled={isLast}
          aria-label={`Move ${entry.file.name} down`}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-surface-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(entry.id)}
          aria-label={`Remove ${entry.file.name}`}
          className="flex h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-surface-2 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </Reorder.Item>
  );
}
