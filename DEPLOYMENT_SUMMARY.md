# TimeQuest Deployment Summary

**Last updated:** 2026-07-24
**Status:** ✅ Live and working end-to-end on a real phone-testable URL.

---

## Live URLs

| What | URL |
|---|---|
| Frontend (the app) | https://ttt-scavenger-hunt-v3.pages.dev |
| Backend API | https://173-230-128-241.nip.io |
| Admin panel | https://ttt-scavenger-hunt-v3.pages.dev/admin/login |

## Credentials

| What | Value |
|---|---|
| Admin login | `kemperdesignservices@gmail.com` / `4173` (weak on purpose — private test box, change before any public launch) |
| Linode SSH | `ssh root@173.230.128.241` (key-based, `~/.ssh/id_ed25519` on this Windows machine) |
| Linode root password | Known only to the user, never stored here |

## Accounts & Dashboards

| Service | URL | Project/Account Name | What it's for |
|---|---|---|---|
| GitHub | https://github.com/kemperdesign/ttt-scavenger-hunt-v3 | `kemperdesign/ttt-scavenger-hunt-v3` (public repo) | Source code; pushing to `main` auto-deploys the frontend |
| Cloudflare Pages | https://dash.cloudflare.com → Compute → Workers & Pages | Account `KemperDesignServices`, project `ttt-scavenger-hunt-v3` | Hosts the frontend (free tier) |
| Linode | https://cloud.linode.com/linodes | Linode `timequest-backend` (ID 101216468) | Hosts the backend: FastAPI, Postgres, Qdrant, MinIO, Caddy |
| Vercel | https://vercel.com/kemperdesignservices/ttt-scavenger-hunt-v3 | Same name, same team | **Abandoned** — Hobby plan's Deployment Protection blocked every URL behind a login wall with no way to disable it for free. Project still exists but is unused; safe to delete. |

---

## Architecture

```
Phone Browser (HTTPS)
    ↓
Cloudflare Pages — ttt-scavenger-hunt-v3.pages.dev
  (Next.js 14, built via @cloudflare/next-on-pages, runs on Cloudflare Workers)
    ↓ /api/* rewrite proxy (browser-side)
    ↓ direct fetch (server-side / edge functions — see gotcha below)
Caddy (auto HTTPS via Let's Encrypt) — 173-230-128-241.nip.io
    ↓ reverse_proxy localhost:8000
FastAPI backend (Docker) — Linode 2GB VPS, 173.230.128.241
    ├── Postgres + PostGIS
    ├── Qdrant (vector search, for AI historian — not yet populated)
    ├── MinIO (photo storage)
    └── Ollama — NOT running (not enough RAM on a 2GB box; AI chat will fail until
        this is either added back with a bigger VPS, or swapped for a cloud LLM API)
```

**No domain was purchased.** The backend's hostname (`173-230-128-241.nip.io`) is free public wildcard DNS that resolves straight to the Linode IP — this was required, not optional, because Cloudflare Workers refuse to `fetch()` a bare IP address (error 1003).

---

## Key gotchas fixed this session (all documented in more depth in `deployment-playbook-notes.md` on the Desktop)

1. **Cloudflare Pages build kept failing** — needed `.npmrc` with `legacy-peer-deps=true` (Cloudflare's own toolchain has an internal dependency conflict), the `nodejs_compat` compatibility flag set on both Production *and* Preview, and `export const runtime = "edge"` on every dynamic route.

2. **Homepage showed "no adventures" even though the backend worked** — two separate bugs stacked:
   - The homepage was static/ISR (built once, at build time) and Cloudflare's build sandbox can't reach the Linode backend anyway → fixed by making it `runtime = "edge"` + `dynamic = "force-dynamic"` so it fetches fresh on every request.
   - The API client defaulted to a relative/same-origin URL (`""`) so browser calls could go through the Next.js rewrite proxy — but a relative URL can't be resolved by a server-side fetch (Server Components run inside a Worker, no "current page" to be relative to). Fixed by branching on `typeof window === "undefined"`: server-side calls hit the backend directly, browser calls stay same-origin through the proxy.

3. **`/admin/login` froze and reload-looped forever** — `AuthGuard` wrapped every `/admin/*` route including `/admin/login` itself; failing auth on an unauthenticated visit redirected back to the same guarded page, forever. Fixed by having the guard skip its own check when already on the login page.

4. **Nobody could log in at all, even with the correct password** — `passlib` (unmaintained) reads an attribute from `bcrypt` that `bcrypt>=4.1` removed, so every password hash/verify silently failed with a misleading "password too long" error. Fixed by pinning `bcrypt==4.0.1` in `requirements.txt`.

5. **`CORS_ORIGINS` in `.env`/`.env.example` must be valid JSON** (`["https://..."]`), not a bare comma-separated string — `pydantic-settings` parses `List[str]` env vars as JSON before your own validators ever run.

---

## Known gaps (not fixed — be aware before relying on these features)

- **Legacy `/api/v1/characters/chat` endpoint** — still targets Ollama (not running, 2GB VPS can't support it) and will error. This is separate from the newer, working AI conversation challenge chat (`/challenges/{id}/chat`, OpenAI-backed) — the legacy one isn't wired into any page currently, so it's dormant rather than actively broken.
- **Leaderboard page** — backend doesn't return a per-row user ID, so its React list key is always undefined (cosmetic warning, not a crash)
- **Photo submission points** — backend scores photos on admin review, not at upload time, so the upload UI always shows 0 points immediately (accurate; the review workflow itself isn't built in the UI yet)
- **No real domain, no MapTiler key configured in production** (map shows placeholder), no Stripe/email/error-monitoring setup — all fine for private testing, all needed before any public launch
- **Stop editor image/audio fields** — plain URL text inputs, no upload widget (in progress)

## Fixed since last update (2026-07-25)

- Challenge admin CRUD (list/create/update/delete) + per-type config editor for all 8 challenge types
- Team leaderboard (`?type=team` alongside existing player ranking)
- Full branching-story logic (admin graph editor + player navigation + backend completion validation)
- AI conversation challenge chat, now OpenAI-backed (`gpt-4o-mini`) since Ollama can't run on this VPS
- **Critical bug**: `AsyncSession.delete()` called without `await` silently no-opped across challenge/stop/adventure/account delete endpoints — returned 200 OK but never deleted the row. Fixed in all four.

---

## Next steps

1. Test the full player flow on a real phone: homepage → pick adventure → GPS check-in → hint → photo upload
2. Decide on Ollama-with-bigger-VPS vs. cloud LLM API before enabling the AI Historian feature for real
3. Buy a domain and point it at both the Cloudflare Pages site and the Caddy-fronted backend when ready to go beyond private testing
4. Consider deleting the unused Vercel project to avoid confusion later
