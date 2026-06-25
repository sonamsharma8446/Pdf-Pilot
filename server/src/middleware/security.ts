import cors from "cors";
import helmet from "helmet";
import type { Express } from "express";
import { env } from "../config/env.js";

export function applySecurityMiddleware(app: Express): void {
  app.use(
    helmet({
      // This API is consumed cross-origin by design (frontend on Vercel,
      // backend on Render — different origins even when CORS allows the
      // request). Helmet's default same-origin CORP would silently block
      // every response from being read by the frontend in a real browser,
      // independent of and regardless of the CORS headers below.
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      methods: ["GET", "POST", "DELETE"],
      // We don't use cookies or auth headers for these endpoints — every
      // request is a stateless "send a file, get a file back" exchange.
      credentials: false,
    })
  );

  // This API only ever returns JSON or binary file downloads, never HTML,
  // so helmet's default header set is a safe fit with no overrides needed.
  app.disable("x-powered-by");
}
