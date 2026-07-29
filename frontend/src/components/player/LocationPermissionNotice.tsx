"use client";

interface Props {
  onGrant: () => void;
  adventureTitle: string;
}

export function LocationPermissionNotice({ onGrant, adventureTitle }: Props) {
  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-notice-heading"
    >
      <div className="max-w-sm w-full space-y-6 text-center">
        <div className="text-6xl" aria-hidden="true">📍</div>

        <div className="space-y-2">
          <h1
            id="location-notice-heading"
            className="text-white text-2xl font-bold"
          >
            Location Access Needed
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            <strong className="text-slate-200">{adventureTitle}</strong> uses
            your GPS location to unlock stops as you walk to them.
          </p>
        </div>

        <ul className="text-left space-y-3 bg-slate-900/60 rounded-xl p-4 text-sm text-slate-300">
          <li className="flex items-start gap-3">
            <span aria-hidden="true" className="shrink-0 mt-0.5">✅</span>
            <span>Your location is used <strong>only</strong> to check whether you&apos;re near each stop — it is never stored continuously or shared.</span>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden="true" className="shrink-0 mt-0.5">✅</span>
            <span>We record only the check-in result (yes/no) and the time — not your movement path.</span>
          </li>
          <li className="flex items-start gap-3">
            <span aria-hidden="true" className="shrink-0 mt-0.5">✅</span>
            <span>You can revoke access in your browser settings at any time.</span>
          </li>
        </ul>

        <div className="space-y-3">
          <button
            onClick={onGrant}
            className="w-full bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-semibold py-4 rounded-xl text-base min-h-[56px] transition-colors"
          >
            Allow Location & Start Adventure
          </button>
          <p className="text-slate-500 text-xs">
            Your browser will show its own permission prompt next.
          </p>
        </div>
      </div>
    </div>
  );
}
