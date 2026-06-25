import { useCallback, useState, useRef } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { UploadCloud } from "lucide-react";

const DEFAULT_MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // keep in sync with server MAX_UPLOAD_SIZE_MB

const DEFAULT_ACCEPTED_TYPES: Accept = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

interface UploadZoneProps {
  onFilesAdded: (files: File[]) => void;
  accept?: Accept;
  acceptLabel?: string;
  maxFileSizeBytes?: number;
}

/**
 * Controlled, headless dropzone — handles drag/drop, browse, and
 * client-side type/size validation only. It does NOT own a staged-file
 * list; every consumer renders its own (a flat list, a reorderable list,
 * whatever fits), since different tools need very different list UIs.
 */
export function UploadZone({
  onFilesAdded,
  accept = DEFAULT_ACCEPTED_TYPES,
  acceptLabel = "PDF · JPG · PNG",
  maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE_BYTES,
}: UploadZoneProps) {
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setRejectionMessage(
        rejections.length > 0
          ? `Some files weren't added — only ${acceptLabel} files up to ${Math.round(
              maxFileSizeBytes / (1024 * 1024)
            )}MB are supported.`
          : null
      );
      if (accepted.length > 0) onFilesAdded(accepted);
    },
    [onFilesAdded, acceptLabel, maxFileSizeBytes]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxSize: maxFileSizeBytes,
    multiple: true,
    noClick: true, // the explicit "Browse files" button is the only click target — avoids nesting two interactive controls
    noKeyboard: true,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const inputProps = getInputProps();

  return (
    <div>
      <div
        {...getRootProps()}
        className={`rounded-2xl border-[1.5px] border-dashed px-6 py-10 text-center transition-colors
          ${isDragActive ? "border-indigo bg-surface-2 shadow-[var(--shadow-glow)]" : "border-line-strong bg-surface"}`}
      >
        <input
          {...inputProps}
          aria-label="File upload"
          // Ensure the input is not `display: none` so programmatic `click()` works.
          style={{ position: "absolute", left: "-9999px" }}
          ref={(el) => {
            inputRef.current = el as HTMLInputElement | null;
            // Preserve any ref react-dropzone provided (it's typed as any here).
            const props = inputProps as any;
            if (props && props.ref) {
              if (typeof props.ref === "function") props.ref(el);
              else if (props.ref && typeof props.ref === "object") props.ref.current = el;
            }
          }}
        />
        <div className="mx-auto mb-3.5 flex h-13 w-13 items-center justify-center rounded-full bg-surface-2 text-indigo">
          <UploadCloud className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="text-base font-semibold text-ink">Drag &amp; drop files here</h3>
        <p className="mb-4 text-sm text-ink-soft">or browse from your device</p>
        <button
          type="button"
          onClick={() => {
            // Diagnostic: surface whether `open` exists and whether inputRef is set
            // eslint-disable-next-line no-console
            console.log("UploadZone: button clicked; open=", typeof open, "inputRef=", !!inputRef.current);

            try {
              if (typeof open === "function") {
                open();
                return;
              }
            } catch (err) {
              // ignore and fallback to input click
            }

            // Fallback: trigger native input click if react-dropzone `open` is unavailable
            try {
              inputRef.current?.click();
            } catch (err) {
              // eslint-disable-next-line no-console
              console.error("UploadZone: failed to open file dialog", err);
            }
          }}
          className="rounded-xl bg-gradient-to-br from-indigo via-violet to-coral px-5 py-2.5 text-sm
            font-semibold text-white shadow-[var(--shadow-glow)] transition-[filter] hover:brightness-110"
        >
          Browse files
        </button>
        <p className="mt-3.5 font-mono text-xs text-ink-faint">
          {acceptLabel} — up to {Math.round(maxFileSizeBytes / (1024 * 1024))}MB per file
        </p>
      </div>

      {rejectionMessage && (
        <p role="alert" className="mt-2.5 text-sm text-danger">
          {rejectionMessage}
        </p>
      )}
    </div>
  );
}
