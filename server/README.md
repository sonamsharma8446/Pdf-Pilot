# PDFPilot — Server

Node.js + Express 5 + TypeScript API. Processes files entirely in memory and never writes them to disk — nothing is retained after a response is sent.

## Setup

```bash
npm install
cp .env.example .env   # adjust CLIENT_ORIGIN if your frontend runs elsewhere
npm run dev            # http://localhost:4000
```

## A note on `canvas`

This package provides server-side `<canvas>` support for `pdfjs-dist` to render PDF pages into images. It compiles native bindings against Cairo/Pango at install time, which can fail in restrictive sandboxes or minimal build environments — see the deployment notes in the root README and the included `Dockerfile`, which installs the required system libraries explicitly. If `npm install` fails on this package locally, install these first:

```bash
# Debian/Ubuntu
apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev build-essential pkg-config
```

## What's implemented

- Express app with helmet, CORS (locked to `CLIENT_ORIGIN`), rate limiting, and a centralized error handler
- Validated environment config (the app refuses to boot with missing/malformed env vars)
- Multer upload middleware (memory storage only) with real magic-byte file-content verification
- `/health` endpoint

Feature routes (merge, split, compress, etc.) aren't built yet — each gets its own `src/features/<name>/` folder with `.routes.ts`, `.controller.ts`, and `.service.ts` files as it's implemented.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run typecheck` | Type-check without emitting files |
