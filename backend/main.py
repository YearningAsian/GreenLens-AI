"""
GreenLens AI - FastAPI Backend
Construction waste classification: Organic / Recyclable / Non-Recyclable
Powered by Google Gemini 2.5 Flash
"""

import os
import json
import base64
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai

from scraper import scrape_centers, invalidate_cache, SEED_CENTERS

load_dotenv(override=True)

app = FastAPI(
    title="GreenLens AI API",
    description="Construction waste classification powered by Gemini 2.5 Flash — National Non-Profit · Georgia & Tennessee Pilots",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ── CO₂ Methodology ──────────────────────────────────────────────
# Factors are weighted averages derived from the EPA WARM Model
# (Waste Reduction Model) v16 for construction & demolition waste.
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
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
):
    """
    Classify construction debris into Organic / Recyclable / Non-Recyclable
    using Gemini 2.5 Flash vision, then estimate weight & CO₂ savings.
    """
    try:
        image_data = await image.read()
        image_base64 = base64.b64encode(image_data).decode("utf-8")

        mime_type = image.content_type or "image/jpeg"

        prompt = """You are an expert in construction waste classification. Analyze this image and classify ALL visible waste into exactly three categories: organic, recyclable, or non-recyclable.

Guidelines:
- **organic**: wood, yard waste, untreated lumber, paper, cardboard, food waste, plant matter, soil
- **recyclable**: metals (steel, aluminum, copper), glass, clean plastics, concrete/brick (can be crushed & reused), drywall (recyclable gypsum)
- **non-recyclable**: treated/contaminated wood, mixed debris that cannot be separated, asbestos-containing materials, heavily contaminated items, composite materials

Return ONLY valid JSON in this exact format:
{
  "materials": [
    {
      "name": "recyclable",
      "percentage": 55,
      "weight_estimate_lbs": 65,
      "recyclable": true,
      "notes": "Steel beams, aluminum siding, clean concrete chunks"
    },
    {
      "name": "organic",
      "percentage": 30,
      "weight_estimate_lbs": 35,
      "recyclable": true,
      "notes": "Untreated lumber, cardboard packaging"
    },
    {
      "name": "non-recyclable",
      "percentage": 15,
      "weight_estimate_lbs": 18,
      "recyclable": false,
      "notes": "Mixed contaminated debris"
    }
  ],
  "total_weight_estimate_lbs": 118,
  "classification_confidence": 0.92,
  "summary": "Mostly recyclable metals and concrete with some organic wood waste."
}

The "name" field MUST be one of: organic, recyclable, non-recyclable.
Percentages must sum to 100. Be realistic with weight estimates based on visual assessment.
You may omit a category if it's 0%. Provide helpful notes about what's in each category."""

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

        # Calculate CO2 savings
        total_co2 = 0
        for material in analysis.get("materials", []):
            name = material.get("name", "").lower()
            weight = material.get("weight_estimate_lbs", 0)
            factor = CO2_FACTORS.get(name, 0.05)
            material["co2_saved_kg"] = round(weight * factor, 2)
            total_co2 += material["co2_saved_kg"]

        # Find recommended recycling centers (use seed centers from both states)
        detected_categories = [m["name"].lower() for m in analysis.get("materials", [])]
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
            categories=analysis.get("materials", []),
            total_weight_estimate_lbs=analysis.get("total_weight_estimate_lbs", 0),
            co2_saved_kg=round(total_co2, 2),
            recommended_centers=recommended[:3],
            classification_confidence=analysis.get("classification_confidence", 0.5),
            timestamp=datetime.utcnow().isoformat(),
            summary=analysis.get("summary", "Analysis complete."),
        )

    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse AI response. Please try again.",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
            "description": "CO₂ savings are calculated by comparing the emissions from recycling/composting vs. landfilling construction & demolition waste.",
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
