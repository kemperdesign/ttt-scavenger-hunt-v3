import React from "react";
import Link from "next/link";

export const runtime = "edge";

export default function RestroomsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-6 pt-10 pb-6">
        <Link
          href="/"
          className="text-amber-400 text-sm inline-flex items-center gap-1 mb-6 hover:text-amber-300 focus-visible:outline-amber-500"
        >
          ← Back
        </Link>
        <div className="text-4xl mb-3" aria-hidden="true">🚻</div>
        <h1 className="text-2xl font-bold">Public Restrooms</h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          Public facilities in the historic district. Most are free to use.
        </p>
      </header>

      <main className="px-4 pb-12 space-y-3">
        {[
          {
            name: "Visitors Information Center",
            address: "10 W. Castillo Drive",
            note: "Large, clean, free public restrooms. Near the Castillo and bayfront parking garage. Open daily.",
            accessible: true,
            emoji: "🏛️",
          },
          {
            name: "Plaza de la Constitución",
            address: "King Street & Cathedral Place",
            note: "Public restrooms on the south side of the central plaza, near the Cathedral Basilica. Open during daylight hours.",
            accessible: true,
            emoji: "⛪",
          },
          {
            name: "St. George Street (North End)",
            address: "Near the Old City Gate, St. George Street",
            note: "City-maintained facilities near the north entrance to the pedestrian zone.",
            accessible: false,
            emoji: "🚪",
          },
          {
            name: "Bayfront Gazebo Area",
            address: "Avenida Menendez & Cathedral Place",
            note: "Small facility near the waterfront seating area. Convenient during bayfront walks.",
            accessible: true,
            emoji: "🌊",
          },
          {
            name: "Anastasia State Park",
            address: "300 Anastasia Blvd (SR A1A)",
            note: "Full facilities inside the park near the beach entrance. Requires park admission.",
            accessible: true,
            emoji: "🌿",
          },
          {
            name: "St. Augustine Beach Access",
            address: "A1A South at the beach crossovers",
            note: "Restrooms at the main beach access points along Anastasia Island.",
            accessible: true,
            emoji: "🏖️",
          },
        ].map((r) => (
          <div
            key={r.name}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">{r.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-white text-sm">{r.name}</p>
                  {r.accessible && (
                    <span className="text-xs text-slate-400 shrink-0" aria-label="Accessible">
                      ♿
                    </span>
                  )}
                </div>
                <p className="text-amber-300 text-xs mt-0.5">{r.address}</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">{r.note}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mt-4">
          <p className="text-slate-400 text-xs leading-relaxed">
            <span className="text-slate-300 font-medium">Tip:</span> Many restaurants and hotels along St. George Street allow non-guests to use their restrooms. The Casa Monica Hotel lobby is a reliable option. Always ask at the host stand first.
          </p>
        </div>
      </main>
    </div>
  );
}
