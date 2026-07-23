# St. Augustine TimeQuest — Claude Session Context

Paste this file into a new Claude conversation to resume work on this project.

---

## What This Is

We built **St. Augustine TimeQuest** — a mobile-first, location-based historical adventure PWA
for tourists in St. Augustine, FL. Players visit real GPS locations, complete challenges,
converse with AI historical characters, and earn badges — all working offline.

The full codebase (111 files) is at `~/Desktop/TTT` (or wherever you've moved this folder).

---

## Tech Stack

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, MapLibre GL
- **Backend**: FastAPI (Python 3.11), asyncpg, SQLAlchemy async, Alembic
- **Database**: PostgreSQL 15 + PostGIS 3.3 (GeoAlchemy2)
- **Vector search**: Qdrant v1.7.4, nomic-embed-text embeddings (768-dim, cosine)
- **Local LLM**: Ollama — llama3.2 + nomic-embed-text
- **Object storage**: MinIO (S3-compatible)
- **Auth**: JWT (access 15min, refresh 7 days), bcrypt, token blacklist table
- **PWA**: Service worker (cache-first static, LRU tile cache 500 entries, stale-while-revalidate API), IndexedDB, Background Sync

---

## What's Built (111 files)

### Infrastructure
- `docker-compose.yml` — 6 services: postgres/postgis:15-3.3, qdrant, minio + init sidecar, ollama, backend, frontend
- `Dockerfile.backend`, `Dockerfile.frontend`
- `.env.example`, `frontend/.env.example`
- `requirements.txt`, `alembic.ini`, `alembic/env.py`
- `scripts/init-db.sql`, `start-dev.sh`, `reset-dev.sh`

### Backend Models (app/models/)
user, adventure, stop, challenge, session, team, badge, submission, audit_log, token_blacklist

### Backend API Routers (app/api/)
auth, adventures, stops, challenges, sessions, teams, characters, badges, submissions, gps_checkin, account, admin_audit

### Backend Core
- `app/main.py` — FastAPI factory with lifespan, CORS, 12 routers
- `app/core/config.py` — pydantic-settings
- `app/db/session.py` / `base.py` — async engine, sessionmaker
- `app/auth/jwt.py` / `deps.py` — JWT encode/decode, blacklist, get_current_user
- `app/middleware/` — rate_limit (slowapi), security_headers (CSP/HSTS), sanitize (10MB limit)
- `app/utils/` — file_validation (magic bytes), audit (AuditLog)

### AI Pipeline
- `app/ai/characters.py` — 7 historical characters (TypedDict configs)
- `app/ai/rag.py` — embed_text (Ollama), retrieve_context (Qdrant), injection guard
- `app/ai/ingest.py` — PDF/HTML/text extraction, chunking (400-token, 50 overlap), batch embed
- `app/ai/source_register.py` — 14 historical document registrations
- `scripts/ingest_sources.py`, `seed_sources.py`, `seed_adventures.py`

### Frontend Config
- `frontend/next.config.js`, `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- `frontend/public/sw.js` (service worker), `manifest.json` (PWA)

### Frontend Styles
- `src/styles/globals.css`, `accessibility.css`, `map-themes.css`

### Frontend Context & Hooks
- `AccessibilityContext.tsx` — font size (normal/large/x-large), high contrast, reduce motion; persists to localStorage
- `usePlayerLocation.ts` — watchPosition GPS + simulateLocation()
- `useTimeOfDay.ts` — morning/afternoon/evening/night periods, day/night map theme
- `useOfflineSync.ts` — IndexedDB queue + Background Sync API
- `useIndexedDB.ts` — get/set/remove on tq-progress database

### Frontend Components
- `map/AdventureMap.tsx` — MapLibre GL, stop markers, route line, player dot, day/night theme
- `player/DistanceIndicator.tsx` — ARIA progressbar, proximity color coding
- `player/HintButton.tsx` — two-tap confirm, deducts points, shows hint inline
- `player/BadgeEarned.tsx` — alertdialog, auto-dismiss 6s, focus management
- `player/BadgeTray.tsx` — badge list with role="list"
- `player/TimeOfDayBanner.tsx` — decorative color bar + sr-only greeting
- `player/AccessibilityPanel.tsx` — bottom sheet, font/contrast/motion toggles
- `player/AppFooter.tsx` — privacy/terms/accessibility links
- `player/PhotoChallengeCapture.tsx` — camera/file picker, preview, 10MB validation, upload
- `player/AIChatChallenge.tsx` — full chat UI, typing indicator, SR live region, auto-completes after minExchanges
- `player/BranchingStoryChallenge.tsx` — choice-based story, history dots, restart
- `debug/SimulatedGPS.tsx` — dev-only GPS simulator (8 St. Augustine presets)
- `admin/AdminLayout.tsx`, `AuthGuard.tsx`

### Frontend Pages
- `app/page.tsx` — home, published adventure list, revalidate 60s
- `app/layout.tsx` — root layout, SW registration, skip nav, AccessibilityProvider
- `app/offline/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`
- `adventure/[id]/start/page.tsx` — main player (GPS, haversine, check-in, hints, badges)
- `adventure/[id]/complete/page.tsx` — completion screen
- `adventure/[id]/leaderboard/page.tsx` — ranked leaderboard with medals
- `admin/login/page.tsx`, `admin/page.tsx` (dashboard)
- `admin/adventures/page.tsx` — list with publish/unpublish/delete
- `admin/adventures/[id]/page.tsx` — edit adventure + stop list
- `admin/adventures/[id]/stops/[stopId]/page.tsx` — edit stop + challenge CRUD
- `admin/submissions/page.tsx` — photo review (approve/reject)
- `admin/characters/page.tsx` — character cards with greetings
- `admin/analytics/page.tsx` — leaderboard per adventure

---

## AI Characters

| ID | Character | Era |
|---|---|---|
| spanish_colonial_guide | Doña Isabella Reyes | 1750 |
| pedro_menendez | Pedro Menéndez de Avilés | 1565 |
| henry_flagler | Henry Flagler | Gilded Age |
| pirate_captain | Captain Rodrigo Vargas | 1710 |
| victorian_tourist | Mrs. Eleanor Whitmore | 1895 |
| colonial_shopkeeper | Thomas Dunbar | 1775 |
| civil_rights_guide | James Holloway | 1964 |

---

## Challenge Types

gps_checkin, multiple_choice, text_answer, photo_submission, ai_conversation, sequence_puzzle, qr_code, branching_story

---

## Seed Data

5 stops seeded at real St. Augustine coordinates:
1. Castillo de San Marcos (29.8981, -81.3120) — spanish_colonial_guide
2. City Gates (29.8937, -81.3131) — colonial_shopkeeper
3. Flagler College (29.8898, -81.3135) — henry_flagler
4. Fountain of Youth (29.9028, -81.3169) — pedro_menendez
5. Lincolnville (29.8810, -81.3098) — civil_rights_guide

3 badges: Founding Explorer (complete), Speed Historian (< 75 min), Pathfinder (no hints)

---

## How to Start

```bash
cd ~/Desktop/TTT   # (or wherever you moved the folder)
chmod +x scripts/start-dev.sh scripts/reset-dev.sh
./scripts/start-dev.sh
```

The script auto-generates the first Alembic migration if none exists, then seeds data.

URLs after startup:
- Player app: http://localhost:3000
- Admin portal: http://localhost:3000/admin
- API docs: http://localhost:8000/docs
- MinIO: http://localhost:9001 (timequest / timequest_dev_secret)

---

## What Still Needs Work

1. **Historical content** — `data/sources/` has stub text files. Replace with real content
   then run: `docker compose exec backend python scripts/ingest_sources.py`

2. **MapTiler API key** — Free at maptiler.com. Add to `frontend/.env.local`:
   `NEXT_PUBLIC_MAPTILER_KEY=your_key_here`

3. **Admin account** — No user creation UI yet. Create first admin via API:
   `POST /api/v1/auth/register` then manually set `is_admin=true` in the DB.

4. **Production deployment** — Not yet configured (no Nginx, no TLS, no cloud DB).
   The Docker setup is dev-only.

5. **Photo challenge review workflow** — Backend + admin UI exist, but no email
   notification when a submission arrives.

6. **QR code generation** — The qr_code challenge type validates scanned codes but
   there's no QR generation utility yet.

---

## Key Design Decisions Made

- **RAG uncertainty threshold**: 0.65 — responses below this score fall back to character knowledge
- **GPS radius**: 30–60m per stop (configurable per stop in admin)
- **Hint penalty**: deducted from session score (HINT_POINT_PENALTY env var)
- **Photo submissions**: pending review by admin before points awarded
- **Simulated GPS**: gated by `ALLOW_SIMULATED_GPS=true` env var (dev only)
- **Tile cache LRU**: 500 tiles max in service worker
- **JWT blacklist**: token `jti` stored in DB on logout, checked on every request
- **Offline queue**: failed check-ins go to IndexedDB, replayed via Background Sync

---

*Last updated: July 2025 — full codebase at ~/Desktop/TTT*
