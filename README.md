# Steel Stacker

Crane-operator game from Southern Steel Engineers. Stack the steel. Ship the truck.

Live: [steelstacker.com](https://steelstacker.com) (once domain is pointed at Vercel)

## Tech

Vite + React 18 + Tailwind v3. No backend in Stage 1: the leaderboard runs on `localStorage` (per-browser, not shared). Stage 2 adds Supabase + Cloudflare Turnstile for a real shared leaderboard.

## Local development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

Output goes to `dist/`. The preview server serves it locally so you can sanity-check the production bundle before pushing.

## Deployment (Vercel)

1. Push this repo to GitHub.
2. In Vercel, click "Add New Project" and import the GitHub repo.
3. Framework Preset: **Vite** (auto-detected).
4. Build Command: `npm run build` (default).
5. Output Directory: `dist` (default).
6. Click Deploy. First deploy takes ~1 minute.

Every subsequent push to `main` auto-deploys.

## Stage 1 vs Stage 2

**Stage 1 (current):** localStorage leaderboard. Each visitor sees their own scores. Good for testing the UI and individual play; not suitable for a shared leaderboard.

**Stage 2 (planned):** Supabase Postgres backend + Cloudflare Turnstile bot protection. Shared leaderboard across all visitors. See `.env.example` for the variables that need to be set in Vercel.

## Files

```
steel-stacker/
  public/
    (static assets — favicon, og:image, etc go here when added)
  src/
    main.jsx        React mount point
    App.jsx         The game (~3400 lines, single component for now)
    index.css       Tailwind directives + body resets
  index.html        Document shell with Google Fonts in <head>
  package.json
  vite.config.js
  tailwind.config.js
  postcss.config.js
  .env.example      Stage 2 env vars (not yet used)
  .gitignore
  README.md
```

## License

All rights reserved. Southern Steel Engineers, Lexington SC.
