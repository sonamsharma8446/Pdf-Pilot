
import { FileStack } from "lucide-react";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useRecentFiles } from "@/features/recentFiles/hooks/useRecentFiles";
import { EmptyState } from "@/shared/components/EmptyState";

function routeForOperation(op: string): string | null {
  if (op.includes("Images →")) return "/image-to-pdf";
  if (op.includes("Merged") || op.includes("Merge")) return "/merge";
  if (op.includes("Split")) return "/split";
  if (op.includes("Compress")) return "/compress";
  if (op.includes("Rotat")) return "/rotate";
  if (op.includes("PDF →")) return "/pdf-to-images";
  if (op.includes("Watermark") || op.includes("Watermarked")) return "/watermark";
  return null;
}

export function Dashboard() {
  const { entries } = useRecentFiles();
  const navigate = useNavigate();

  const onClickEntry = useCallback((_entryId: string, operation: string) => {
    const r = routeForOperation(operation);
    if (r) navigate(r);
  }, [navigate]);

  return (
    <div className="mx-auto max-w-[1280px]">

      <section aria-labelledby="recent-heading">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 id="recent-heading" className="font-display text-[17px] font-semibold text-ink">
            Recent files
          </h2>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={FileStack}
            title="No files yet"
            description="Once you process a file, it'll show up here — this list is stored only in your browser."
          />
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
            {entries.map((entry) => {
              const clickable = routeForOperation(entry.operation) !== null;
              return (
                <li
                  key={entry.id}
                  className={`rounded-2xl border border-line bg-surface p-4 shadow-sm ${clickable ? 'cursor-pointer hover:shadow-md hover:border-ink' : ''}`}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                  onClick={clickable ? () => onClickEntry(entry.id, entry.operation) : undefined}
                  onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClickEntry(entry.id, entry.operation); } : undefined}
                >
                  <p className="truncate text-sm font-semibold text-ink">{entry.fileName}</p>
                  <p className="mt-1.5 flex items-center gap-2 text-xs text-ink-faint">
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 font-mono">
                      {entry.operation}
                      {entry.pageCount ? ` · ${entry.pageCount}p` : ""}
                    </span>
                    <span>{new Date(entry.processedAt).toLocaleDateString()}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
