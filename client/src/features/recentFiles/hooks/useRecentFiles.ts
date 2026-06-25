import { useCallback, useEffect, useState } from "react";

export interface RecentFileEntry {
  id: string;
  fileName: string;
  operation: string; // e.g. "Merged", "Compressed", "Rotated"
  pageCount?: number;
  processedAt: string; // ISO timestamp
}

const STORAGE_KEY = "pdfpilot-recent-files";
const MAX_ENTRIES = 20;

function readFromStorage(): RecentFileEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentFileEntry[]) : [];
  } catch {
    // Corrupted or manually-edited localStorage shouldn't crash the dashboard.
    return [];
  }
}

export function useRecentFiles() {
  const [entries, setEntries] = useState<RecentFileEntry[]>(readFromStorage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = useCallback((entry: Omit<RecentFileEntry, "id" | "processedAt">) => {
    const newEntry: RecentFileEntry = {
      ...entry,
      id: crypto.randomUUID(),
      processedAt: new Date().toISOString(),
    };
    setEntries((current) => [newEntry, ...current].slice(0, MAX_ENTRIES));
  }, []);

  const clearEntries = useCallback(() => setEntries([]), []);

  return { entries, addEntry, clearEntries };
}
