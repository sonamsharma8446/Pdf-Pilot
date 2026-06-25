# PDFPilot — Client

React 19 + Vite + TypeScript + Tailwind v4.

## Setup

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if your backend runs elsewhere
npm run dev            # http://localhost:5174
```

## Design tokens

`src/index.css` defines every color, font, and shadow token via Tailwind v4's CSS-first `@theme` block, with a `.dark` class override for dark mode (not OS-preference-only — see `ThemeProvider`). These values are kept in sync by hand with the two HTML mockups from the design phase; if you change one, change the other.

## What's implemented

- Routing shell: `DashboardLayout` (navbar + sidebar + outlet)
- Theme system: light/dark toggle, persisted, OS-preference-aware on first visit
- Upload zone: real drag-and-drop and file staging via `react-dropzone`, with client-side type/size validation (not yet wired to a processing endpoint — no feature routes exist server-side yet)
- Recent files: `useRecentFiles` hook, backed by `localStorage` only, per the architecture decision that the server never retains files

Sidebar items for individual tools (Merge, Split, etc.) are intentionally **not** clickable yet — they show a "Soon" badge instead of linking to a page that doesn't exist.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |
