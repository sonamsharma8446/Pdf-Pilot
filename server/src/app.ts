import express, { type Express } from "express";
import morgan from "morgan";
import { applySecurityMiddleware } from "./middleware/security.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { isProduction } from "./config/env.js";
import { mergeRouter } from "./features/merge/merge.routes.js";
import { splitRouter } from "./features/split/split.routes.js";
import { compressRouter } from "./features/compress/compress.routes.js";
import { rotateRouter } from "./features/rotate/rotate.routes.js";
import { imageToPdfRouter } from "./features/imageToPdf/imageToPdf.routes.js";
import { pdfToImagesRouter } from "./features/pdfToImages/pdfToImages.routes.js";
import { watermarkRouter } from "./features/watermark/watermark.routes.js";

export function createApp(): Express {
  const app = express();

  applySecurityMiddleware(app);

  if (!isProduction) {
    app.use(morgan("dev"));
  }

  app.use(express.json({ limit: "1mb" })); // small limit — actual files go through multer, not JSON bodies

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Every processing endpoint is rate-limited — there's no auth layer to
  // throttle by user, so IP-based limiting is the main abuse guard.
  app.use("/api", apiRateLimiter);

  // Feature routers get mounted here one at a time as each tool is built.
  app.use("/api/merge", mergeRouter);
  app.use("/api/split", splitRouter);
  app.use("/api/compress", compressRouter);
  app.use("/api/rotate", rotateRouter);
  app.use("/api/image-to-pdf", imageToPdfRouter);
  app.use("/api/pdf-to-images", pdfToImagesRouter);
  app.use("/api/watermark", watermarkRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
