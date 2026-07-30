import React from "react";
import Link from "next/link";

export const runtime = "edge";

export default function ParkingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-6 pt-10 pb-6">
        <Link
          href="/"
          className="text-amber-400 text-sm inline-flex items-center gap-1 mb-6 hover:text-amber-300 focus-visible:outline-amber-500"
        >
          ← Back
        </Link>
        <div className="text-4xl mb-3" aria-hidden="true">🅿️</div>
        <h1 className="text-2xl font-bold">Parking & Shuttles</h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          St. Augustine's historic district is best explored on foot. Park once and walk — or hop the trolley.
        </p>
      </header>

      <main className="px-4 pb-12 space-y-6">

        {/* Garages */}
        <section>
          <h2 className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Parking Garages
          </h2>
          <ul className="space-y-3">
            {[
              {
                name: "Visitors Information Center Garage",
                address: "10 W. Castillo Drive",
                note: "Closest to the Castillo de San Marcos and the bayfront. City-operated, paid.",
                emoji: "🏛️",
              },
              {
                name: "St. Augustine Parking Facility (Lightner Garage)",
                address: "50 Riberia Street",
                note: "Near the Lightner Museum and Flagler College. Convenient for the historic core.",
                emoji: "🏰",
              },
              {
                name: "Lincolnville Garage",
                address: "20 Cuna Street",
                note: "South end of the historic district. Good for Lincolnville and St. George Street access.",
                emoji: "🚗",
              },
            ].map((g) => (
              <li
                key={g.name}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">{g.emoji}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{g.name}</p>
                    <p className="text-amber-300 text-xs mt-0.5">{g.address}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{g.note}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Lots */}
        <section>
          <h2 className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Surface Lots
          </h2>
          <ul className="space-y-3">
            {[
              {
                name: "Anastasia State Park Lot",
                address: "300 Anastasia Blvd (SR A1A)",
                note: "Across the Bridge of Lions. Free with park admission. Walking distance to downtown via the bridge.",
                emoji: "🌿",
              },
              {
                name: "San Marco Avenue Lots",
                address: "San Marco Ave north of the city gate",
                note: "Several metered lots on the north end near the Fountain of Youth. Walk south into the historic district.",
                emoji: "🅿️",
              },
            ].map((l) => (
              <li
                key={l.name}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">{l.emoji}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{l.name}</p>
                    <p className="text-amber-300 text-xs mt-0.5">{l.address}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{l.note}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Shuttles */}
        <section>
          <h2 className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
            Shuttles & Trolleys
          </h2>
          <ul className="space-y-3">
            {[
              {
                name: "Old Town Trolley Tours",
                address: "Departs: 167 San Marco Ave",
                note: "Hop-on hop-off service with 22 stops covering the full historic district. Tickets required. Runs daily.",
                emoji: "🚃",
              },
              {
                name: "St. Augustine Sightseeing Trains",
                address: "170 San Marco Ave",
                note: "Narrated train tour with multiple boarding locations throughout the historic area.",
                emoji: "🚂",
              },
              {
                name: "Ancient City Explorer Shuttle",
                address: "Departs from Visitors Information Center",
                note: "Free city shuttle running between the parking garage and key downtown stops. Check current schedule at the Visitors Center.",
                emoji: "🚌",
              },
            ].map((s) => (
              <li
                key={s.name}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">{s.emoji}</span>
                  <div>
                    <p className="font-semibold text-white text-sm">{s.name}</p>
                    <p className="text-amber-300 text-xs mt-0.5">{s.address}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">{s.note}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Tips */}
        <section className="bg-amber-900/20 border border-amber-800/40 rounded-xl p-4">
          <h2 className="text-amber-400 text-sm font-semibold mb-2">💡 Tips</h2>
          <ul className="space-y-1.5 text-slate-300 text-sm">
            <li>• St. George Street is pedestrian-only — no vehicles.</li>
            <li>• Arrive before 10 AM to find garage spots on busy weekends.</li>
            <li>• The Bridge of Lions is a beautiful 15-minute walk into the historic district from the island side.</li>
            <li>• Parking meters enforce strictly — use the ParkMobile app for convenience.</li>
          </ul>
        </section>

      </main>
    </div>
  );
}
