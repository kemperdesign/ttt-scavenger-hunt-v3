"""
Registry of historical source documents to ingest into Qdrant.

Add entries here to make new documents available to the AI Historian.
Each source has:
  - path: relative path from project root to the source file (PDF, HTML, or TXT)
  - topic: must match one of the `source_topics` in characters.py
  - title: human-readable source name for attribution
"""

SOURCES: list[dict] = [
    {
        "path": "data/sources/castillo_de_san_marcos.txt",
        "topic": "castillo_de_san_marcos",
        "title": "Castillo de San Marcos — National Park Service History",
    },
    {
        "path": "data/sources/spanish_colonial_florida.txt",
        "topic": "spanish_florida",
        "title": "Spanish Colonial Florida Overview",
    },
    {
        "path": "data/sources/fort_mose.txt",
        "topic": "fort_mose",
        "title": "Fort Mose — First Free Black Settlement",
    },
    {
        "path": "data/sources/pedro_menendez.txt",
        "topic": "pedro_menendez",
        "title": "Pedro Menéndez de Avilés — Founder of St. Augustine",
    },
    {
        "path": "data/sources/henry_flagler.txt",
        "topic": "henry_flagler",
        "title": "Henry Flagler and the Gilded Age Development of St. Augustine",
    },
    {
        "path": "data/sources/ponce_de_leon_hotel.txt",
        "topic": "ponce_de_leon_hotel",
        "title": "Ponce de León Hotel (now Flagler College)",
    },
    {
        "path": "data/sources/golden_age_piracy.txt",
        "topic": "golden_age_of_piracy",
        "title": "The Golden Age of Piracy in the Caribbean and Florida",
    },
    {
        "path": "data/sources/civil_rights_st_augustine.txt",
        "topic": "civil_rights_st_augustine",
        "title": "Civil Rights Movement in St. Augustine (1963–1964)",
    },
    {
        "path": "data/sources/monson_motor_lodge.txt",
        "topic": "monson_motor_lodge",
        "title": "The Monson Motor Lodge Incident (1964)",
    },
    {
        "path": "data/sources/colonial_daily_life.txt",
        "topic": "colonial_daily_life",
        "title": "Daily Life in Colonial St. Augustine",
    },
    {
        "path": "data/sources/british_colonial_florida.txt",
        "topic": "british_colonial_florida",
        "title": "British Colonial Period in Florida (1763–1783)",
    },
    {
        "path": "data/sources/founding_st_augustine.txt",
        "topic": "founding_st_augustine",
        "title": "The Founding of St. Augustine (1565)",
    },
    {
        "path": "data/sources/florida_east_coast_railway.txt",
        "topic": "florida_east_coast_railway",
        "title": "Florida East Coast Railway — Flagler's Legacy",
    },
    {
        "path": "data/sources/spanish_treasure_fleets.txt",
        "topic": "spanish_treasure_fleets",
        "title": "Spanish Treasure Fleets and the Florida Straits",
    },
]
