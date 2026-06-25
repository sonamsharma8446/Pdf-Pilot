export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke on the next tick — revoking immediately can interrupt the
  // download in some browsers if it hasn't finished reading the blob yet.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * The server sends the canonical filename via Content-Disposition, so the
 * client doesn't need to hardcode "merged.pdf" / "compressed.pdf" / etc.
 * separately — falls back to the given default if the header is missing
 * or unparsable.
 */
export function getFilenameFromContentDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^";]+)"?/.exec(header);
  return match?.[1] ?? fallback;
}
