# St. Augustine TimeQuest

A mobile-first, location-based historical adventure PWA for tourists in St. Augustine, FL.
Players visit real GPS locations, complete challenges, converse with AI historical characters,
and earn badges — all working offline via a service worker.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, TypeScript, Tailwind CSS, MapLibre GL |
| Backend | FastAPI (Python 3.11), asyncpg, SQLAlchemy async, Alembic |
| Database | PostgreSQL 15 + PostGIS 3.3 |
| Vector search | Qdrant v1.7.4 + nomic-embed-text embeddings (768-dim) |
| Local LLM | Ollama (llama3.2 + nomic-embed-text) |
| Object storage | MinIO (S3-compatible) |
| Auth | JWT (access 15min / refresh 7 days), bcrypt, token blacklist |
| PWA | Service worker, IndexedDB, Background Sync, Web App Manifest |

---

## Project Structure

```
TTT/
├── docker-compose.yml          # 6-service stack
├── Dockerfile.backend
├── Dockerfile.frontend
├── requirements.txt
├── alembic.ini
├── .env.example                # Copy to .env
├── alembic/
│   ├── env.py
│   └── versions/               # Auto-generated on first run
├── app/
│   ├── main.py                 # FastAPI app factory
│   ├── core/config.py          # Settings (pydantic-settings)
│   ├── db/                     # SQLAlchemy engine + session
│   ├── models/                 # 10 ORM models
│   ├── auth/                   # JWT + deps
│   ├── api/                    # 12 API routers
│   ├── middleware/             # Rate limit, security headers, sanitize
│   ├── utils/                  # File validation, audit logging
│   └── ai/                     # RAG pipeline, Ollama, characters, ingest
├── scripts/
│   ├── init-db.sql             # PostGIS + extensions
│   ├── start-dev.sh            # Full dev startup (run this)
│   ├── reset-dev.sh            # Wipe everything and start fresh
│   ├── seed_adventures.py      # Seeds 1 adventure, 5 stops, 3 badges
│   ├── seed_sources.py         # Creates stub historical text files
│   └── ingest_sources.py       # Ingests sources into Qdrant
└── frontend/
    ├── package.json
    ├── next.config.js
    ├── public/
    │   ├── sw.js               # Service worker (offline + tile cache)
    │   └── manifest.json       # PWA manifest
    └── src/
        ├── lib/api.ts          # Typed API client
        ├── context/            # AccessibilityContext
        ├── hooks/              # GPS, time-of-day, offline sync, IndexedDB
        ├── styles/             # globals, accessibility, map-themes CSS
        ├── components/
        │   ├── map/            # AdventureMap (MapLibre GL)
        │   ├── player/         # DistanceIndicator, HintButton, BadgeEarned,
        │   │                   # BadgeTray, TimeOfDayBanner, AccessibilityPanel,
        │   │                   # AppFooter, PhotoChallengeCapture,
        │   │                   # AIChatChallenge, BranchingStoryChallenge
        │   ├── debug/          # SimulatedGPS (dev only)
        │   └── admin/          # AdminLayout, AuthGuard
        └── app/
            ├── page.tsx                    # Home — adventure list
            ├── layout.tsx                  # Root layout + SW registration
            ├── offline/page.tsx
            ├── privacy/page.tsx
            ├── terms/page.tsx
            ├── adventure/[id]/
            │   ├── start/page.tsx          # Main player page
            │   ├── complete/page.tsx
            │   └── leaderboard/page.tsx
            └── admin/
                ├── login/page.tsx
                ├── page.tsx               # Dashboard
                ├── adventures/
                │   ├── page.tsx           # Adventure list
                │   └── [id]/
                │       ├── page.tsx       # Edit adventure
                │       └── stops/[stopId]/page.tsx  # Edit stop + challenges
                ├── submissions/page.tsx
                ├── characters/page.tsx
                └── analytics/page.tsx
```

---

## Quick Start

### Prerequisites
- Docker Desktop (running)
- Node.js 20+ (for local frontend dev, optional if using Docker)
- A MapTiler API key (free at maptiler.com) — optional, map shows placeholder without it

### First run

```bash
cd ~/Desktop/TTT
chmod +x scripts/start-dev.sh scripts/reset-dev.sh
./scripts/start-dev.sh
```

This automatically:
1. Creates `.env` from `.env.example`
2. Starts all 6 Docker services
3. Generates and runs the initial Alembic migration
4. Pulls Ollama models (llama3.2 + nomic-embed-text — takes a few minutes first time)
5. Seeds the sample adventure data

### Add MapTiler key (optional)

```bash
echo 'NEXT_PUBLIC_MAPTILER_KEY=your_key_here' >> frontend/.env.local
# Then restart the frontend container:
docker compose restart frontend
```

### URLs

| Service | URL |
|---|---|
| Player app | http://localhost:3000 |
| Admin portal | http://localhost:3000/admin |
| API (Swagger) | http://localhost:8000/docs |
| MinIO console | http://localhost:9001 |

MinIO credentials: `timequest` / `timequest_dev_secret`

### Stop / Reset

```bash
docker compose down          # Stop, keep data
./scripts/reset-dev.sh       # Wipe everything (volumes too)
```

---

## AI Characters

Seven historical characters with RAG-backed conversation:

| ID | Character | Era |
|---|---|---|
| `spanish_colonial_guide` | Doña Isabella Reyes | 1750 |
| `pedro_menendez` | Pedro Menéndez de Avilés | 1565 |
| `henry_flagler` | Henry Flagler | Gilded Age |
| `pirate_captain` | Captain Rodrigo Vargas | 1710 |
| `victorian_tourist` | Mrs. Eleanor Whitmore | 1895 |
| `colonial_shopkeeper` | Thomas Dunbar | 1775 |
| `civil_rights_guide` | James Holloway | 1964 |

---

## Challenge Types

`gps_checkin` · `multiple_choice` · `text_answer` · `photo_submission` ·
`ai_conversation` · `sequence_puzzle` · `qr_code` · `branching_story`

---

## Environment Variables

See `.env.example` for the full list. Key ones:

```env
DATABASE_URL=postgresql+asyncpg://timequest:timequest_dev@localhost:5432/timequest
SECRET_KEY=change-me-in-production
QDRANT_HOST=localhost
MINIO_ENDPOINT=localhost:9000
OLLAMA_BASE_URL=http://localhost:11434
ALLOW_SIMULATED_GPS=true   # set false in production
```

Frontend (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPTILER_KEY=your_key_here
NEXT_PUBLIC_ENABLE_DEBUG_TOOLS=true
```

---

## Ingest Historical Sources

After adding real content to `data/sources/` (stub files created by `seed_sources.py`):

```bash
docker compose exec backend python scripts/ingest_sources.py
# Or for a single topic:
docker compose exec backend python scripts/ingest_sources.py --topic castillo
```

---

## Accessibility

WCAG 2.1 AA compliant. Features:
- Adjustable font size (normal / large / x-large)
- High contrast mode
- Reduce motion mode (respects `prefers-reduced-motion`)
- Skip navigation link
- 44px minimum touch targets
- Full keyboard navigation
- ARIA live regions for GPS updates and badge awards
- Focus traps in dialogs

---

## Security

- JWT with short-lived access tokens (15 min) + refresh tokens (7 days)
- Token blacklist table for logout
- slowapi rate limiting (200 req/min default)
- Magic-byte file validation + EXIF stripping on photo uploads
- Prompt injection guard on AI chat
- CSP, HSTS, X-Frame-Options, Referrer-Policy headers
- Server-side haversine GPS validation (simulated GPS gated by env var)
- Audit log table for all sensitive actions

---

*Built with Claude · St. Augustine TimeQuest · 2025*
