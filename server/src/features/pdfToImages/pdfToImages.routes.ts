import { Router } from "express";
import { upload } from "../../middleware/upload.js";
import { convertPdfToImages } from "./pdfToImages.controller.js";

export const pdfToImagesRouter = Router();

pdfToImagesRouter.post("/", upload.single("file"), convertPdfToImages);
