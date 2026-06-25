import { Router } from "express";
import { upload } from "../../middleware/upload.js";
import { rotateFile } from "./rotate.controller.js";

export const rotateRouter = Router();

rotateRouter.post("/", upload.single("file"), rotateFile);
