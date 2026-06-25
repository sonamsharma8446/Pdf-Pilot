import { Router } from "express";
import multer from "multer";
import { watermarkFile } from "./watermark.controller.js";
import { env } from "../../config/env.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

export const watermarkRouter = Router();

watermarkRouter.post(
  "/",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "watermarkImage", maxCount: 1 },
  ]),
  watermarkFile
);
