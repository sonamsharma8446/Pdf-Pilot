import type { Request, Response } from "express";
import { applyWatermark } from "./watermark.service.js";
import { FileValidationError } from "../../shared/errors/AppError.js";
import type { WatermarkOptions, WatermarkTarget } from "./watermark.types.js";

const VALID_TARGETS: WatermarkTarget[] = ["all", "odd", "even", "selected"];
const VALID_POSITIONS = [
  "center", "top-left", "top-center", "top-right",
  "bottom-left", "bottom-center", "bottom-right",
];

export async function watermarkFile(req: Request, res: Response): Promise<void> {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const pdfFile = files?.["file"]?.[0];

  if (!pdfFile) {
    throw new FileValidationError("No PDF file was received.");
  }

  const type = req.body.type as string | undefined;
  const target = req.body.target as string | undefined;
  const position = req.body.position as string | undefined;
  const rawOpacity = Number(req.body.opacity ?? 0.4);
  const rawRotation = Number(req.body.rotation ?? 0);

  if (type !== "text" && type !== "image") {
    throw new FileValidationError("Select a valid watermark type: text or image.");
  }
  if (!target || !VALID_TARGETS.includes(target as WatermarkTarget)) {
    throw new FileValidationError("Select a valid target.");
  }
  if (!position || !VALID_POSITIONS.includes(position)) {
    throw new FileValidationError("Select a valid position.");
  }
  if (isNaN(rawOpacity) || rawOpacity < 0.01 || rawOpacity > 1) {
    throw new FileValidationError("Opacity must be between 0.01 and 1.");
  }

  let selectedPages: number[] | undefined;
  if (target === "selected") {
    const rawPages = req.body.pages as string | undefined;
    if (!rawPages) throw new FileValidationError("Select at least one page.");
    selectedPages = rawPages.split(",").map(Number).filter((n) => !isNaN(n) && n > 0);
    if (selectedPages.length === 0) throw new FileValidationError("Select at least one page.");
  }

  let watermark: WatermarkOptions;

  if (type === "text") {
    const text = (req.body.text as string | undefined)?.trim();
    if (!text) throw new FileValidationError("Enter watermark text.");
    const fontSize = Math.max(8, Math.min(200, Number(req.body.fontSize ?? 48)));
    const color = /^#[0-9a-fA-F]{3,6}$/.test(req.body.color ?? "") ? req.body.color : "#000000";
    watermark = {
      type: "text",
      text,
      fontSize: isNaN(fontSize) ? 48 : fontSize,
      color,
      opacity: rawOpacity,
      rotation: isNaN(rawRotation) ? 0 : rawRotation,
      position: position as WatermarkOptions["position"],
    };
  } else {
    const imgFile = files?.["watermarkImage"]?.[0];
    if (!imgFile) throw new FileValidationError("Upload a watermark image.");
    const widthPercent = Math.max(5, Math.min(100, Number(req.body.widthPercent ?? 30)));
    watermark = {
      type: "image",
      imageBuffer: imgFile.buffer,
      imageMime: imgFile.mimetype,
      widthPercent: isNaN(widthPercent) ? 30 : widthPercent,
      opacity: rawOpacity,
      rotation: isNaN(rawRotation) ? 0 : rawRotation,
      position: position as WatermarkOptions["position"],
    };
  }

  const result = await applyWatermark({
    pdfBuffer: pdfFile.buffer,
    originalName: pdfFile.originalname,
    watermark,
    target: target as WatermarkTarget,
    selectedPages,
  });

  const outputName = pdfFile.originalname.replace(/\.pdf$/i, "-watermarked.pdf");
  console.info(`[watermark] type=${type} target=${target} ${pdfFile.originalname} → ${result.length} bytes`);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${outputName}"`);
  res.setHeader("Content-Length", result.length.toString());
  res.send(result);
}
