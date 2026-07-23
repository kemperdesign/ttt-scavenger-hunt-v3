import React from "react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-12 max-w-2xl mx-auto">
      <Link href="/" className="text-amber-400 text-sm hover:underline mb-8 inline-block">
        ← Back
      </Link>
      <h1 className="text-white font-bold text-3xl mb-8">Privacy Policy</h1>
      <div className="prose prose-invert prose-sm space-y-6 text-slate-300">
        <p className="text-slate-400 text-sm">Last updated: {new Date().getFullYear()}</p>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">Information We Collect</h2>
          <p>
            St. Augustine TimeQuest collects the following information when you use our app:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Account information: email address and username</li>
            <li>Location data: GPS coordinates used only during active gameplay to verify your proximity to historical stops. We do not store your location history.</li>
            <li>Gameplay data: stops visited, challenges completed, points earned, and badges awarded</li>
            <li>Photos you submit for photo challenges</li>
            <li>AI chat messages with historical characters (not stored permanently)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and improve the TimeQuest experience</li>
            <li>To validate GPS check-ins at historical stops</li>
            <li>To display leaderboards and track your adventure progress</li>
            <li>To review photo submissions for challenge completion</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">Location Data</h2>
          <p>
            Location access is required to play TimeQuest. Your precise GPS coordinates are sent
            to our servers only at the moment you check in at a stop. We use them to verify
            proximity (within {process.env.NEXT_PUBLIC_GPS_RADIUS ?? "30"} meters of the stop)
            and do not retain them after verification.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">Data Retention & Deletion</h2>
          <p>
            You may export all your data or permanently delete your account at any time from
            your account settings. Deleting your account removes all associated data including
            gameplay history, badges, and submitted photos within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">Third-Party Services</h2>
          <p>
            We use MapTiler for map tiles. Map tile requests are subject to MapTiler's own
            privacy policy. No personal data is shared with map providers.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">Contact</h2>
          <p>
            Questions about this policy? Contact us at privacy@timequest.app
          </p>
        </section>
      </div>
    </div>
  );
}
