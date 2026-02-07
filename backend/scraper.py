"""
GreenLens AI – Recycling-center scraper for Georgia & Tennessee
Uses the Overpass API (OpenStreetMap) to find real recycling / waste
facilities, then enriches them with nearest-city assignment.

Results are cached in centers_cache.json with a configurable TTL so we
don't hit the public APIs on every request.
"""

import json
import time
import hashlib
import logging
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger("greenlens.scraper")

CACHE_FILE = Path(__file__).parent / "centers_cache.json"
CACHE_TTL_SECONDS = 60 * 60 * 12  # 12 hours

# Target cities per state
STATE_CITIES = {
    "Georgia": ["Atlanta", "Savannah", "Augusta", "Macon", "Athens", "Columbus"],
    "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
}

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


def _build_overpass_query(state_name: str) -> str:
    """Build an Overpass QL query for recycling centers in a given state."""
    return f"""
[out:json][timeout:30];
area["name"="{state_name}"]["admin_level"="4"]["boundary"="administrative"]->.searchArea;
(
  node["amenity"="recycling"]["recycling_type"="centre"](area.searchArea);
  way["amenity"="recycling"]["recycling_type"="centre"](area.searchArea);
  node["amenity"="recycling"](area.searchArea);
  way["amenity"="recycling"](area.searchArea);
  node["industrial"="scrap_yard"](area.searchArea);
  way["industrial"="scrap_yard"](area.searchArea);
  node["amenity"="waste_transfer_station"](area.searchArea);
  way["amenity"="waste_transfer_station"](area.searchArea);
  node["shop"="scrap"](area.searchArea);
  way["shop"="scrap"](area.searchArea);
  node["amenity"="waste_disposal"](area.searchArea);
  way["amenity"="waste_disposal"](area.searchArea);
);
out center tags;
"""


def _tags_to_accepts(tags: dict) -> list[str]:
    """Infer accepted waste categories from OSM tags."""
    accepts = set()
    tag_str = json.dumps(tags).lower()

    recyclable_signals = [
        "recycling", "scrap", "metal", "plastic", "glass",
        "paper", "cardboard", "aluminium", "aluminum", "steel",
        "electronics", "e-waste", "cans", "bottles",
    ]
    organic_signals = [
        "organic", "compost", "green_waste", "wood", "yard",
        "garden_waste", "food_waste", "biomass",
    ]
    general_signals = [
        "waste_transfer", "waste_disposal", "landfill", "general",
        "residual_waste", "non-recyclable", "refuse",
    ]

    for signal in recyclable_signals:
        if signal in tag_str:
            accepts.add("recyclable")
            break

    for signal in organic_signals:
        if signal in tag_str:
            accepts.add("organic")
            break

    for signal in general_signals:
        if signal in tag_str:
            accepts.add("non-recyclable")
            break

    # Default: if nothing matched, assume recyclable
    if not accepts:
        accepts.add("recyclable")

    return sorted(accepts)


def _element_to_center(element: dict, state_abbrev: str = "GA") -> Optional[dict]:
    """Convert an Overpass element to our Center schema."""
    tags = element.get("tags", {})
    name = tags.get("name")
    if not name:
        # Skip unnamed locations
        return None

    lat = element.get("lat") or element.get("center", {}).get("lat")
    lng = element.get("lon") or element.get("center", {}).get("lon")
    if not lat or not lng:
        return None

    # Build a stable id from coordinates + name
    raw = f"{lat},{lng},{name}"
    center_id = "osm-" + hashlib.md5(raw.encode()).hexdigest()[:10]

    city = tags.get("addr:city", "")
    
    # Build address from OSM address tags
    house = tags.get("addr:housenumber", "")
    street = tags.get("addr:street", "")
    addr_city = tags.get("addr:city", "")
    state = tags.get("addr:state", state_abbrev)
    postcode = tags.get("addr:postcode", "")
    
    # Only build a real address if we have at least a street
    if street:
        parts = []
        if house:
            parts.append(f"{house} {street}")
        else:
            parts.append(street)
        if addr_city:
            parts.append(addr_city)
        parts.append(state)
        if postcode:
            parts.append(postcode)
        address = ", ".join(parts)
    else:
        # No street info — leave address empty; will be populated from lat/lng later
        address = ""

    # Only include phone if actually present in OSM data
    raw_phone = tags.get("phone", tags.get("contact:phone", ""))
    phone = raw_phone.strip() if raw_phone else ""

    return {
        "id": center_id,
        "name": name,
        "city": city,
        "lat": round(float(lat), 6),
        "lng": round(float(lng), 6),
        "accepts": _tags_to_accepts(tags),
        "address": address,
        "phone": phone,
        "source": "openstreetmap",
    }


# Major cities with their approximate coordinates (GA + TN)
CITY_COORDS = {
    # Georgia
    "Atlanta": (33.749, -84.388),
    "Savannah": (32.081, -81.091),
    "Augusta": (33.474, -81.975),
    "Macon": (32.841, -83.632),
    "Athens": (33.951, -83.357),
    "Columbus": (32.461, -84.988),
    "Roswell": (34.023, -84.362),
    "Marietta": (33.953, -84.550),
    "Kennesaw": (34.023, -84.616),
    "Decatur": (33.775, -84.296),
    "Duluth": (34.003, -84.144),
    "Alpharetta": (34.075, -84.294),
    "Lawrenceville": (33.957, -83.988),
    "Valdosta": (30.832, -83.279),
    "Albany": (31.579, -84.156),
    "Rome": (34.257, -85.165),
    "Gainesville": (34.298, -83.824),
    "Warner Robins": (32.616, -83.624),
    "Smyrna": (33.884, -84.514),
    "Johns Creek": (34.029, -84.198),
    # Tennessee
    "Nashville": (36.163, -86.781),
    "Memphis": (35.150, -90.049),
    "Knoxville": (35.961, -83.921),
    "Chattanooga": (35.046, -85.309),
    "Clarksville": (36.530, -87.359),
    "Murfreesboro": (35.846, -86.392),
    "Franklin": (35.925, -86.869),
    "Jackson": (35.614, -88.814),
    "Johnson City": (36.313, -82.354),
    "Bartlett": (35.205, -89.874),
    "Hendersonville": (36.305, -86.620),
    "Kingsport": (36.548, -82.562),
    "Collierville": (35.042, -89.665),
    "Smyrna_TN": (35.982, -86.519),
    "Germantown": (35.087, -89.810),
}

# Map cities to state abbreviations for address fallback
CITY_STATE_ABBREV = {}
for _city in ["Atlanta", "Savannah", "Augusta", "Macon", "Athens", "Columbus",
              "Roswell", "Marietta", "Kennesaw", "Decatur", "Duluth", "Alpharetta",
              "Lawrenceville", "Valdosta", "Albany", "Rome", "Gainesville",
              "Warner Robins", "Smyrna", "Johns Creek"]:
    CITY_STATE_ABBREV[_city] = "GA"
for _city in ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville",
              "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Bartlett",
              "Hendersonville", "Kingsport", "Collierville", "Smyrna_TN", "Germantown"]:
    CITY_STATE_ABBREV[_city] = "TN"

MAX_CITY_DISTANCE_KM = 30  # assign city if within this radius


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Quick haversine distance in km."""
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _assign_cities(centers: list[dict], state_abbrev: str = "GA") -> list[dict]:
    """Assign the nearest city to centers that lack one, and build
    a fallback address from city + state when address is missing."""
    state_name = "Georgia" if state_abbrev == "GA" else "Tennessee"
    for c in centers:
        if not c.get("city"):
            best_city = ""
            best_dist = float("inf")
            for city, (clat, clng) in CITY_COORDS.items():
                d = _haversine_km(c["lat"], c["lng"], clat, clng)
                if d < best_dist:
                    best_dist = d
                    best_city = city
            if best_dist <= MAX_CITY_DISTANCE_KM:
                c["city"] = best_city
            else:
                c["city"] = state_name

        # Build a usable address if we don't have one
        if not c.get("address"):
            c["address"] = f"{c['city']}, {state_abbrev}" if c.get("city") else state_name

    return centers


def _load_cache() -> Optional[dict]:
    """Load cached data if the file exists and TTL hasn't expired."""
    if not CACHE_FILE.exists():
        return None
    try:
        data = json.loads(CACHE_FILE.read_text())
        if time.time() - data.get("timestamp", 0) < CACHE_TTL_SECONDS:
            return data
        # Also handle legacy format (single "centers" key)
        if "centers" in data and "centers_Georgia" not in data:
            return None
    except (json.JSONDecodeError, KeyError):
        pass
    return None


def _save_cache(centers: list[dict]):
    """Persist centers to the cache file (legacy format)."""
    CACHE_FILE.write_text(
        json.dumps({"timestamp": time.time(), "centers": centers}, indent=2)
    )


def _save_cache_state(state: str, centers: list[dict]):
    """Persist centers for a specific state to the cache file."""
    existing = {}
    if CACHE_FILE.exists():
        try:
            existing = json.loads(CACHE_FILE.read_text())
        except (json.JSONDecodeError, KeyError):
            pass
    existing["timestamp"] = time.time()
    existing[f"centers_{state}"] = centers
    CACHE_FILE.write_text(json.dumps(existing, indent=2))


# ── Seed data (verified centers) ──────────────────────────────────
SEED_CENTERS = {
    "Georgia": [
        {
            "id": "lbc-atlanta",
            "name": "Lifecycle Building Center",
            "city": "Atlanta",
            "lat": 33.7901,
            "lng": -84.3637,
            "accepts": ["recyclable", "organic"],
            "address": "649 Atlanta Ave SE, Atlanta, GA 30315",
            "phone": "(404) 525-0455",
            "source": "verified",
        },
        {
            "id": "sa-recycling-atlanta",
            "name": "SA Recycling - Atlanta",
            "city": "Atlanta",
            "lat": 33.7279,
            "lng": -84.4107,
            "accepts": ["recyclable"],
            "address": "1577 Sylvan Rd SW, Atlanta, GA 30310",
            "phone": "(404) 758-6606",
            "source": "verified",
        },
        {
            "id": "waste-mgmt-savannah",
            "name": "Waste Management - Savannah",
            "city": "Savannah",
            "lat": 32.0286,
            "lng": -81.1821,
            "accepts": ["recyclable", "non-recyclable", "organic"],
            "address": "1302 US-80, Garden City, GA 31408",
            "phone": "(912) 964-0841",
            "source": "verified",
        },
        {
            "id": "augusta-recycling",
            "name": "Augusta Materials Recycling Facility",
            "city": "Augusta",
            "lat": 33.4460,
            "lng": -81.9984,
            "accepts": ["recyclable", "organic"],
            "address": "2813 Deans Bridge Rd, Augusta, GA 30906",
            "phone": "(706) 796-5025",
            "source": "verified",
        },
        {
            "id": "macon-scrap",
            "name": "Macon Iron & Paper Stock",
            "city": "Macon",
            "lat": 32.8318,
            "lng": -83.6319,
            "accepts": ["recyclable"],
            "address": "459 Walnut St, Macon, GA 31201",
            "phone": "(478) 743-6941",
            "source": "verified",
        },
        {
            "id": "athens-recycling",
            "name": "Athens-Clarke Recycling Center",
            "city": "Athens",
            "lat": 33.9361,
            "lng": -83.3271,
            "accepts": ["recyclable", "organic"],
            "address": "725 Hancock Industrial Way, Athens, GA 30605",
            "phone": "(706) 613-3512",
            "source": "verified",
        },
        {
            "id": "columbus-green",
            "name": "Columbus Green Recycling",
            "city": "Columbus",
            "lat": 32.4600,
            "lng": -84.9877,
            "accepts": ["recyclable", "organic", "non-recyclable"],
            "address": "2100 S Lumpkin Rd, Columbus, GA 31903",
            "phone": "(706) 596-0300",
            "source": "verified",
        },
    ],
    "Tennessee": [
        {
            "id": "nashville-recycling",
            "name": "Nashville Recycling Center",
            "city": "Nashville",
            "lat": 36.1545,
            "lng": -86.7727,
            "accepts": ["recyclable", "organic"],
            "address": "943 Doctor Richard G Adams Dr, Nashville, TN 37207",
            "phone": "(615) 862-8600",
            "source": "verified",
        },
        {
            "id": "memphis-recycling",
            "name": "Memphis Recycling & Disposal",
            "city": "Memphis",
            "lat": 35.0855,
            "lng": -90.0241,
            "accepts": ["recyclable", "non-recyclable", "organic"],
            "address": "3175 Jackson Ave, Memphis, TN 38108",
            "phone": "(901) 576-6797",
            "source": "verified",
        },
        {
            "id": "knoxville-recycling",
            "name": "Knoxville Solid Waste Facility",
            "city": "Knoxville",
            "lat": 35.9395,
            "lng": -83.9148,
            "accepts": ["recyclable", "organic"],
            "address": "1033 Elm St, Knoxville, TN 37921",
            "phone": "(865) 215-4311",
            "source": "verified",
        },
        {
            "id": "chattanooga-recycling",
            "name": "Chattanooga Recycling Center",
            "city": "Chattanooga",
            "lat": 35.0380,
            "lng": -85.2870,
            "accepts": ["recyclable", "organic", "non-recyclable"],
            "address": "1250 Market St, Chattanooga, TN 37402",
            "phone": "(423) 425-6160",
            "source": "verified",
        },
        {
            "id": "clarksville-recycling",
            "name": "Clarksville Recycling Center",
            "city": "Clarksville",
            "lat": 36.5285,
            "lng": -87.3594,
            "accepts": ["recyclable"],
            "address": "690 Woodstock Ln, Clarksville, TN 37040",
            "phone": "(931) 645-7464",
            "source": "verified",
        },
    ],
}


async def scrape_centers(state: str = "Georgia") -> list[dict]:
    """
    Fetch recycling centers for a state via the Overpass API, merge with
    verified seed data, cache the result, and return it.
    """
    state_abbrev = "GA" if state == "Georgia" else "TN"

    # 1. Check cache (per-state)
    cached = _load_cache()
    cache_key = f"centers_{state}"
    if cached and cache_key in cached:
        logger.info("Returning %d cached centers for %s", len(cached[cache_key]), state)
        return cached[cache_key]

    logger.info("Cache miss for %s – scraping Overpass API …", state)

    all_centers: list[dict] = []

    # 2. Query Overpass
    try:
        query = _build_overpass_query(state)
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                OVERPASS_URL,
                data={"data": query},
            )
            resp.raise_for_status()
            data = resp.json()

        elements = data.get("elements", [])
        logger.info("Overpass returned %d elements for %s", len(elements), state)

        for elem in elements:
            center = _element_to_center(elem, state_abbrev)
            if center:
                all_centers.append(center)

        # 3. Assign cities based on coordinates (fast, no API calls)
        all_centers = _assign_cities(all_centers, state_abbrev)

    except Exception as e:
        logger.warning("Overpass scrape failed for %s: %s — using seed data only", state, e)

    # 4. Merge with seed data (seed centers always included, deduped by id)
    seed = SEED_CENTERS.get(state, [])
    seen_ids = {c["id"] for c in all_centers}
    for s in seed:
        if s["id"] not in seen_ids:
            all_centers.append(s)

    # 5. Also deduplicate by name similarity (avoid near-duplicates)
    all_centers = _deduplicate_by_name(all_centers)

    # 6. Sort: verified first, then alphabetical
    all_centers.sort(key=lambda c: (0 if c.get("source") == "verified" else 1, c["name"]))

    # 7. Cache per-state
    _save_cache_state(state, all_centers)
    logger.info("Scraped & cached %d centers for %s", len(all_centers), state)

    return all_centers


# Keep backward-compatible alias
async def scrape_georgia_centers() -> list[dict]:
    """Backward-compatible wrapper — scrapes all states."""
    ga = await scrape_centers("Georgia")
    tn = await scrape_centers("Tennessee")
    return ga + tn


def _deduplicate_by_name(centers: list[dict]) -> list[dict]:
    """Remove near-duplicate centers (same name, ignoring case)."""
    seen: dict[str, dict] = {}
    for c in centers:
        key = c["name"].lower().strip()
        if key in seen:
            # Prefer verified source
            if c.get("source") == "verified":
                seen[key] = c
        else:
            seen[key] = c
    return list(seen.values())


def invalidate_cache():
    """Delete the cache so the next request re-scrapes."""
    if CACHE_FILE.exists():
        CACHE_FILE.unlink()
        logger.info("Cache invalidated")
