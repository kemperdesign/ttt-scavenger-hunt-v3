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
            Location access is required to play TimeQuest. Your precise GPS coordinates are
            transmitted to our servers <strong>only at the moment you tap &ldquo;Check In&rdquo;</strong> at
            a stop. We use them solely to verify proximity and do not retain them after
            verification. We do not track your movement path, log your location continuously,
            or share coordinates with any third party.
          </p>
          <p className="mt-2">
            What we <em>do</em> store: the check-in result (yes/no), the time of check-in,
            and the stop that was checked in to. Nothing else.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">Children&apos;s Privacy</h2>
          <p>
            TimeQuest is designed for general audiences and is intended to be used by families.
            We do not knowingly collect personal information from children under 13 without
            verifiable parental consent. If you believe your child has provided personal information
            without your consent, please contact us and we will delete it promptly.
          </p>
          <p className="mt-2">
            We recommend that children under 13 use TimeQuest with a parent or guardian who
            creates and manages the account.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">Data Retention &amp; Deletion</h2>
          <p>
            You may request export of all your data or permanent deletion of your account by
            contacting us. Deleting your account removes all associated data including gameplay
            history, badges, and submitted photos within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-xl mb-3">Third-Party Services</h2>
          <p>
            We use MapTiler for map tiles and OpenAI to power AI character conversations.
            Map tile requests are subject to MapTiler&apos;s privacy policy. AI chat messages
            are processed by OpenAI and subject to their usage policies; we do not store
            the contents of individual chat messages beyond the active session.
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
