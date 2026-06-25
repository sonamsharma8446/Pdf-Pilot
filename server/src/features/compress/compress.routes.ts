import { Router } from "express";
import { upload } from "../../middleware/upload.js";
import { compressFile } from "./compress.controller.js";

export const compressRouter = Router();

compressRouter.post("/", upload.single("file"), compressFile);
