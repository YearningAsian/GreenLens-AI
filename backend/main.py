"""
GreenLens AI - FastAPI Backend
Waste classification: Organic / Recyclable / Non-Recyclable
Powered by Google Gemini 2.5 Flash
"""

import os
import json
import base64
from datetime import datetime
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import httpx

from scraper import scrape_centers, invalidate_cache, SEED_CENTERS

load_dotenv(override=True)

app = FastAPI(
    title="GreenLens AI API",
    description="Waste classification powered by Gemini 2.5 Flash — National Non-Profit · Georgia & Tennessee Pilots",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"[VALIDATION ERROR] {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )


# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
CONVEX_URL = os.getenv("CONVEX_URL", "")

# ── Corrections store ─────────────────────────────────────────────
# Simple JSON file that stores user corrections so Gemini can learn
# from feedback via few-shot examples in the prompt.
CORRECTIONS_FILE = Path(__file__).parent / "corrections.json"


def _load_corrections() -> list[dict]:
    if CORRECTIONS_FILE.exists():
        try:
            return json.loads(CORRECTIONS_FILE.read_text())
        except Exception:
            return []
    return []


def _save_correction(correction: dict):
    corrections = _load_corrections()
    corrections.append(correction)
    # Keep only last 200 corrections
    corrections = corrections[-200:]
    CORRECTIONS_FILE.write_text(json.dumps(corrections, indent=2))

# ── CO₂ Methodology ──────────────────────────────────────────────
# Factors are weighted averages derived from the EPA WARM Model
# (Waste Reduction Model) v16 for community waste diversion.
#
# Recyclable  → 1.02 kg CO₂ / lb — weighted avg of metals, plastics,
#               glass, cardboard diverted from landfill.
# Organic     → 0.34 kg CO₂ / lb — composting wood, yard waste, and
#               bio-based debris avoids methane from landfill decay.
# Non-Recyclable → 0.05 kg CO₂ / lb — minimal credit for proper
#               disposal / waste-to-energy over open landfilling.
#
# Weight estimation: Gemini vision model estimates total weight from
# visual scale cues (objects, containers, comparison references).
# ──────────────────────────────────────────────────────────────────
CO2_FACTORS = {
    "recyclable": 1.02,
    "organic": 0.34,
    "non-recyclable": 0.05,
}


class ScanResult(BaseModel):
    categories: list[dict]
    total_weight_estimate_lbs: float
    co2_saved_kg: float
    recommended_centers: list[dict]
    classification_confidence: float
    timestamp: str
    summary: str
    needs_rescan: bool = False


class CorrectionRequest(BaseModel):
    original_categories: list[dict]
    corrected_categories: list[dict]
    image_description: Optional[str] = None
    timestamp: Optional[str] = None


class HealthCheck(BaseModel):
    status: str
    version: str
    model: str


@app.get("/", response_model=HealthCheck)
async def health_check():
    return HealthCheck(
        status="healthy",
        version="2.0.0",
        model="gemini-2.5-flash",
    )


@app.post("/api/scan", response_model=ScanResult)
async def scan_material(
    image: UploadFile = File(...),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
):
    """
    Classify waste into Organic / Recyclable / Non-Recyclable
    using Gemini 2.5 Flash vision, then estimate weight & CO₂ savings.
    """
    try:
        image_data = await image.read()
        if not image_data:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        print(f"[SCAN] Received image: {image.filename}, size={len(image_data)} bytes, content_type={image.content_type}")
        image_base64 = base64.b64encode(image_data).decode("utf-8")

        mime_type = image.content_type or "image/jpeg"

        # Build few-shot correction examples from past feedback
        correction_examples = ""
        weight_learning_examples = ""
        corrections = _load_corrections()
        if corrections:
            recent = corrections[-5:]  # Use last 5 corrections as context
            examples = []
            weight_examples = []
            for c in recent:
                orig = c.get("original_categories", [])
                fixed = c.get("corrected_categories", [])
                desc = c.get("image_description", "waste image")
                
                # Classification feedback
                examples.append(
                    f"- Image of '{desc}': AI said {json.dumps([x['name'] + ':' + str(x['percentage']) + '%' for x in orig])} "
                    f"→ User corrected to {json.dumps([x['name'] + ':' + str(x['percentage']) + '%' for x in fixed])}"
                )
                
                # Weight estimation feedback
                for o, f in zip(orig, fixed):
                    if o.get('weight_estimate_lbs') != f.get('weight_estimate_lbs'):
                        weight_examples.append(
                            f"- {o['name']} at {o.get('percentage', 0)}%: AI estimated {o.get('weight_estimate_lbs', 0)} lbs "
                            f"→ Actual: {f.get('weight_estimate_lbs', 0)} lbs"
                        )
            
            if examples:
                correction_examples = (
                    "\n\nHere are recent user corrections to learn from — adjust your classification accordingly:\n"
                    + "\n".join(examples)
                )
            
            if weight_examples:
                weight_learning_examples = (
                    "\n\nLEARN FROM THESE WEIGHT CORRECTIONS:\n"
                    + "\n".join(weight_examples[:10])  # Last 10 weight corrections
                    + "\n\nApply these insights to improve your weight estimates."
                )

        prompt = f"""You are an expert in waste classification with advanced visual size estimation capabilities. Analyze this image and classify ALL visible waste into exactly three categories: organic, recyclable, or non-recyclable.

**PHASE 1: SIZE ASSESSMENT**
Before classifying, assess the scale of items using these reference points:
- Small phone (4-6 oz / 0.25-0.4 lb)
- Standard brick (4-5 lbs)
- Empty cardboard box: Small=0.2-0.5 lb, Medium=0.5-1.5 lb, Large=2-4 lb, XL=5-8 lb
- Filled cardboard box: Small=2-5 lb, Medium=5-15 lb, Large=15-40 lb, XL=40-70 lb
- Single piece of lumber (2x4x8): 10-13 lbs
- Drywall sheet (4x8): 50-60 lbs
- Metal pipe/conduit: 2-5 lbs per foot
- Concrete block: 30-35 lbs
- Pile of leaves (loose): 10-20 lbs per cubic yard
- Bag of garbage (kitchen): 8-15 lbs

**PHASE 2: WEIGHT ESTIMATION RULES**
- EMPTY containers: boxes, bottles, cans = <0.5 lb each (total all empties, don't overestimate)
- SINGLE small items: paper, cardboard pieces = 0.1-0.3 lb each
- PILES: Count visible items x average item weight
- VISUAL VOLUME: Estimate cubic feet, then apply density (cardboard ~10 lb/cu ft, metal ~100 lb/cu ft)
- COMPARE to known objects in frame (if you see a person, use their scale reference)
- DEFAULT MINIMUM: If unsure, estimate LOW rather than HIGH (2-5 lbs minimum for small piles)
- BE CONSERVATIVE: An empty cardboard box is NOT 2 lbs

**Material Classification Guidelines:**
- **organic**: wood, yard waste, untreated lumber, paper, cardboard, food waste, plant matter, soil, leaves, grass clippings
- **recyclable**: metals (steel, aluminum, copper), glass, clean plastics, concrete/brick (can be crushed & reused), drywall (recyclable gypsum), tin cans, bottles
- **non-recyclable**: treated/contaminated wood, mixed debris that cannot be separated, asbestos-containing materials, heavily contaminated items, composite materials, styrofoam, certain plastics

**CRITICAL RULES:**
1. ONLY return empty materials if the image is clearly NOT waste at all (e.g. a selfie, a pet, a scenic landscape, a screenshot). If you can see ANY object that could plausibly be waste, recyclable, organic, or disposable material, classify it. When in doubt, classify — do NOT return empty.
   For truly non-waste images, return: {{"materials": [], "total_weight_estimate_lbs": 0, "classification_confidence": 0, "summary": "No waste materials detected in this image. Please take a photo of waste materials for classification."}}

2. Be precise with your classification. Base your percentages and weights on what you can actually see.
3. The "name" field MUST be one of: organic, recyclable, non-recyclable.
4. Percentages must sum to 100. BE REALISTIC with weight estimates based on PHASE 1 reference points.
5. You may omit a category if it's 0%.
6. Provide helpful, specific notes about what actual items you see in each category (e.g. "3 empty cardboard boxes (~0.5 lb), newspaper (~0.3 lb)" not just "paper products").
7. For low-quality or small images, still attempt classification with a lower confidence score.
8. **WEIGHT DOUBLE-CHECK**: After estimating, ask yourself: "Could I physically lift this amount?" If 5 lbs, yes. If 50 lbs, only if strong. If 500 lbs, NO.
{correction_examples}{weight_learning_examples}

Return ONLY valid JSON in this exact format (with REALISTIC weights):
{{
  "materials": [
    {{
      "name": "recyclable",
      "percentage": 55,
      "weight_estimate_lbs": 6.5,
      "recyclable": true,
      "notes": "2 aluminum cans (0.5 lb), 3 glass bottles (3 lb), flattened cardboard (3 lb)"
    }},
    {{
      "name": "organic",
      "percentage": 30,
      "weight_estimate_lbs": 35,
      "recyclable": true,
      "notes": "Food scraps, yard waste, untreated wood"
    }},
    {{
      "name": "non-recyclable",
      "percentage": 15,
      "weight_estimate_lbs": 18,
      "recyclable": false,
      "notes": "Styrofoam containers, mixed contaminated items"
    }}
  ],
  "total_weight_estimate_lbs": 118,
  "classification_confidence": 0.92,
  "summary": "Mostly recyclable metals and containers with some organic food waste."
}}"""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": image_base64,
                            }
                        },
                    ]
                }
            ],
        )

        response_text = response.text.strip()
        # Clean potential markdown code blocks
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            response_text = response_text.rsplit("```", 1)[0]

        analysis = json.loads(response_text)

        # Check if AI found nothing
        materials = analysis.get("materials", [])
        if not materials or analysis.get("classification_confidence", 0) == 0:
            return ScanResult(
                categories=[],
                total_weight_estimate_lbs=0,
                co2_saved_kg=0,
                recommended_centers=[],
                classification_confidence=0,
                timestamp=datetime.utcnow().isoformat(),
                summary=analysis.get("summary", "No waste materials detected. Please rescan with a clearer image of waste."),
                needs_rescan=True,
            )

        # Calculate CO2 savings
        total_co2 = 0
        for material in materials:
            name = material.get("name", "").lower()
            weight = material.get("weight_estimate_lbs", 0)
            factor = CO2_FACTORS.get(name, 0.05)
            material["co2_saved_kg"] = round(weight * factor, 2)
            total_co2 += material["co2_saved_kg"]

        # Find recommended recycling centers (use seed centers from both states)
        detected_categories = [m["name"].lower() for m in materials]
        all_seed_centers = []
        for state_centers in SEED_CENTERS.values():
            all_seed_centers.extend(state_centers)

        recommended = []
        for center in all_seed_centers:
            matching = [
                c for c in detected_categories if c in center["accepts"]
            ]
            if matching:
                center_info = {**center, "matching_categories": matching}
                if latitude and longitude:
                    dlat = abs(center["lat"] - latitude)
                    dlng = abs(center["lng"] - longitude)
                    center_info["distance_miles"] = round(
                        ((dlat ** 2 + dlng ** 2) ** 0.5) * 69, 1
                    )
                recommended.append(center_info)

        # Sort by distance if available
        if latitude and longitude:
            recommended.sort(key=lambda x: x.get("distance_miles", 9999))

        return ScanResult(
            categories=materials,
            total_weight_estimate_lbs=analysis.get("total_weight_estimate_lbs", 0),
            co2_saved_kg=round(total_co2, 2),
            recommended_centers=recommended[:3],
            classification_confidence=analysis.get("classification_confidence", 0.5),
            timestamp=datetime.utcnow().isoformat(),
            summary=analysis.get("summary", "Analysis complete."),
            needs_rescan=False,
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse AI response. Please try again.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/correction")
async def submit_correction(correction: CorrectionRequest):
    """Store a user correction to improve future AI classifications."""
    entry = {
        "original_categories": correction.original_categories,
        "corrected_categories": correction.corrected_categories,
        "image_description": correction.image_description,
        "timestamp": correction.timestamp or datetime.utcnow().isoformat(),
    }
    _save_correction(entry)
    return {"message": "Correction saved. Thank you for improving GreenLens AI!", "stored": True}


class SaveScanRequest(BaseModel):
    userId: str
    userName: str
    locationName: str
    city: str
    state: str
    categories: list[dict]
    totalWeightLbs: float
    co2SavedKg: float
    confidence: float
    summary: str
    imageUrl: Optional[str] = None
    routedToCenter: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    xpAwarded: Optional[float] = None


@app.post("/api/scan/save")
async def save_scan(scan: SaveScanRequest):
    """Save a completed scan to the Convex database."""
    if not CONVEX_URL:
        raise HTTPException(status_code=500, detail="Convex URL not configured")

    # Call Convex mutation via HTTP API
    mutation_url = f"{CONVEX_URL}/api/mutation"
    payload = {
        "path": "scans:recordScan",
        "args": {
            "userId": scan.userId,
            "userName": scan.userName,
            "locationName": scan.locationName,
            "city": scan.city,
            "state": scan.state,
            "categories": scan.categories,
            "totalWeightLbs": scan.totalWeightLbs,
            "co2SavedKg": scan.co2SavedKg,
            "confidence": scan.confidence,
            "summary": scan.summary,
            "imageUrl": scan.imageUrl,
            "routedToCenter": scan.routedToCenter,
            "latitude": scan.latitude,
            "longitude": scan.longitude,
            "xpAwarded": scan.xpAwarded,
        },
    }
    # Remove None values from args
    payload["args"] = {k: v for k, v in payload["args"].items() if v is not None}

    try:
        async with httpx.AsyncClient() as http:
            resp = await http.post(mutation_url, json=payload, timeout=10)
            if resp.status_code != 200:
                print(f"[CONVEX ERROR] {resp.status_code}: {resp.text}")
                raise HTTPException(status_code=502, detail=f"Failed to save to database: {resp.text}")
            return {"message": "Scan saved to database", "scanId": resp.json().get("value")}
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Database connection error: {str(e)}")


@app.get("/api/directions")
async def get_directions(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
):
    """Proxy Google Directions API to get route polyline."""
    if not GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Maps API key not configured")

    url = (
        f"https://maps.googleapis.com/maps/api/directions/json"
        f"?origin={origin_lat},{origin_lng}"
        f"&destination={dest_lat},{dest_lng}"
        f"&mode=driving"
        f"&key={GOOGLE_MAPS_API_KEY}"
    )
    async with httpx.AsyncClient() as http:
        resp = await http.get(url, timeout=10)
        data = resp.json()

    if data.get("status") != "OK" or not data.get("routes"):
        raise HTTPException(status_code=404, detail="No route found")

    route = data["routes"][0]
    leg = route["legs"][0]
    return {
        "polyline": route["overview_polyline"]["points"],
        "distance": leg["distance"]["text"],
        "duration": leg["duration"]["text"],
        "steps": [
            {
                "instruction": step.get("html_instructions", ""),
                "distance": step["distance"]["text"],
                "duration": step["duration"]["text"],
            }
            for step in leg["steps"]
        ],
    }


@app.get("/api/centers")
async def get_recycling_centers(
    category: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
):
    """Get recycling centers from API + scraper, optionally filtered by state/category/city."""
    target_state = state or "Georgia"
    try:
        all_centers = await scrape_centers(target_state)
    except Exception:
        # If scraper completely fails, fall back to seed data for the requested state
        all_centers = list(SEED_CENTERS.get(target_state, []))

    results = all_centers
    if category:
        results = [c for c in results if category.lower() in c["accepts"]]
    if city:
        results = [c for c in results if c["city"].lower() == city.lower()]
    return {"centers": results, "count": len(results), "state": target_state}


@app.post("/api/centers/refresh")
async def refresh_centers(state: Optional[str] = None):
    """Invalidate the centers cache so the next request re-scrapes."""
    invalidate_cache()
    target_state = state or "Georgia"
    centers = await scrape_centers(target_state)
    return {"message": "Cache refreshed", "count": len(centers), "state": target_state}


@app.get("/api/co2-factors")
async def get_co2_factors():
    """Get CO2 savings factors and methodology for each waste category."""
    return {
        "factors": CO2_FACTORS,
        "methodology": {
            "source": "EPA WARM Model v16 (Waste Reduction Model)",
            "description": "CO₂ savings are calculated by comparing the emissions from recycling/composting vs. landfilling community waste.",
            "categories": {
                "recyclable": {
                    "factor_kg_per_lb": 1.02,
                    "explanation": "Weighted average of metals, plastics, glass, and concrete diversion. Recycling these materials avoids energy-intensive virgin material extraction.",
                },
                "organic": {
                    "factor_kg_per_lb": 0.34,
                    "explanation": "Composting wood, cardboard, and bio-based debris prevents methane emissions that would occur from anaerobic decomposition in landfills.",
                },
                "non-recyclable": {
                    "factor_kg_per_lb": 0.05,
                    "explanation": "Minimal credit for proper disposal or waste-to-energy processing versus open landfilling.",
                },
            },
            "weight_estimation": "Total weight is estimated by Gemini's vision model using visual scale cues such as known object sizes, container volumes, and comparison references in the image.",
        },
    }
