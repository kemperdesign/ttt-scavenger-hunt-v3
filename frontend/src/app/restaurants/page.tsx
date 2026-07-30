import React from "react";
import Link from "next/link";

export const runtime = "edge";

const RESTAURANTS = [
  // Fine dining / upscale
  {
    name: "Preserved Restaurant & Bar",
    emoji: "🍽️",
    tagline: "Farm-to-table Florida cuisine in a restored historic building",
    description:
      "One of St. Augustine's most acclaimed restaurants, Preserved focuses on local Florida ingredients with a constantly changing menu. The cocktail program is equally serious — house-made syrups, Florida spirits, and deep whiskey selection.",
    address: "102 Bridge Street",
    priceRange: "$$$$",
    cuisine: "New American / Florida",
    hours: "Dinner nightly from 5 PM",
    tags: ["Fine Dining", "Cocktails", "Date Night"],
  },
  {
    name: "The Floridian",
    emoji: "🌿",
    tagline: "Florida comfort food done right, local and seasonal",
    description:
      "A St. Augustine institution for locals. The Floridian serves elevated Southern and Florida comfort food — think shrimp and grits, deviled eggs, and seasonal vegetable plates. Brunch is outstanding. Cash and card accepted.",
    address: "72 Spanish Street",
    priceRange: "$$$",
    cuisine: "Florida Southern / Brunch",
    hours: "Tue–Sun 8 AM – 3 PM, dinner Thu–Sat",
    tags: ["Brunch", "Local Favorite", "Vegetarian-Friendly"],
  },
  {
    name: "Casa Monica Hotel — Cobalt Lounge",
    emoji: "🏨",
    tagline: "Upscale small plates in a Moorish Revival hotel",
    description:
      "The restaurant and bar inside the 1888 Casa Monica Hotel offers a refined atmosphere, curated small plates, and one of the best whiskey lists in the city. The setting — Moorish arches, ornate tilework, candlelight — is unmatched in St. Augustine.",
    address: "95 Cordova Street",
    priceRange: "$$$$",
    cuisine: "American / Small Plates",
    hours: "Daily 11 AM – 11 PM",
    tags: ["Cocktails", "Date Night", "Historic Setting"],
  },
  // Mid-range
  {
    name: "O.C. White's Seafood & Spirits",
    emoji: "🦞",
    tagline: "Fresh Florida seafood with bayfront views",
    description:
      "Set in a historic 1790 home on the bayfront, O.C. White's is one of St. Augustine's most scenic dining spots. The menu centers on fresh local seafood — grouper, shrimp, oysters — with views of the Matanzas River and the Bridge of Lions.",
    address: "118 Avenida Menendez",
    priceRange: "$$$",
    cuisine: "Seafood",
    hours: "Daily 11:30 AM – 10 PM",
    tags: ["Seafood", "Waterfront", "Historic Setting"],
  },
  {
    name: "Hypo Bar & Grill (at The Hyppo)",
    emoji: "🍦",
    tagline: "Gourmet popsicles and a surprisingly serious kitchen",
    description:
      "The Hyppo is famous for artisanal popsicles in flavors like mango chili and guava cream. The adjacent café and bar serves sandwiches, grain bowls, and local beer. A perfect midday stop on St. George Street.",
    address: "48 Charlotte Street",
    priceRange: "$$",
    cuisine: "Café / Sandwiches",
    hours: "Daily 10 AM – 8 PM",
    tags: ["Casual", "Local Favorite", "Kid-Friendly"],
  },
  {
    name: "Santa Fe Restaurant",
    emoji: "🌵",
    tagline: "Upscale Southwestern and Latin cuisine",
    description:
      "Santa Fe brings New Mexico-influenced cuisine to the Ancient City — green and red chile, enchiladas, and a strong margarita program. One of the more distinctive menus in the historic district.",
    address: "142 King Street",
    priceRange: "$$$",
    cuisine: "Southwestern / Latin",
    hours: "Daily 11 AM – 9 PM",
    tags: ["Margaritas", "Dinner"],
  },
  {
    name: "Collage Restaurant",
    emoji: "🎭",
    tagline: "Long-running local favorite for eclectic fine dining",
    description:
      "Collage has been a St. Augustine dining landmark for decades. The menu is global — French technique, Florida ingredients, Asian influences — with a deep wine list and consistently excellent execution.",
    address: "60 Hypolita Street",
    priceRange: "$$$$",
    cuisine: "Eclectic / Global",
    hours: "Dinner nightly from 5:30 PM",
    tags: ["Fine Dining", "Date Night", "Wine"],
  },
  // Casual / Lunch
  {
    name: "Catch 27",
    emoji: "🐟",
    tagline: "Casual Florida seafood in the heart of the historic district",
    description:
      "Named for the 27 miles of coastline in St. Johns County, Catch 27 keeps it simple: fresh Florida seafood, craft beer, and an unpretentious atmosphere. The fish tacos and smoked fish dip are local staples.",
    address: "40 Charlotte Street",
    priceRange: "$$",
    cuisine: "Seafood / Casual",
    hours: "Daily 11 AM – 9 PM",
    tags: ["Seafood", "Casual", "Local Favorite"],
  },
  {
    name: "Aviles Street Kitchen",
    emoji: "🥗",
    tagline: "Fresh and local on the oldest street in America",
    description:
      "A neighborhood café on Aviles Street — the oldest European-laid-out street in the United States — serving breakfast, lunch, and light dinner. House-baked pastries, good coffee, and sandwiches built on local bread.",
    address: "6 Aviles Street",
    priceRange: "$$",
    cuisine: "Café / Brunch",
    hours: "Daily 7 AM – 4 PM",
    tags: ["Breakfast", "Brunch", "Coffee", "Casual"],
  },
  // Bars with food
  {
    name: "Milltop Tavern",
    emoji: "🍺",
    tagline: "Live music, cold beer, and the best balcony in the city",
    description:
      "A St. Augustine institution on the upper end of St. George Street. The covered balcony overlooks the pedestrian zone, live music plays most nights, and the bar pours a long list of Florida craft beers. Bar food is simple but solid.",
    address: "19½ St. George Street",
    priceRange: "$$",
    cuisine: "Bar Food / Pub",
    hours: "Daily 11 AM – 2 AM",
    tags: ["Live Music", "Beer", "Outdoor Seating"],
  },
  {
    name: "White Lion Pub",
    emoji: "🦁",
    tagline: "Florida's oldest public house",
    description:
      "Established in 1829 on the site of a colonial-era tavern, the White Lion claims the title of Florida's oldest public house. Unpretentious, cold beer, solid pub food, and the kind of regulars who know everyone's name.",
    address: "20 Cuna Street",
    priceRange: "$$",
    cuisine: "Pub Food",
    hours: "Daily 11 AM – 2 AM",
    tags: ["Historic", "Beer", "Casual"],
  },
  {
    name: "Tradewinds Lounge",
    emoji: "🌬️",
    tagline: "The original no-frills dive — open since 1964",
    description:
      "Tradewinds is the oldest bar in St. Augustine and proudly dive. Cash only, cold Busch, live local music most nights, and a covered outdoor patio that gets going after dark. A St. Augustine rite of passage.",
    address: "124 Charlotte Street",
    priceRange: "$",
    cuisine: "Dive Bar",
    hours: "Daily noon – 2 AM",
    tags: ["Dive Bar", "Live Music", "Cash Only"],
  },
];

const PRICE_LABEL: Record<string, string> = {
  "$": "Budget",
  "$$": "Moderate",
  "$$$": "Mid-range",
  "$$$$": "Upscale",
};

const TAG_COLORS: Record<string, string> = {
  "Fine Dining": "bg-amber-900/40 text-amber-300",
  Cocktails: "bg-purple-900/40 text-purple-300",
  "Date Night": "bg-rose-900/40 text-rose-300",
  Brunch: "bg-orange-900/40 text-orange-300",
  "Local Favorite": "bg-emerald-900/40 text-emerald-300",
  Seafood: "bg-sky-900/40 text-sky-300",
  Waterfront: "bg-blue-900/40 text-blue-300",
  Casual: "bg-slate-700 text-slate-300",
  "Kid-Friendly": "bg-pink-900/40 text-pink-300",
  "Live Music": "bg-fuchsia-900/40 text-fuchsia-300",
  Beer: "bg-yellow-900/40 text-yellow-300",
  "Outdoor Seating": "bg-green-900/40 text-green-300",
  Historic: "bg-stone-700 text-stone-300",
  "Dive Bar": "bg-slate-700 text-slate-400",
  "Cash Only": "bg-red-900/40 text-red-400",
  Wine: "bg-violet-900/40 text-violet-300",
  Breakfast: "bg-orange-900/40 text-orange-300",
  Coffee: "bg-amber-900/40 text-amber-300",
  Margaritas: "bg-lime-900/40 text-lime-300",
  "Historic Setting": "bg-stone-700 text-stone-300",
  "Vegetarian-Friendly": "bg-green-900/40 text-green-300",
  Dinner: "bg-indigo-900/40 text-indigo-300",
};

const PRICE_COLOR: Record<string, string> = {
  "$": "text-green-400",
  "$$": "text-emerald-400",
  "$$$": "text-amber-400",
  "$$$$": "text-rose-400",
};

export default function RestaurantsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-6 pt-10 pb-6">
        <Link
          href="/"
          className="text-amber-400 text-sm inline-flex items-center gap-1 mb-6 hover:text-amber-300 focus-visible:outline-amber-500"
        >
          ← Back
        </Link>
        <div className="text-4xl mb-3" aria-hidden="true">🍽️</div>
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
          From bayfront seafood to hidden dive bars — where to eat and drink in the Ancient City.
        </p>
      </header>

      <main className="px-4 pb-12 space-y-4">
        {RESTAURANTS.map((r) => (
          <article
            key={r.name}
            className="bg-slate-800 border border-slate-700 rounded-2xl p-5"
          >
            <div className="flex items-start gap-3 mb-2">
              <span className="text-3xl leading-none" aria-hidden="true">{r.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-white font-bold text-base leading-snug">{r.name}</h2>
                  <span className={`text-sm font-bold shrink-0 ${PRICE_COLOR[r.priceRange] ?? "text-slate-400"}`}>
                    {r.priceRange}
                  </span>
                </div>
                <p className="text-amber-300 text-xs mt-0.5">{r.tagline}</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-3">{r.description}</p>

            <div className="space-y-1 mb-3">
              <p className="text-slate-400 text-xs">
                <span className="text-slate-500">📍</span> {r.address}
              </p>
              <p className="text-slate-400 text-xs">
                <span className="text-slate-500">🕐</span> {r.hours}
              </p>
              <p className="text-slate-400 text-xs">
                <span className="text-slate-500">🍴</span> {r.cuisine} · <span className={PRICE_COLOR[r.priceRange]}>{PRICE_LABEL[r.priceRange]}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {r.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? "bg-slate-700 text-slate-300"}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}

        <p className="text-slate-600 text-xs text-center pt-2">
          Hours and details may vary — always confirm before visiting.
        </p>
      </main>
    </div>
  );
}
