import React from "react";
import Link from "next/link";

export const runtime = "edge";

const FEATURED = [
  {
    name: "Castillo de San Marcos",
    emoji: "🏰",
    tagline: "America's oldest masonry fort",
    description:
      "Built by the Spanish from 1672–1695 out of coquina — a shell-stone unique to Florida — the Castillo has never been taken by force. It's the anchor of St. Augustine's identity and a National Monument.",
    address: "1 S. Castillo Drive",
    admissionNote: "NPS fee or America the Beautiful pass",
    hours: "Open daily 9 AM – 5 PM",
    tags: ["History", "Outdoors", "Family"],
    adventureHint: "Start the 'Must-See Landmarks' adventure here.",
  },
  {
    name: "St. Augustine Lighthouse",
    emoji: "🗼",
    tagline: "Florida's oldest lighthouse, still active",
    description:
      "Built in 1874, the 165-foot lighthouse on Anastasia Island has 219 steps to the top and a first-order Fresnel lens that still guides ships. The maritime museum at the base covers centuries of coastal history.",
    address: "81 Lighthouse Ave",
    admissionNote: "Admission required",
    hours: "Open daily 9 AM – 6 PM",
    tags: ["History", "Views", "Family"],
    adventureHint: null,
  },
  {
    name: "Flagler College — Rotunda Tour",
    emoji: "🎨",
    tagline: "Louis Comfort Tiffany's largest installation",
    description:
      "The former Ponce de León Hotel (1888) is now Flagler College. The Rotunda contains 79 original Tiffany stained glass windows — the largest single collection of Tiffany glass in the world. Student-led tours daily.",
    address: "74 King Street",
    admissionNote: "Tour fee applies",
    hours: "Tours at 10 AM and 2 PM daily",
    tags: ["Art", "Architecture", "History"],
    adventureHint: "Part of the 'Styles of the Ancient City' adventure.",
  },
  {
    name: "Lightner Museum",
    emoji: "🏺",
    tagline: "Gilded Age treasures in Flagler's Alcazar Hotel",
    description:
      "Henry Flagler's 1888 Alcazar Hotel is now one of Florida's finest museums, housing Otto Lightner's collection of Victorian-era art, glass, and decorative objects. The former indoor swimming pool — once the largest in the world — is now an antique mall and café.",
    address: "75 King Street",
    admissionNote: "Admission required",
    hours: "Open daily 9 AM – 5 PM",
    tags: ["Art", "History", "Architecture"],
    adventureHint: "Part of the 'Must-See Landmarks' adventure.",
  },
  {
    name: "San Sebastian Winery",
    emoji: "🍷",
    tagline: "Florida wine with a rooftop view",
    description:
      "San Sebastian Winery makes wine from Florida muscadine grapes in a converted 1920s creosote plant. Free guided tours explain the winemaking process, and free tastings follow. The rooftop Jazz Bar has live music on weekends with views across the historic district.",
    address: "157 King Street",
    admissionNote: "Tours and tastings are free",
    hours: "Mon–Sat 10 AM – 6 PM, Sun 11 AM – 6 PM",
    tags: ["Wine", "Free Tour", "Views"],
    adventureHint: "Part of the 'Free St. Augustine' adventure.",
  },
  {
    name: "Fountain of Youth Archaeological Park",
    emoji: "⛲",
    tagline: "Where Ponce de León landed in 1513",
    description:
      "The site of the original Timucuan village where Spanish explorer Ponce de León made landfall. The park contains a natural spring, a Timucuan burial ground, a 1565-era settlement replica, a planetarium, and peacocks roaming the grounds.",
    address: "11 Magnolia Ave",
    admissionNote: "Admission required",
    hours: "Open daily 9 AM – 5 PM",
    tags: ["History", "Nature", "Family"],
    adventureHint: null,
  },
  {
    name: "Fort Matanzas National Monument",
    emoji: "⚓",
    tagline: "The Spanish outpost that guarded the southern inlet",
    description:
      "Built in 1742 on a small island 14 miles south of St. Augustine, Fort Matanzas guarded the Matanzas Inlet — the back door to the city. A free NPS ferry takes visitors to the island. The fort is one of the most intact Spanish colonial structures in North America.",
    address: "8635 A1A South, St. Augustine",
    admissionNote: "Free — NPS site",
    hours: "Ferry runs daily 9 AM – 4:30 PM (weather permitting)",
    tags: ["History", "Free", "Nature"],
    adventureHint: null,
  },
  {
    name: "St. Augustine Alligator Farm",
    emoji: "🐊",
    tagline: "Every species of crocodilian on Earth, since 1893",
    description:
      "One of Florida's oldest continuously operating attractions (est. 1893), the Alligator Farm is also an accredited zoo. It is the only place in the world where you can see all 24 living species of crocodilians. There's also a nature boardwalk through a nesting bird rookery and a zipline over the gators.",
    address: "999 Anastasia Blvd",
    admissionNote: "Admission required",
    hours: "Open daily 9 AM – 5 PM",
    tags: ["Wildlife", "Family", "Unique"],
    adventureHint: "Part of the 'Must-See Landmarks' adventure.",
  },
  {
    name: "Mission Nombre de Dios",
    emoji: "✝️",
    tagline: "Where America's Catholic history began",
    description:
      "The site where Don Pedro Menéndez de Avilés celebrated the first parish Mass in the United States on September 8, 1565. The 208-foot stainless steel cross is visible from the water. The grounds and chapel are free to visit.",
    address: "27 Ocean Ave",
    admissionNote: "Free",
    hours: "Grounds open daily 8 AM – 5 PM",
    tags: ["History", "Free", "Spiritual"],
    adventureHint: "Part of the 'Faith and the Ancient City' adventure.",
  },
  {
    name: "St. Augustine Amphitheatre",
    emoji: "🎶",
    tagline: "The Amp — one of Florida's best outdoor concert venues",
    description:
      "The St. Augustine Amphitheatre is a 4,100-capacity outdoor venue on Anastasia Island, consistently ranked among the best live music venues in Florida. Originally built in the 1960s as a site for the outdoor drama 'Cross and Sword,' it now hosts major national touring acts across every genre. The natural bowl setting, Spanish-moss canopy, and intimate sight lines make even big shows feel close.",
    address: "1340 A1A South, St. Augustine, FL 32080",
    admissionNote: "Ticket prices vary by show",
    hours: "Show nights only — check schedule at theamp.net",
    tags: ["Music", "Outdoors", "Nightlife"],
    adventureHint: null,
  },
  {
    name: "Zorayda Castle",
    emoji: "🕌",
    tagline: "A one-tenth scale replica of Spain's Alhambra Palace",
    description:
      "Built in 1883 by Franklin Smith using a technique called 'artificial stone' (poured concrete), Zorayda Castle is a one-tenth scale reproduction of parts of the Alhambra in Granada, Spain. The interior holds an eclectic collection of ancient Egyptian, Arabic, and Asian artifacts.",
    address: "83 King Street",
    admissionNote: "Admission required",
    hours: "Mon–Sat 10 AM – 5 PM",
    tags: ["Architecture", "History", "Unique"],
    adventureHint: "Part of the 'Must-See Landmarks' adventure.",
  },
];

const TAG_COLORS: Record<string, string> = {
  History: "bg-amber-900/40 text-amber-300",
  Art: "bg-purple-900/40 text-purple-300",
  Architecture: "bg-blue-900/40 text-blue-300",
  Nature: "bg-green-900/40 text-green-300",
  Family: "bg-pink-900/40 text-pink-300",
  Free: "bg-emerald-900/40 text-emerald-300",
  "Free Tour": "bg-emerald-900/40 text-emerald-300",
  Views: "bg-sky-900/40 text-sky-300",
  Wildlife: "bg-lime-900/40 text-lime-300",
  Wine: "bg-rose-900/40 text-rose-300",
  Outdoors: "bg-teal-900/40 text-teal-300",
  Unique: "bg-violet-900/40 text-violet-300",
  Spiritual: "bg-indigo-900/40 text-indigo-300",
  Music: "bg-fuchsia-900/40 text-fuchsia-300",
  Nightlife: "bg-pink-900/40 text-pink-300",
};

export default function FeaturedPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-6 pt-10 pb-6">
        <Link
          href="/"
          className="text-amber-400 text-sm inline-flex items-center gap-1 mb-6 hover:text-amber-300 focus-visible:outline-amber-500"
        >
          ← Back
        </Link>
        <div className="text-4xl mb-3" aria-hidden="true">⭐</div>
        <h1 className="text-2xl font-bold">Featured Things to Do</h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          The essential St. Augustine experiences — history, wildlife, art, and views.
        </p>
      </header>

      <main className="px-4 pb-12 space-y-4">
        {FEATURED.map((item) => (
          <article
            key={item.name}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl leading-none" aria-hidden="true">{item.emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-bold text-base leading-snug">{item.name}</h2>
                <p className="text-amber-300 text-xs mt-0.5">{item.tagline}</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              {item.description}
            </p>

            <div className="space-y-1 mb-3">
              <p className="text-slate-400 text-xs">
                <span className="text-slate-500">📍</span> {item.address}
              </p>
              <p className="text-slate-400 text-xs">
                <span className="text-slate-500">🕐</span> {item.hours}
              </p>
              <p className="text-slate-400 text-xs">
                <span className="text-slate-500">🎟️</span> {item.admissionNote}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? "bg-slate-700 text-slate-300"}`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {item.adventureHint && (
              <p className="text-xs text-amber-500/80 border-t border-slate-700 pt-3 mt-1">
                🗺️ {item.adventureHint}
              </p>
            )}
          </article>
        ))}
      </main>
    </div>
  );
}
