import type { Request, Response } from "express";
import { mergePdfs } from "./merge.service.js";
import { FileValidationError } from "../../shared/errors/AppError.js";
import type { MergeInput } from "./merge.types.js";

export async function mergeFiles(req: Request, res: Response): Promise<void> {
  const files = req.files;

  if (!Array.isArray(files) || files.length === 0) {
    throw new FileValidationError("No files were received. Select PDF files and try again.");
  }

  const inputs: MergeInput[] = files.map((file) => ({
    buffer: file.buffer,
    originalName: file.originalname,
  }));

  const mergedBuffer = await mergePdfs(inputs);

  console.info(`[merge] merged ${inputs.length} files → ${(mergedBuffer.length / 1024).toFixed(0)}KB output`);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="merged.pdf"');
  res.setHeader("Content-Length", mergedBuffer.length.toString());
  res.send(mergedBuffer);
}
