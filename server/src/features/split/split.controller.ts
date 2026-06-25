import type { Request, Response } from "express";
import JSZip from "jszip";
import { splitPdf } from "./split.service.js";
import { FileValidationError } from "../../shared/errors/AppError.js";
import type { SplitMode } from "./split.types.js";

const VALID_MODES: SplitMode[] = ["all", "ranges", "extract"];

export async function splitFile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new FileValidationError("No file was received. Select a PDF file and try again.");
  }

  const mode = req.body.mode as string | undefined;
  if (!mode || !VALID_MODES.includes(mode as SplitMode)) {
    throw new FileValidationError("Select a valid split mode.");
  }

  const rangeInput = typeof req.body.rangeInput === "string" ? req.body.rangeInput : undefined;

  const outputs = await splitPdf({
    buffer: file.buffer,
    originalName: file.originalname,
    mode: mode as SplitMode,
    rangeInput,
  });

  console.info(`[split] mode=${mode} produced ${outputs.length} file(s) from ${file.originalname}`);

  if (outputs.length === 1) {
    const single = outputs[0]!;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${single.name}"`);
    res.setHeader("Content-Length", single.buffer.length.toString());
    res.send(single.buffer);
    return;
  }

  const zip = new JSZip();
  outputs.forEach((output) => zip.file(output.name, output.buffer));
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="split.zip"');
  res.setHeader("Content-Length", zipBuffer.length.toString());
  res.send(zipBuffer);
}
