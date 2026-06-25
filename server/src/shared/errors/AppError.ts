/**
 * Use this for any expected, "the user did something the API can't fulfill"
 * situation — wrong file type, corrupted PDF, page index out of range, etc.
 * Anything thrown that ISN'T an AppError is treated as a genuine bug and
 * gets logged with a stack trace rather than shown to the client verbatim.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class FileValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = "FileValidationError";
  }
}

export class PdfProcessingError extends AppError {
  constructor(message: string) {
    super(message, 422);
    this.name = "PdfProcessingError";
  }
}
