/**
 * postinstall.mjs
 *
 * Fixes the npm optional-dependency bug for @napi-rs/canvas where the
 * platform-specific .node binary is installed but not discoverable by
 * js-binding.js due to npm's hoisting issue.
 *
 * Copies the platform .node file into the @napi-rs/canvas package root so
 * require('./skia.<platform>.node') resolves directly — no env var needed.
 *
 * Reference: https://github.com/npm/cli/issues/4828
 */

import { platform, arch } from "os";
import { existsSync, copyFileSync, readdirSync } from "fs";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PLATFORM_PKG_MAP = {
  win32: { x64: "@napi-rs/canvas-win32-x64-msvc",  arm64: "@napi-rs/canvas-win32-arm64-msvc" },
  darwin: { x64: "@napi-rs/canvas-darwin-x64",      arm64: "@napi-rs/canvas-darwin-arm64"     },
  linux: { x64: "@napi-rs/canvas-linux-x64-gnu",    arm64: "@napi-rs/canvas-linux-arm64-gnu"  },
};

const plat = platform();
const architecture = arch();
const pkgName = PLATFORM_PKG_MAP[plat]?.[architecture];

if (!pkgName) {
  console.log(`[postinstall] No @napi-rs/canvas mapping for ${plat}/${architecture} — skipping.`);
  process.exit(0);
}

let pkgDir;
try {
  pkgDir = path.dirname(require.resolve(`${pkgName}/package.json`));
} catch {
  console.log(`[postinstall] ${pkgName} not installed — skipping canvas fix.`);
  process.exit(0);
}

// Find the .node file in the platform package
const nodeFiles = readdirSync(pkgDir).filter(f => f.endsWith(".node"));
if (nodeFiles.length === 0) {
  console.warn(`[postinstall] No .node file found in ${pkgDir}`);
  process.exit(0);
}

const srcNode = path.join(pkgDir, nodeFiles[0]);

// Destination: @napi-rs/canvas package root
let canvasDir;
try {
  canvasDir = path.dirname(require.resolve("@napi-rs/canvas/package.json"));
} catch {
  console.warn("[postinstall] @napi-rs/canvas not installed — skipping.");
  process.exit(0);
}

const destNode = path.join(canvasDir, nodeFiles[0]);

if (existsSync(destNode)) {
  console.log(`[postinstall] @napi-rs/canvas native binding already in place: ${nodeFiles[0]}`);
  process.exit(0);
}

try {
  copyFileSync(srcNode, destNode);
  console.log(`[postinstall] ✅ Copied ${nodeFiles[0]} → ${canvasDir}`);
} catch (err) {
  console.warn(`[postinstall] Could not copy native binding: ${err.message}`);
  console.warn("  If canvas rendering fails, delete node_modules and run npm install again.");
}
