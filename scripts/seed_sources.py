#!/usr/bin/env python3
"""
Seed placeholder source text files under data/sources/.
These are stub files that you replace with real historical content
(or actual PDFs) before production.

Usage:
    python scripts/seed_sources.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

SOURCES_DIR = Path(__file__).parent.parent / "data" / "sources"

STUBS = {
    "castillo_de_san_marcos.txt": """
Castillo de San Marcos
======================
The Castillo de San Marcos is a 17th-century masonry fortification in St. Augustine, Florida.
It is the oldest masonry fort in the continental United States.

Construction began in 1672 under the direction of the Spanish colonial government.
The fort is built from coquina, a sedimentary rock composed of shells and shell fragments.
Coquina's unique property is that it does not shatter under cannon fire — instead, cannonballs
sink into it and are absorbed. This proved decisive during the 1702 siege by English forces
under Governor James Moore of Carolina.

During that siege, the entire population of St. Augustine took refuge inside the Castillo.
After 50 days, Moore withdrew without taking the fort.

A second major siege occurred in 1740, led by British General James Oglethorpe of Georgia.
Again, the defenders held. The fort was never taken by military force.

The Castillo changed hands between Spain, Britain, and the United States multiple times.
Today it is administered by the National Park Service.
""".strip(),

    "civil_rights_st_augustine.txt": """
Civil Rights Movement in St. Augustine
=======================================
St. Augustine played a pivotal role in the Civil Rights movement of 1963-1964.
Dr. Robert B. Hayling, a local dentist, led demonstrations against segregation in the city.

Key events:
- Night marches through downtown St. Augustine beginning in 1963
- Wade-ins at St. Augustine Beach where demonstrators entered segregated waters
- The Monson Motor Lodge pool incident (June 1964) — manager poured acid into pool
- Dr. Martin Luther King Jr. visited and was arrested
- Brutal responses from St. Johns County sheriff's deputies and the KKK

The St. Augustine demonstrations contributed to the passage of the Civil Rights Act of 1964,
signed by President Lyndon B. Johnson on July 2, 1964.
""".strip(),

    "henry_flagler.txt": """
Henry Morrison Flagler
======================
Henry Flagler (1830-1913) was a co-founder of Standard Oil and the man who developed
Florida as a tourist destination for wealthy Americans.

Flagler first visited St. Augustine in 1883. He was struck by the city's potential as
a winter resort and began a massive development program.

Hotels:
- Ponce de León Hotel (1888): Designed by Carrère and Hastings. Spanish Renaissance Revival.
  Now Flagler College.
- Hotel Alcazar (1889): Now the Lightner Museum.
- Hotel Ormond: Further north on the coast.

The Florida East Coast Railway extended south from Jacksonville, eventually reaching
Key West via the Overseas Railway (completed 1912, one year before Flagler's death).

Flagler's development transformed St. Augustine from a quiet city into the "Newport of Florida."
""".strip(),

    "pedro_menendez.txt": """
Pedro Menéndez de Avilés
========================
Pedro Menéndez de Avilés (1519-1574) was a Spanish admiral commissioned by King Philip II
to establish a permanent Spanish settlement in La Florida.

On September 8, 1565 — the Feast of the Nativity of the Virgin Mary — Menéndez landed
near the mouth of the Matanzas River and performed a founding ceremony, claiming the land
for Spain. He named the settlement San Agustín.

Menéndez also led the campaign against the French Huguenot colony at Fort Caroline,
which he attacked and destroyed. French survivors from a shipwreck were executed at
a site called Matanzas (Spanish for "slaughters").

Menéndez served as Governor of Florida until his death in Santander, Spain in 1574.
""".strip(),

    "fort_mose.txt": """
Fort Mose
=========
Fort Mose (Gracia Real de Santa Teresa de Mose) was established in 1738 north of
St. Augustine, Florida. It was the first legally sanctioned free Black community
in what is now the United States.

The Spanish Crown offered freedom to enslaved people who escaped from English colonies
and converted to Catholicism. Many fled from South Carolina and Georgia to Florida.

Fort Mose was garrisoned by free Black militia under the command of Francisco Menéndez,
a former enslaved person from the Mandinga people of West Africa.

The fort played a military role, helping defend St. Augustine during the 1740 siege
by British General James Oglethorpe.
""".strip(),
}

# Add minimal stubs for remaining sources
MINIMAL_STUB_TOPICS = [
    "spanish_colonial_florida.txt",
    "ponce_de_leon_hotel.txt",
    "golden_age_piracy.txt",
    "monson_motor_lodge.txt",
    "colonial_daily_life.txt",
    "british_colonial_florida.txt",
    "founding_st_augustine.txt",
    "florida_east_coast_railway.txt",
    "spanish_treasure_fleets.txt",
]


def main():
    SOURCES_DIR.mkdir(parents=True, exist_ok=True)

    created = 0
    for filename, content in STUBS.items():
        path = SOURCES_DIR / filename
        if path.exists():
            print(f"  [SKIP] {filename} already exists")
            continue
        path.write_text(content, encoding="utf-8")
        print(f"  [CREATE] {filename}")
        created += 1

    for filename in MINIMAL_STUB_TOPICS:
        path = SOURCES_DIR / filename
        if path.exists():
            print(f"  [SKIP] {filename} already exists")
            continue
        topic = filename.replace(".txt", "").replace("_", " ").title()
        path.write_text(
            f"{topic}\n{'=' * len(topic)}\n"
            f"[Placeholder — replace with real historical content about {topic}.]\n",
            encoding="utf-8",
        )
        print(f"  [STUB] {filename}")
        created += 1

    print(f"\nDone. Created {created} source file(s) in {SOURCES_DIR}")
    print("Replace stub content with real historical documents before running ingest_sources.py")


if __name__ == "__main__":
    main()
