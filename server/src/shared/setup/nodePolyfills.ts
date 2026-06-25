/**
 * Node.js global polyfills required before importing pdfjs-dist.
 *
 * pdfjs-dist v6 expects browser globals (DOMMatrix, ImageData, Path2D) to
 * exist even in Node.js. @napi-rs/canvas provides real implementations of
 * all three, but it loads a platform-specific native .node binding which npm
 * sometimes fails to link correctly due to an optional-dependency bug
 * (https://github.com/npm/cli/issues/4828).
 *
 * This module:
 *  1. Sets NAPI_RS_NATIVE_LIBRARY_PATH so canvas can find its .node file
 *     even when npm's optional-dep resolution failed.
 *  2. Loads canvas and registers DOMMatrix, ImageData, Path2D as globals.
 *  3. Falls back to a lightweight DOMMatrix polyfill when canvas itself
 *     cannot load, so pdfjs can at least parse and load PDFs (rendering
 *     still requires a working canvas).
 *
 * IMPORTANT: this file must be imported at the very top of any module that
 * uses pdfjs-dist, before pdfjs itself is imported.
 */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 1. Help @napi-rs/canvas find its platform .node file when npm linking broke
// ---------------------------------------------------------------------------
function resolveCanvasNativeBinding(): string | null {
  const platform = process.platform;
  const arch = process.arch;

  type PlatformMap = Record<string, Record<string, string>>;
  const nameMap: PlatformMap = {
    win32:  { x64: "canvas-win32-x64-msvc",  arm64: "canvas-win32-arm64-msvc" },
    darwin: { x64: "canvas-darwin-x64",       arm64: "canvas-darwin-arm64"     },
    linux:  { x64: "canvas-linux-x64-gnu",    arm64: "canvas-linux-arm64-gnu"  },
  };

  const pkgSuffix = nameMap[platform]?.[arch];
  if (!pkgSuffix) return null;

  // Walk up from this file to find node_modules/@napi-rs/<pkg>
  const candidates = [
    path.resolve(__dirname, `../../../../../node_modules/@napi-rs/${pkgSuffix}`),
    path.resolve(__dirname, `../../../../../../node_modules/@napi-rs/${pkgSuffix}`),
  ];

  for (const candidate of candidates) {
    try {
      const pkg = require(`${candidate}/package.json`) as { name: string };
      if (pkg.name) {
        // Find the .node file inside the package
        const fs = require("fs") as typeof import("fs");
        const files = fs.readdirSync(candidate).filter((f: string) => f.endsWith(".node"));
        if (files.length > 0) {
          return path.join(candidate, files[0]!);
        }
      }
    } catch {
      // try next
    }
  }
  return null;
}

if (!process.env["NAPI_RS_NATIVE_LIBRARY_PATH"]) {
  const binding = resolveCanvasNativeBinding();
  if (binding) {
    process.env["NAPI_RS_NATIVE_LIBRARY_PATH"] = binding;
  }
}

// ---------------------------------------------------------------------------
// 2. Load canvas and register globals
// ---------------------------------------------------------------------------
let canvasLoaded = false;

try {
  // Use createRequire since @napi-rs/canvas is CJS
  const canvas = require("@napi-rs/canvas") as {
    DOMMatrix: typeof DOMMatrix;
    ImageData: typeof ImageData;
    Path2D: typeof Path2D;
    createCanvas: unknown;
  };

  if (!global.DOMMatrix)  (global as unknown as Record<string, unknown>).DOMMatrix  = canvas.DOMMatrix;
  if (!global.ImageData)  (global as unknown as Record<string, unknown>).ImageData  = canvas.ImageData;
  if (!global.Path2D)     (global as unknown as Record<string, unknown>).Path2D     = canvas.Path2D;

  canvasLoaded = true;
} catch (err) {
  console.warn(
    "[nodePolyfills] @napi-rs/canvas failed to load — pdfjs rendering will not work.\n" +
    "  Fix: delete node_modules and package-lock.json, then run `npm install` again.\n" +
    "  Error:", (err as Error).message
  );

  // ---------------------------------------------------------------------------
  // 3. Minimal DOMMatrix polyfill so pdfjs can at least open PDFs without crashing
  // ---------------------------------------------------------------------------
  if (!global.DOMMatrix) {
    class DOMMatrixPolyfill {
      a=1; b=0; c=0; d=1; e=0; f=0;
      m11=1; m12=0; m13=0; m14=0;
      m21=0; m22=1; m23=0; m24=0;
      m31=0; m32=0; m33=1; m34=0;
      m41=0; m42=0; m43=0; m44=1;
      is2D=true; isIdentity=true;
      constructor(_init?: string | number[]) {}
      multiply(_m?: DOMMatrixPolyfill) { return new DOMMatrixPolyfill(); }
      translate(tx=0, ty=0, _tz=0) { const m = new DOMMatrixPolyfill(); m.e=tx; m.f=ty; return m; }
      scale(sx=1, sy=sx) { const m = new DOMMatrixPolyfill(); m.a=sx; m.d=sy; return m; }
      rotate(_angle=0) { return new DOMMatrixPolyfill(); }
      skewX(_angle=0) { return new DOMMatrixPolyfill(); }
      skewY(_angle=0) { return new DOMMatrixPolyfill(); }
      flipX() { return new DOMMatrixPolyfill(); }
      flipY() { return new DOMMatrixPolyfill(); }
      inverse() { return new DOMMatrixPolyfill(); }
      transformPoint(p: {x?:number;y?:number;z?:number;w?:number}) { return {x:p.x??0,y:p.y??0,z:p.z??0,w:p.w??1}; }
      toString() { return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`; }
      static fromMatrix(_m?: unknown) { return new DOMMatrixPolyfill(); }
      static fromFloat32Array(_a: Float32Array) { return new DOMMatrixPolyfill(); }
      static fromFloat64Array(_a: Float64Array) { return new DOMMatrixPolyfill(); }
    }
    (global as unknown as Record<string, unknown>).DOMMatrix = DOMMatrixPolyfill;
  }
}

export { canvasLoaded };
