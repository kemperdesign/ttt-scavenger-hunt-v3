# TimeQuest Deployment Session Summary

**Date:** 2026-07-24
**Goal:** Deploy the St. Augustine TimeQuest PWA (Next.js frontend + FastAPI backend) somewhere testable on a real smartphone.

---

## Where things stand right now

| Piece | Status |
|---|---|
| **Backend** (FastAPI + Postgres + Qdrant + MinIO) | ✅ Running on a Linode VPS, healthy, seeded with 1 adventure / 5 stops |
| **Frontend** (Next.js) | ✅ Builds successfully on Vercel, but **not reachable** — blocked by Vercel Deployment Protection (Hobby plan) |
| **Next step** | Move frontend hosting to Netlify or Cloudflare Pages, which don't gate free-tier production URLs behind a login wall |

---

## Accounts & Access — Everything Needed To Work On This Project

**Accounts & Dashboards**

| Service | URL | Project/Account Name | What it's for |
|---|---|---|---|
| GitHub | https://github.com/kemperdesign/ttt-scavenger-hunt-v3 | `kemperdesign/ttt-scavenger-hunt-v3` (public repo) | Source code, triggers both deploys |
| Cloudflare Pages | https://dash.cloudflare.com → Compute → Workers & Pages | Account: `KemperDesignServices`, Project: `ttt-scavenger-hunt-v3` | Hosts the frontend, live site |
| Linode | https://cloud.linode.com/linodes | Linode: `timequest-backend` (ID 101216468) | Hosts the backend (FastAPI, Postgres, Qdrant, MinIO) |
| Vercel | https://vercel.com/kemperdesignservices/ttt-scavenger-hunt-v3 | Same name, same team | Abandoned — Deployment Protection blocked it on Hobby plan. Still exists but unused; safe to ignore or delete |

**Live URLs (the actual product)**

| What | URL |
|---|---|
| Frontend (the app) | https://ttt-scavenger-hunt-v3.pages.dev |
| Backend API | https://173-230-128-241.nip.io |
| Admin panel | https://ttt-scavenger-hunt-v3.pages.dev/admin/login |
| Linode SSH | `ssh root@173.230.128.241` (key-based, `~/.ssh/id_ed25519` on this machine) |

**Credentials**

| What | Value |
|---|---|
| Admin login | `kemperdesignservices@gmail.com` / `4173` |
| Linode root password | Only the user has this — not stored here |

**Not yet set up (needed before public launch)**
- A real domain name (currently free `.pages.dev` + `.nip.io` subdomains)
- MapTiler account (for real map tiles — currently placeholder)
- Stripe, transactional email provider, error monitoring — none configured yet

---

## Infrastructure created

### Linode VPS (backend)
- **IP:** `173.230.128.241`
- **Plan:** Nanode 1GB → resized to **Linode 2GB** ($12/mo) during this session
- **Location:** `/opt/timequest` on the box
- **SSH access:** key-based (`~/.ssh/id_ed25519` on this Windows machine, `claude-deploy` key authorized on the server)
- **Running services** (`docker-compose.prod.yml`): postgres (PostGIS), qdrant, minio + minio-init, backend (FastAPI)
- **Not running:** Ollama (needs more RAM than is worth dedicating for MVP testing — see "AI Historian" note below)
- **2GB swap file** added at `/swapfile` to prevent OOM
- Secrets (JWT key, Postgres/MinIO passwords) were randomly generated and live only in `/opt/timequest/.env` on the server — **not** in git

### GitHub
- Repo: `https://github.com/kemperdesign/ttt-scavenger-hunt-v3`
- **Now public** (changed during this session to try to work around Vercel's Deployment Protection — turned out not to be the actual fix, but public is fine since no secrets are committed)

### Vercel (frontend — being replaced)
- Project: `ttt-scavenger-hunt-v3` under the `KemperDesignServices` team (Hobby/free plan)
- Builds succeed as of the last commit, but every URL (including the production alias) is blocked by **Deployment Protection**, which on Hobby apparently can't be disabled the way we expected — this needs either a Pro plan or a different host
- **Decision:** move to Netlify or Cloudflare Pages instead of paying $20/mo

---

## Code changes made this session (all pushed to `main`)

The repo had **never actually been built or run end-to-end** before this session — every fix below addressed a real, distinct, pre-existing bug uncovered by finally running a real production build:

1. **`next.config.js`** — added a rewrite proxying `/api/*` to the Linode backend, so the HTTPS frontend doesn't get blocked calling an HTTP backend (mixed-content) and so CORS is moot (same-origin from the browser's perspective)
2. **`frontend/src/lib/api.ts`** — this was the big one. The file had a whole parallel, fictional set of types/functions that never matched the real FastAPI backend:
   - `Stop`, `Challenge`, `Adventure`, `Badge`, `AiCharacter`, `PhotoSubmission`, `LeaderboardEntry` all had invented field names (e.g. `latitude`/`longitude` instead of `lat`/`lng`, `price`/`status`/`stop_count` instead of `is_published`/`total_points`, etc.)
   - Function signatures didn't match their real call sites (`gpsCheckin`, `checkBadges`, `chatWithCharacter`, `useHint`, `listSubmissions`, `rejectSubmission`, `getLeaderboard`, `createChallenge`)
   - Routes were missing the backend's `/api/v1` prefix
   - Added missing exports the admin pages needed: `getStops`, `getChallenges`, `createChallenge`, `deleteChallenge`, `submitPhotoChallenge` (note: the challenge CRUD ones compile but will 404 until the backend grows list/create/delete routes for challenges — only get/submit/hint exist today)
3. **Backend fixes** (`app/models/user.py`, `requirements.txt`, `scripts/seed_adventures.py`) — missing `email-validator` dependency, a circular import in the seed script, an ambiguous SQLAlchemy relationship (PhotoSubmission has two FKs to `users`)
4. **`frontend/src/global.d.ts`** (new file) — ambient `*.css` module declaration so TypeScript doesn't choke on the dynamic `import("maplibre-gl/dist/maplibre-gl.css")`
5. **`AdventureMap.tsx`** — fixed a maplibre-gl types version mismatch (`attributionControl: true` → `attributionControl: {}`)
6. **`app/offline/page.tsx`** — added a missing `"use client"` directive (had an `onClick` handler but was being treated as a Server Component, which crashed static export)
7. Fixed Vercel's **Root Directory** project setting to `frontend` (it was building from repo root and silently no-op'ing every deploy before this)

---

## Known gaps / things NOT fixed (be aware before testing further)

- **AI Historian chat** — Ollama isn't running on the Linode box (not enough RAM to be useful at $12/mo tier); `/api/v1/characters/chat` will fail until either Ollama is added back or swapped for a cloud LLM API
- **Admin challenge management** (add/delete challenges in the stop editor) — the backend has no list/create/delete endpoints for challenges, only get/submit/hint. The admin UI will call endpoints that 404.
- **Leaderboard React key** — the backend's leaderboard endpoint doesn't return a per-row user ID, so the leaderboard page's `key={entry.user_id}` is always undefined. Cosmetic/React-warning level, not a crash.
- **Photo submission "points earned"** — the backend scores photos on admin review, not at upload time, so the upload UI currently always shows 0 points immediately (accurate — just means the number won't update until an admin approves it, which isn't wired up in the UI yet).

---

## Credentials / access notes

- Linode root password: known only to you (never shared with or stored by Claude)
- Linode SSH key: generated this session, private key sits at `~/.ssh/id_ed25519` on this Windows machine, public key authorized in the server's `~/.ssh/authorized_keys`
- A GitHub Personal Access Token was pasted into chat earlier in this session and **did not work** — you were advised to revoke it at https://github.com/settings/tokens if you haven't already, since it appeared in plaintext in the conversation

---

## Next steps (picking up from here)

1. Deploy `frontend/` to Netlify or Cloudflare Pages instead of Vercel
   - Both need: Root/base directory = `frontend`, and either an equivalent rewrite/redirect rule for `/api/*` → `http://173.230.128.241:8000/api/*`, or continue using the existing Next.js `rewrites()` in `next.config.js` (both platforms support Next.js SSR/rewrites natively)
2. Once live, re-run the full test pass: homepage loads, `/api/health` reachable, GPS check-in on a real phone (needs HTTPS — both alternatives provide this automatically), photo upload, badges
3. Longer-term: decide on Ollama vs. a cloud LLM API for the AI Historian feature before advertising it as working
