"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

// ── CO₂ Factors (EPA WARM Model v16) ────────────────────────────
const CO2_FACTORS: Record<string, number> = {
  recyclable: 1.02,
  organic: 0.34,
  "non-recyclable": 0.05,
};

// ── Seed centers for recommendations ────────────────────────────
const SEED_CENTERS = [
  {
    id: "atlanta-recycling",
    name: "Atlanta Recycling Center",
    city: "Atlanta",
    state: "Georgia",
    address: "1570 Southland Circle NW, Atlanta, GA 30318",
    phone: "(404) 792-7600",
    accepts: ["recyclable", "organic"],
    lat: 33.77,
    lng: -84.44,
  },
  {
    id: "savannah-recycling",
    name: "Savannah Recycling Center",
    city: "Savannah",
    state: "Georgia",
    address: "1320 E Gwinnett St, Savannah, GA 31404",
    phone: "(912) 651-6870",
    accepts: ["recyclable", "organic", "non-recyclable"],
    lat: 32.06,
    lng: -81.08,
  },
  {
    id: "macon-recycling",
    name: "Macon Recycling Center",
    city: "Macon",
    state: "Georgia",
    address: "3075 Hawkinsville Rd, Macon, GA 31206",
    phone: "(478) 751-7450",
    accepts: ["recyclable"],
    lat: 32.81,
    lng: -83.66,
  },
  {
    id: "nashville-recycling",
    name: "Nashville Recycling Center",
    city: "Nashville",
    state: "Tennessee",
    address: "1019 Omohundro Pl, Nashville, TN 37210",
    phone: "(615) 862-8750",
    accepts: ["recyclable", "organic"],
    lat: 36.15,
    lng: -86.76,
  },
  {
    id: "memphis-recycling",
    name: "Memphis Recycling Center",
    city: "Memphis",
    state: "Tennessee",
    address: "1770 Pierson Ave, Memphis, TN 38104",
    phone: "(901) 636-6750",
    accepts: ["recyclable", "organic"],
    lat: 35.14,
    lng: -90.02,
  },
  {
    id: "knoxville-recycling",
    name: "Knoxville Recycling Center",
    city: "Knoxville",
    state: "Tennessee",
    address: "1033 Elm St, Knoxville, TN 37921",
    phone: "(865) 215-4311",
    accepts: ["recyclable"],
    lat: 35.97,
    lng: -83.94,
  },
];

export const classifyWaste = action({
  args: {
    imageBase64: v.string(),
    mimeType: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured in Convex environment");
    }

    const mime = args.mimeType || "image/jpeg";

    const prompt = `You are an expert in waste classification. Analyze this image and classify ALL visible waste or disposable materials into exactly three categories: organic, recyclable, or non-recyclable.

Guidelines:
- **organic**: food items, produce, vegetables, fruits, meat, bread, wood, yard waste, untreated lumber, paper, cardboard, food waste, plant matter, soil, leaves, grass clippings, coffee grounds, eggshells
- **recyclable**: metals (steel, aluminum, copper), glass, clean plastics, concrete/brick (can be crushed & reused), drywall (recyclable gypsum), tin cans, bottles, clean packaging
- **non-recyclable**: treated/contaminated wood, mixed debris that cannot be separated, asbestos-containing materials, heavily contaminated items, composite materials, styrofoam, certain plastics, diapers, chip bags

CRITICAL RULES:
1. CLASSIFY GENEROUSLY: If you see ANY object that could be waste, recyclable, organic, or disposable — classify it. Food items like vegetables, fruits, meat, etc. are ORGANIC waste. Packaging around products is RECYCLABLE. Only return empty materials for clearly non-waste images (selfies, pets, landscapes, screenshots).
   For truly non-waste images, return: {"materials": [], "total_weight_estimate_lbs": 0, "classification_confidence": 0, "summary": "No waste materials detected in this image. Please take a photo of waste materials for classification."}

2. Be precise with your classification. Base your percentages and weights on what you can actually see.
3. The "name" field MUST be one of: organic, recyclable, non-recyclable.
4. Percentages must sum to 100. Be realistic with weight estimates based on visual assessment.
5. You may omit a category if it's 0%.
6. Provide helpful, specific notes about what actual items you see in each category (e.g. "celery stalks, lettuce leaves" not just "vegetables").
7. For low-quality or small images, still attempt classification with a lower confidence score.
8. Individual food items (even fresh produce being cut) should be classified as organic waste.

Return ONLY valid JSON in this exact format:
{
  "materials": [
    {
      "name": "recyclable",
      "percentage": 55,
      "weight_estimate_lbs": 65,
      "notes": "Aluminum cans, glass bottles, cardboard boxes"
    },
    {
      "name": "organic",
      "percentage": 30,
      "weight_estimate_lbs": 35,
      "notes": "Food scraps, yard waste, untreated wood"
    },
    {
      "name": "non-recyclable",
      "percentage": 15,
      "weight_estimate_lbs": 18,
      "notes": "Styrofoam containers, mixed contaminated items"
    }
  ],
  "total_weight_estimate_lbs": 118,
  "classification_confidence": 0.92,
  "summary": "Mostly recyclable metals and containers with some organic food waste."
}`;

    // Call Gemini REST API directly — try multiple models for resilience
    const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
    let response: Response | null = null;
    let lastError = "";

    for (const model of models) {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: mime,
                      data: args.imageBase64,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
            },
          }),
        });

        if (response.ok) break; // success — stop trying

        const errText = await response.text();
        lastError = `${model}: ${response.status} - ${errText.slice(0, 200)}`;
        console.log(`[AI] Model ${model} failed (${response.status}), trying next...`);
        response = null; // mark as failed so we try next
      } catch (e: any) {
        lastError = `${model}: ${e.message}`;
        console.log(`[AI] Model ${model} threw: ${e.message}`);
      }
    }

    if (!response?.ok) {
      throw new Error(`All Gemini models failed. Last error: ${lastError}`);
    }

    const geminiResult = await response.json();

    // Extract text from response
    const candidates = geminiResult.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from Gemini AI");
    }

    let responseText = candidates[0].content.parts[0].text.trim();

    // Clean markdown code blocks
    if (responseText.startsWith("```")) {
      responseText = responseText.split("\n").slice(1).join("\n");
      responseText = responseText.replace(/```\s*$/, "");
    }

    const analysis = JSON.parse(responseText);

    // Check if AI found nothing
    const materials = analysis.materials || [];
    if (materials.length === 0 || analysis.classification_confidence === 0) {
      return {
        categories: [],
        total_weight_estimate_lbs: 0,
        co2_saved_kg: 0,
        recommended_centers: [],
        classification_confidence: 0,
        timestamp: new Date().toISOString(),
        summary:
          analysis.summary ||
          "No waste materials detected. Please rescan with a clearer image of waste.",
        needs_rescan: true,
      };
    }

    // Calculate CO2 savings
    let totalCo2 = 0;
    for (const mat of materials) {
      const name = (mat.name || "").toLowerCase();
      const weight = mat.weight_estimate_lbs || 0;
      const factor = CO2_FACTORS[name] ?? 0.05;
      mat.co2_saved_kg = Math.round(weight * factor * 100) / 100;
      totalCo2 += mat.co2_saved_kg;
    }

    // Find recommended centers
    const detectedCategories = new Set(
      materials.map((m: { name: string }) => m.name.toLowerCase())
    );
    let recommended = SEED_CENTERS.filter((c) =>
      c.accepts.some((a) => detectedCategories.has(a))
    ).map((c) => ({
      ...c,
      matching_categories: c.accepts.filter((a) =>
        detectedCategories.has(a)
      ),
      distance_miles: undefined as number | undefined,
    }));

    // Sort by distance if coordinates provided
    if (args.latitude && args.longitude) {
      recommended = recommended.map((c) => ({
        ...c,
        distance_miles: Math.round(
          Math.sqrt(
            Math.pow((c.lat - args.latitude!) * 69, 2) +
              Math.pow((c.lng - args.longitude!) * 54.6, 2)
          ) * 10
        ) / 10,
      }));
      recommended.sort((a, b) => (a.distance_miles ?? 9999) - (b.distance_miles ?? 9999));
    }

    return {
      categories: materials,
      total_weight_estimate_lbs: analysis.total_weight_estimate_lbs || 0,
      co2_saved_kg: Math.round(totalCo2 * 100) / 100,
      recommended_centers: recommended.slice(0, 3),
      classification_confidence: analysis.classification_confidence || 0.5,
      timestamp: new Date().toISOString(),
      summary: analysis.summary || "Analysis complete.",
      needs_rescan: false,
    };
  },
});
