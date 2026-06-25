import { Router } from "express";
import { upload } from "../../middleware/upload.js";
import { mergeFiles } from "./merge.controller.js";

export const mergeRouter = Router();

mergeRouter.post("/", upload.array("files", 10), mergeFiles);
