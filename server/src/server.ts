import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();
app.set("trust proxy", 1);
const server = app.listen(env.PORT, () => {
  console.log(`PDFPilot API listening on port ${env.PORT} [${env.NODE_ENV}]`);
});

function shutdown(signal: string): void {
  console.log(`\n${signal} received — shutting down gracefully`);
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
