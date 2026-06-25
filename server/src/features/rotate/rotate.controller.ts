import type { Request, Response } from "express";
import { rotatePdf } from "./rotate.service.js";
import { FileValidationError } from "../../shared/errors/AppError.js";
import type { RotationAngle, RotationTarget } from "./rotate.types.js";

const VALID_ANGLES: RotationAngle[] = [90, 180, 270];
const VALID_TARGETS: RotationTarget[] = ["all", "selected", "odd", "even"];

export async function rotateFile(req: Request, res: Response): Promise<void> {
  const file = req.file;
  if (!file) {
    throw new FileValidationError("No file was received. Select a PDF file and try again.");
  }

  const rawAngle = Number(req.body.angle);
  if (!VALID_ANGLES.includes(rawAngle as RotationAngle)) {
    throw new FileValidationError("Select a valid rotation angle: 90, 180, or 270 degrees.");
  }

  const target = req.body.target as string | undefined;
  if (!target || !VALID_TARGETS.includes(target as RotationTarget)) {
    throw new FileValidationError("Select a valid rotation target.");
  }

  let selectedPages: number[] | undefined;
  if (target === "selected") {
    const rawPages = req.body.pages as string | undefined;
    if (!rawPages) throw new FileValidationError("Select at least one page to rotate.");
    selectedPages = rawPages
      .split(",")
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0);
    if (selectedPages.length === 0) {
      throw new FileValidationError("Select at least one page to rotate.");
    }
  }

  const result = await rotatePdf({
    buffer: file.buffer,
    originalName: file.originalname,
    angle: rawAngle as RotationAngle,
    target: target as RotationTarget,
    selectedPages,
  });

  const outputName = file.originalname.replace(/\.pdf$/i, "-rotated.pdf");
  console.info(
    `[rotate] angle=${rawAngle} target=${target} pages=${selectedPages?.join(",") ?? "all"} → ${result.length} bytes`
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${outputName}"`);
  res.setHeader("Content-Length", result.length.toString());
  res.send(result);
}
