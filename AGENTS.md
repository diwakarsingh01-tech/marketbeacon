# MarketBeacon Pro — AGENTS.md

Website: https://marketbeaconpro.com | VPS: 165.99.223.76 (SSH key: `~/.ssh/marketbeacon`)

## Commands

```bash
# Frontend (root)
npm run dev              # Vite dev server on :5173
npm run build            # tsc -b && vite build
npm run build:prerender  # build + generate static HTML for SEO routes
npm run lint             # ESLint

# Backend (from backend/)
npm run dev              # tsx src/index.ts (hot reload)
npm run build            # tsc
npm start                # node dist/index.js

# Full deploy (from root)
bash deploy.sh           # builds both, tars, SCPs to VPS, triggers webhook
```

## Architecture

- **Frontend** (`src/`): React 19 + Vite 8 + Tailwind CSS 4 + TypeScript 6. Path alias `@/` → `./src/*`.
- **Backend** (`backend/`): Express 5 + TypeScript. Dev via `tsx`, prod via `tsc` + `node dist/index.js`.
- **Databases**: Local SQLite file `backend/marketbeacon.db` via libsql client (file: mode — used when `TURSO_DATABASE_URL` is empty). Turso/Supabase only if env credentials are provided.
- **Auth**: Google OAuth (hardcoded client ID in `src/main.tsx` + `.env.example`) + JWT.
- **Deploy**: VPS behind nginx. Docker Compose runs backend, n8n, litellm, open-webui, algo API. Vercel handles domain redirects only.

## Key conventions

- **Build order matters**: `npm run build` runs `tsc -b && vite build`. For SEO, use `npm run build:prerender` (build + `node prerender.mjs`).
- **Path alias**: `@/` maps to `./src/*` (configured in `vite.config.ts` + `tsconfig.app.json`).
- **Backend strictness**: `tsconfig.json` has `strict: false` — no need to fix implicit-any warnings.
- **Frontend strictness**: `tsconfig.app.json` has `strict: true`, `noUnusedLocals`, `noUnusedParameters`.
- **Backend dev**: uses `tsx` (not `ts-node`). `npm run dev` in `backend/` starts the Express server with hot reload.
- **Backend build**: `tsc` outputs to `backend/dist/`. The Docker container mounts this directory.
- **SEO prerender**: `prerender.mjs` generates static `index.html` files for 15+ routes after `vite build`. Add new routes to the `routes` array in that file.
- **Deploy flow**: `bash deploy.sh` → builds both → tars → SCPs to VPS → POSTs to deploy webhook on port 3099.
- **VPS deploy**: `bash server_deploy.sh` (on VPS) copies frontend dist, installs nginx config, reloads nginx.
- **Docker**: `docker-compose.yml` runs backend, n8n, algo API, litellm, open-webui. Backend container mounts `dist/` and data files from host.
- **Vercel**: only handles domain redirects (`marketbeacon.vercel.app` → `marketbeaconpro.com`, `www.` → apex). SPA fallback rewrite.

## SEO & Prerendering

- `prerender.mjs` generates static `index.html` files for 15+ routes after `vite build`. Add new routes to the `routes` array in that file.
- `public/sitemap.xml` points to `/api/sitemap.xml` (dynamic NIFTY 500 stock pages).
- `public/robots.txt`, `public/manifest.json`, `public/sw.js` are static.

## Backend services

- **Cron**: `backend/src/cron/auditScheduler.ts` — scheduled market audits.
- **Worker**: `backend/src/services/worker.ts` — Alpha-40 pre-calculation.
- **Strategies**: `backend/src/strategies/index.ts` — strategy definitions.
- **Audit engine**: `backend/src/services/audit/` — basket audit, strategy audit, structural analysis.
- **AI**: `backend/src/services/aiService.ts` — stock analysis + chat.
- **Backtest**: `backend/src/services/backtestEngine.ts`.
- **Tests**: `backend/src/tests/` — GTM test suite + stress test (no formal test framework configured).

## Conventions

- **Build before push**: always run `npm run build` (frontend) and `cd backend && npm run build` before deploying.
- **No test framework**: backend `npm test` is a placeholder. Manual testing via `backend/src/tests/` scripts.
- **SEO routes**: prerendered via `prerender.mjs`. Add new routes to the `routes` array there.
- **Data sync**: `src/data/stocks.ts` (frontend stock universe: STRATEGIES + BASKETS) must mirror backend's `backend/src/index.ts` (STRATEGIES + BASKETS defined around lines 266-317). `backend/src/universe.ts` only holds the NIFTY_500 symbol list — not the strategies/baskets.
- **Dark theme locked**: `document.documentElement.setAttribute('data-theme', 'dark')` in `src/main.tsx`.
- **Google OAuth client ID**: hardcoded in `src/main.tsx` and `.env.example`. Both must stay in sync.
- **Deploy key**: `x-deploy-key: mb-deploy-2026` for the VPS deploy webhook (port 3099).
- **SSH key**: `~/.ssh/marketbeacon` for VPS access.

## Related projects

- `marketbeacon-seo-ops/` — separate Python-based SEO automation (metadata gen, content expansion, image optimization, Lighthouse CI). Uses Jinja2 templates, Screaming Frog exports.
- `marketbeacon/marketbeacon/` — appears to be a stale copy/backup of the main project. Prefer the root `marketbeacon/` for all work.

## Existing instruction files

- `marketbeacon/GEMINI.md` — SOP with pre-change audit checklist, version control workflow, modular architecture rules, zero-crash policy.
- `marketbeacon/MEMORY.md` — session memory with recent changes and pending items.
- `~/.claude/CLAUDE.md` — ruflo integration (MCP tools for multi-file tasks).
- `marketbeacon/skills/institutional-agent/SKILL.md` — institutional agent skill definition.
