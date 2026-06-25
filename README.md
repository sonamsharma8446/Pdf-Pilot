# PDFPilot

The Complete Free PDF Workspace — a SaaS PDF utility app. Real processing, no demo data: every tool produces an actual downloadable file.

## Structure

```
pdfpilot/
  client/   React 19 + Vite + TypeScript + Tailwind v4 → deploys to Vercel
  server/   Node + Express 5 + TypeScript            → deploys to Render (Docker)
```

Each has its own README with setup instructions.

## Architecture decisions

These were resolved before any code was written, since they shape the folder structure on both sides:

- **PDF → Images**: `pdfjs-dist` rendering to a server-side `<canvas>` (via the `canvas` package), with `pdfjs-dist` reused client-side for live preview where appropriate.
- **Compress PDF**: lossless-first. `pdf-lib` object-stream resaving plus non-destructive `sharp` re-encoding of embedded images. No aggressive/destructive downsampling in v1 — that's a deliberate scope boundary, not an oversight.
- **Recent files**: `localStorage` only, no accounts, no database. The server processes files in memory and discards them immediately after responding — nothing is retained. This means "recent files" is a history log of past actions, not a list of re-downloadable links.

## Deployment note: the `canvas` dependency

`canvas` compiles native bindings (Cairo/Pango) at install time. During scaffolding, this failed in the sandboxed build environment — isolating the cause showed two contributing factors: the sandbox's network policy blocked fetching Node headers from nodejs.org (a sandbox-specific restriction, not a Render issue), and there's no prebuilt binary for this exact platform target, forcing a from-source compile. The required system libraries (`libcairo2-dev`, `libpango1.0-dev`, etc.) installed cleanly via `apt` once tried directly.

The fix: `server/Dockerfile` deploys the API as a Docker image on Render (rather than Render's native Node buildpack), with those system libraries installed explicitly in the build stage. This needs to be verified on the first real deploy, since it couldn't be fully validated inside this sandbox — flagging that honestly rather than claiming certainty.

## What exists so far

Both apps are scaffolded, type-checked, linted, and verified to actually boot — not just configured on paper. No PDF processing features are implemented yet; that's the next phase.
