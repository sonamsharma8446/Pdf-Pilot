import { Router } from "express";
import { upload } from "../../middleware/upload.js";
import { splitFile } from "./split.controller.js";

export const splitRouter = Router();

splitRouter.post("/", upload.single("file"), splitFile);
