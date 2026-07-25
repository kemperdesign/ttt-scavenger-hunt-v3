# Deployment Playbook — Lessons Learned (Next.js + FastAPI + Cloudflare Pages + Linode)

Reusable notes distilled from deploying TimeQuest. Read this before starting the next project's deployment — most of this will save you a full round of trial-and-error.

---

## 1. Cloudflare Pages + Next.js — exact working config

**Project settings (dashboard → Settings → Build):**
```
Framework preset:      Next.js
Build command:         npx @cloudflare/next-on-pages@1
Build output directory: .vercel/output/static
Root directory:        <your frontend folder, e.g. "frontend">
```

**Required file: `<frontend>/.npmrc`**
```
legacy-peer-deps=true
```
Without this, the build fails immediately with an ERESOLVE error — `@cloudflare/next-on-pages` and the `wrangler` version it pulls in have conflicting peer-dependency ranges for `@cloudflare/workers-types`. This is a bug in Cloudflare's own toolchain, not your dependencies. `.npmrc` with `legacy-peer-deps=true` is the fix; nothing else needs to change.

**Required: `nodejs_compat` compatibility flag**
Dashboard → Settings → Runtime → Compatibility flags → add `nodejs_compat` to **both** Production and Preview environments (they're configured separately — easy to do one and forget the other). Without this, every page 404s/500s at runtime with "Error - no nodejs_compat compatibility flag", even though the build succeeds.

**Required: `export const runtime = "edge";` on every dynamic route**
`@cloudflare/next-on-pages` refuses to build if any non-static (server-rendered) route is missing this export. The build error tells you exactly which routes are missing it — add it to each. Safe to add to both Server Components and `"use client"` pages (route segment config exports work in either).

**Remove `output: "standalone"` from `next.config.js`**
That option is for self-hosting Next.js as a Node server (e.g., in a Docker container you run yourself). It's incompatible with Cloudflare's edge adapter, which expects the default build output.

**GitHub webhook auto-deploy can silently stop firing**
If pushes stop triggering new builds (and the Deployments tab only ever rebuilds an old commit when you click "Retry"), don't waste time debugging your git history — just disconnect and reconnect the Git integration (Settings → Build → Git repository → Disconnect, then reconnect via the same "Connect to Git" flow, same settings). This re-registers the webhook and reliably fixes it. Confirmed working; no idea why it breaks in the first place.

**"Create deployment" / manual trigger button doesn't exist**
There's no button in the UI to force a build against latest `main` outside of the automatic webhook. If the webhook is broken, reconnecting Git (above) is the only lever — pushing more commits won't help until you do that.

---

## 2. Cloudflare Workers/Pages networking limits (this bit us hard)

**Workers `fetch()` cannot connect to a bare IP address.**
If your Next.js app does server-side rendering that calls out to a backend (e.g., a `rewrites()` proxy, or a Server Component doing `fetch()` at request time), the destination **must be a real hostname**, not `http://1.2.3.4:8000`. Bare-IP fetches fail with Cloudflare error 1003, even though the exact same URL works fine from a browser or from `curl`.

**Free fix if you don't own a domain yet: nip.io**
`nip.io` (and similar services like `sslip.io`) provide public wildcard DNS that resolves `<ip-with-dashes>.nip.io` straight to that IP — no domain purchase, no account, no config. Example: `173-230-128-241.nip.io` → `173.230.128.241`. This gives you a real hostname instantly.

**Put real HTTPS on that hostname with Caddy**
Caddy auto-provisions Let's Encrypt certificates for any publicly-resolvable hostname pointed at the box it's running on — including nip.io hostnames. Minimal `Caddyfile`:
```
your-host.nip.io {
    reverse_proxy localhost:8000
}
```
Then `systemctl enable caddy && systemctl restart caddy`. Cert issuance takes ~10–15 seconds. This solves both problems at once: real hostname + real HTTPS + standard port 443, all free.

**Relative URLs (`""` / same-origin) don't work in server-side fetches**
If your API client defaults to `fetch("" + path)` so browser requests go through same-origin/proxy routing (to dodge CORS or mixed-content), that default **breaks any server-side fetch** — Server Components and edge functions have no "current page" to resolve a relative URL against, and the fetch throws (often silently swallowed by a `try/catch` that returns `[]` or similar, making it look like "no data" rather than an obvious error).

**Fix pattern** — branch on `typeof window === "undefined"`:
```ts
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window === "undefined"
    ? process.env.BACKEND_ORIGIN || "https://your-backend-host.nip.io"
    : ""); // browser: same-origin, goes through the rewrite proxy
```
Server-side calls go straight to the backend (server-to-server, no CORS/mixed-content issue anyway). Browser calls stay same-origin through the proxy.

**Static/ISR pages snapshot data at BUILD TIME, and the Cloudflare build sandbox may not have egress to your backend**
A page without `export const runtime = "edge"` gets prerendered once, at build time, in Cloudflare's build environment — which may not be able to reach your backend at all. If your data-fetching function swallows errors (`catch { return [] }`), the page will permanently show empty/fallback content even though the backend is fine, and it won't change until you notice and add edge runtime to that page. Any page whose content should reflect live backend state needs `export const runtime = "edge"` (and usually `export const dynamic = "force-dynamic"` if you also had `revalidate` set for ISR).

---

## 3. Linode / self-hosted Docker backend

**1GB RAM plan is too small for Postgres + backend + MinIO + Qdrant + Ollama together.** Resize to 2GB minimum if you want any local LLM inference; Ollama alone wants ~2GB. Resizing is done from the dashboard, takes 5–15 minutes (reboot), and is non-destructive — Docker, volumes, and code all survive it.

**Add swap on small VPS instances** — cheap insurance against OOM kills:
```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo "/swapfile none swap sw 0 0" >> /etc/fstab
```

**docker-compose CORS_ORIGINS as JSON in `.env`**
If your backend parses `CORS_ORIGINS` as a JSON array via pydantic-settings, the `.env` value must be actual JSON syntax:
```
CORS_ORIGINS=["https://your-frontend.pages.dev","https://your-frontend.vercel.app"]
```
A bare comma-separated string will crash the app on startup with a `SettingsError` — pydantic-settings' JSON-array parsing doesn't fall back gracefully.

**Hotpatching a running container's files does NOT survive `docker compose up -d` on that service**
If you `docker cp` a fixed file into a running container to hotfix something without rebuilding the image, that fix is **lost the next time the container is recreated** from the same image (e.g., after any unrelated `docker compose up -d --build` or just recreating for an env var change) — Docker rebuilds from the image layer, not the patched container filesystem. Always rebuild the image (`docker compose up -d --build <service>`) for a real fix, not just `docker cp`.

**MinIO healthcheck: use `mc ready local`, not `curl .../minio/health/live`**
Older MinIO images don't ship `curl` inside the container, so a `curl`-based Docker healthcheck against `/minio/health/live` will report unhealthy forever (exec error, not an actual health failure). Use:
```yaml
healthcheck:
  test: ["CMD", "mc", "ready", "local"]
```

---

## 4. Python/FastAPI gotchas that cost real time

**`passlib` + `bcrypt>=4.1` is broken — pin `bcrypt==4.0.1`**
`passlib` (unmaintained since ~2020) reads `bcrypt.__about__.__version__` for backend detection. `bcrypt` 4.1+ removed that attribute. Every single password hash/verify call fails with a bizarre, misleading error: `password cannot be longer than 72 bytes` — which has nothing to do with your actual password. If you use `passlib[bcrypt]`, add `bcrypt==4.0.1` explicitly to `requirements.txt` right after it, or every login/register call is silently broken in production. This is worth checking for on day one of any new project that uses `passlib`.

**SQLAlchemy circular imports with a shared `Base`**
If your models file (`app/db/base.py`) imports all model modules to register them on `Base.metadata`, any standalone script (seed scripts, one-off admin scripts) that imports a model directly (`from app.models.user import User`) *before* importing `app.db.base` will hit a circular-import `ImportError`. Fix: always import `app.db.base` first, then the specific model:
```python
from app.db.base import Base   # must come first
from app.models.user import User
```

**Ambiguous SQLAlchemy relationships need explicit `foreign_keys`**
If a table has more than one foreign key pointing at the same parent table (e.g., `PhotoSubmission.user_id` and `PhotoSubmission.reviewed_by_id` both referencing `users.id`), any `relationship()` on the parent side referencing that child table will fail at first use with `AmbiguousForeignKeysError` unless you specify `foreign_keys=` explicitly:
```python
submissions: Mapped[list["PhotoSubmission"]] = relationship(
    "PhotoSubmission", back_populates="user", foreign_keys="PhotoSubmission.user_id"
)
```

**`email-validator` is a separate package pydantic needs for `EmailStr`**
If any Pydantic model uses `EmailStr`, add `email-validator` to `requirements.txt` explicitly — it's not pulled in automatically and the app crashes on import with `ImportError: email-validator is not installed`.

---

## 5. Next.js / React specifics

**A shared layout AuthGuard must not guard its own login page**
If `app/admin/layout.tsx` wraps every child (including `/admin/login`) in an auth-checking component, an unauthenticated visit to `/admin/login` fails the check, redirects to `/admin/login`, which re-runs the same guard, fails again — infinite loop. The guard must explicitly skip the check when `usePathname()` already equals the login route.

**A separate global 401-handler can cause a second version of the same loop**
If your API client's shared request wrapper does a hard `window.location.href = "/login"` on any 401 response (independent of the page-level auth guard), it can trigger repeatedly for its own reasons — check that this only fires once / doesn't re-trigger from the destination page itself.

**Dynamic `import("*.css")` needs an ambient module declaration for TypeScript**
```ts
// global.d.ts (anywhere matched by tsconfig's "include", e.g. src/global.d.ts)
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
```
Needed when a library's CSS is code-split via `await import("some-lib/dist/style.css")` (common for map libraries like maplibre-gl) — Next.js/webpack handles it fine at runtime, but `tsc` has no idea what a bare `.css` import resolves to and fails the build otherwise.

**Missing `"use client"` on a page with an event handler fails static export, not just at dev-time**
A page with `onClick`/`onChange` etc. but no `"use client"` directive builds fine locally in dev mode (Next.js is forgiving), but fails hard during a production static export with `Error: Event handlers cannot be passed to Client Component props` — and can hang the whole build for up to a minute before timing out. Cheap to grep for this class of bug before deploying: any page file with an inline handler needs the directive.

---

## 6. General workflow notes

- **When a build finally succeeds after N failed type-only errors, do a full manual audit of every consumer of your shared API client** rather than fixing errors one at a time as the compiler surfaces them — TypeScript only tells you about the *first* file it reaches with a mismatch per compile; there can be many more waiting, and the fix-one-push-wait-repeat cycle is much slower than reading the actual call sites once.
- **`grep`-testing minified production JS for a source-level variable name proves nothing** — minifiers rename local variables. To confirm a fix actually deployed, check the deployment dashboard/commit hash directly, not the bundled JS content.
- **A stale service worker or PWA cache on a test device can perfectly mimic a "the fix didn't work" bug** that isn't actually there. If a fix looks logically airtight on code review but the user says it's still broken, ask them to fully close/reopen the browser tab or app (not just refresh) before spending more time hunting for a phantom second bug.
