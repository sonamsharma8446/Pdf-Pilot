import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  // No "*" in production — the frontend origin must be explicit so we don't
  // accidentally accept uploads from arbitrary third-party sites.
  CLIENT_ORIGIN: z.string().url(),

  // Hard ceiling on upload size. Files are held in memory (never written to
  // disk) during processing, so this directly bounds worst-case RAM usage
  // per concurrent request — keep it conservative on a free-tier instance.
  MAX_UPLOAD_SIZE_MB: z.coerce.number().int().positive().default(50),

  // How long a request is allowed to sit in the rate-limit window.
  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Server cannot start with invalid environment configuration.");
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";
