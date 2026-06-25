import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { UploadCloud, FileText, Image as ImageIcon, X } from "lucide-react";

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // keep in sync with server MAX_UPLOAD_SIZE_MB

const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadZoneProps {
  onFilesStaged?: (files: File[]) => void;
}

export function UploadZone({ onFilesStaged }: UploadZoneProps) {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setRejectionMessage(
        rejections.length > 0
          ? "Some files weren't added — only PDF, JPG, and PNG files up to 50MB are supported."
          : null
      );

      if (accepted.length === 0) return;

      setStagedFiles((current) => {
        const next = [...current, ...accepted];
        onFilesStaged?.(next);
        return next;
      });
    },
    [onFilesStaged]
  );

  const removeFile = (index: number) => {
    setStagedFiles((current) => {
      const next = current.filter((_, i) => i !== index);
      onFilesStaged?.(next);
      return next;
    });
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    multiple: true,
    noClick: true, // the explicit "Browse files" button is the only click target — avoids nesting two interactive controls
    noKeyboard: true,
  });

  return (
    <div className="mb-8">
      <div
        {...getRootProps()}
        className={`rounded-2xl border-[1.5px] border-dashed px-6 py-10 text-center transition-colors
          ${isDragActive ? "border-indigo bg-surface-2 shadow-[var(--shadow-glow)]" : "border-line-strong bg-surface"}`}
      >
        <input {...getInputProps()} aria-label="File upload" />
        <div className="mx-auto mb-3.5 flex h-13 w-13 items-center justify-center rounded-full bg-surface-2 text-indigo">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-ink">Drag &amp; drop files here</h3>
        <p className="mb-4 text-sm text-ink-soft">or browse from your device</p>
        <button
          type="button"
          onClick={open}
          className="rounded-xl bg-gradient-to-br from-indigo via-violet to-coral px-5 py-2.5 text-sm
            font-semibold text-white shadow-[var(--shadow-glow)] transition-[filter] hover:brightness-110"
        >
          Browse files
        </button>
        <p className="mt-3.5 font-mono text-xs text-ink-faint">PDF · JPG · PNG — up to 50MB per file</p>
      </div>

      {rejectionMessage && (
        <p role="alert" className="mt-2.5 text-sm text-danger">
          {rejectionMessage}
        </p>
      )}

      {stagedFiles.length > 0 && (
        <ul className="mt-3.5 flex flex-col gap-2">
          {stagedFiles.map((file, index) => (
            <li
              key={`${file.name}-${file.lastModified}-${index}`}
              className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5"
            >
              {file.type === "application/pdf" ? (
                <FileText className="h-4.5 w-4.5 shrink-0 text-coral" aria-hidden="true" />
              ) : (
                <ImageIcon className="h-4.5 w-4.5 shrink-0 text-indigo" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{file.name}</span>
              <span className="font-mono text-xs text-ink-faint">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-ink-faint hover:bg-surface-2 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
