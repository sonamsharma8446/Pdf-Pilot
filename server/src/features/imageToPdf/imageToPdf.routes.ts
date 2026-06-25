import { Router } from "express";
import { upload } from "../../middleware/upload.js";
import { convertImagesToPdf } from "./imageToPdf.controller.js";

export const imageToPdfRouter = Router();

// maxCount matches the client-side MAX_IMAGES = 30 limit in useImageToPdf.ts
imageToPdfRouter.post("/", 
  (req, res, next) => {
    console.log("✅ Route reached");
    next();
  }, upload.array("images", 30), convertImagesToPdf);
