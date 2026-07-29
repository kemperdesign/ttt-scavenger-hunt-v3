/**
 * Client-side error monitoring.
 *
 * Uses the browser's native error/unhandledrejection events to forward
 * errors to Sentry's HTTP API without requiring the @sentry/nextjs package.
 * This keeps the bundle zero-dep while still capturing production crashes.
 *
 * To enable: set NEXT_PUBLIC_SENTRY_DSN in .env.local / Cloudflare Pages env.
 * When the DSN is absent, this is a silent no-op.
 */

function parseDsn(dsn: string): { endpoint: string; publicKey: string } | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace("/", "");
    const host = url.hostname;
    return {
      endpoint: `https://${host}/api/${projectId}/envelope/`,
      publicKey,
    };
  } catch {
    return null;
  }
}

function sendEnvelope(endpoint: string, publicKey: string, event: object): void {
  const sentryVersion = "7";
  const header = JSON.stringify({ dsn: endpoint, sdk: { name: "sentry.javascript.browser", version: "7.0.0" } });
  const itemHeader = JSON.stringify({ type: "event" });
  const itemPayload = JSON.stringify({ ...event, level: "error" });
  const envelope = `${header}\n${itemHeader}\n${itemPayload}`;

  if (navigator.sendBeacon) {
    const blob = new Blob([envelope], { type: "application/x-sentry-envelope" });
    navigator.sendBeacon(endpoint, blob);
  } else {
    fetch(endpoint, {
      method: "POST",
      body: envelope,
      headers: { "Content-Type": "application/x-sentry-envelope", "X-Sentry-Auth": `Sentry sentry_version=${sentryVersion},sentry_key=${publicKey}` },
      keepalive: true,
    }).catch(() => {});
  }
}

export function initMonitoring(): void {
  if (typeof window === "undefined") return;
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  const parsed = parseDsn(dsn);
  if (!parsed) return;

  const { endpoint, publicKey } = parsed;

  const send = (message: string, stack?: string) => {
    sendEnvelope(endpoint, publicKey, {
      message,
      exception: stack ? { values: [{ type: "Error", value: message, stacktrace: { frames: [{ filename: stack }] } }] } : undefined,
      request: { url: window.location.href },
      timestamp: Date.now() / 1000,
    });
  };

  window.addEventListener("error", (e) => {
    send(e.message, e.filename ? `${e.filename}:${e.lineno}:${e.colno}` : undefined);
  });

  window.addEventListener("unhandledrejection", (e) => {
    const msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
    send(`Unhandled Promise rejection: ${msg}`);
  });
}
