import type { NextFunction, Request, Response } from "express";
import { AppError } from "../shared/errors/AppError.js";
import { isProduction } from "../config/env.js";
import { MulterError } from "multer";

// Messages produced by multer's internal abort/close handlers when the client
// disconnects mid-upload. These are not server errors — the client simply
// closed the connection (e.g. navigation, component unmount, timeout).
const CONNECTION_ABORT_MESSAGES = new Set([
  "Request aborted",
  "Request closed",
  "Request error",
]);

function isConnectionAbort(err: unknown): boolean {
  return (
    err instanceof Error && CONNECTION_ABORT_MESSAGES.has(err.message)
  );
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Client disconnected mid-upload — multer emits one of these plain Errors.
  // The socket is already closed so we cannot send a response; just bail out
  // quietly without logging a scary "Unhandled error" message.
  if (isConnectionAbort(err)) {
    if (!res.headersSent) {
      res.status(499).end(); // 499 = Client Closed Request (nginx convention)
    }
    return;
  }

  // Multer throws its own error type for upload-level problems (file too
  // large, wrong field name, etc.) — translate it into our standard shape.
  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "That file is larger than the allowed upload size."
        : "There was a problem with the upload.";
    res.status(413).json({ error: { message, code: err.code } });
    return;
  }

  if (err instanceof AppError) {
    console.warn(`[${err.name}] ${req.method} ${req.path} — ${err.message}`);
    res.status(err.statusCode).json({ error: { message: err.message } });
    return;
  }

  // Anything else is unexpected — log it fully server-side, but never leak
  // internals (stack traces, file paths, library error text) to the client.
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: {
      message: "Something went wrong while processing your request.",
      ...(isProduction ? {} : { debug: err instanceof Error ? err.message : String(err) }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { message: `No route matches ${req.method} ${req.path}` } });
}
