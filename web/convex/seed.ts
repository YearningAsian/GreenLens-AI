import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Seed demo data into the database
export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already seeded
    const existing = await ctx.db.query("scans").take(1);
    if (existing.length > 0) return "Data already seeded";

    /* ── State + city config ── */
    const stateData = [
      {
        state: "Georgia",
        cities: ["Atlanta", "Savannah", "Augusta", "Macon", "Athens", "Columbus"],
        regionFn: (city: string) =>
          city === "Atlanta" ? "Metro Atlanta"
          : city === "Savannah" ? "Coastal"
          : city === "Columbus" ? "West Georgia"
          : "Central Georgia",
        latBase: 32, latRange: 2,
        lngBase: -84, lngRange: 3,
      },
      {
        state: "Tennessee",
        cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"],
        regionFn: (city: string) =>
          city === "Nashville" ? "Middle Tennessee"
          : city === "Memphis" ? "West Tennessee"
          : city === "Knoxville" ? "East Tennessee"
          : city === "Chattanooga" ? "East Tennessee"
          : "Middle Tennessee",
        latBase: 35, latRange: 1.5,
        lngBase: -87, lngRange: 3,
      },
    ];

    const categoryTemplates = [
      [
        { name: "recyclable", percentage: 55, weight_estimate_lbs: 120, co2_saved_kg: 122.4, notes: "Steel beams, aluminum siding, concrete chunks" },
        { name: "organic", percentage: 30, weight_estimate_lbs: 65, co2_saved_kg: 22.1, notes: "Untreated lumber, cardboard" },
        { name: "non-recyclable", percentage: 15, weight_estimate_lbs: 33, co2_saved_kg: 1.65, notes: "Mixed contaminated debris" },
      ],
      [
        { name: "recyclable", percentage: 40, weight_estimate_lbs: 200, co2_saved_kg: 204.0, notes: "Concrete, rebar, glass" },
        { name: "organic", percentage: 45, weight_estimate_lbs: 225, co2_saved_kg: 76.5, notes: "Wood framing, plywood, soil" },
        { name: "non-recyclable", percentage: 15, weight_estimate_lbs: 75, co2_saved_kg: 3.75, notes: "Treated lumber, insulation" },
      ],
      [
        { name: "recyclable", percentage: 70, weight_estimate_lbs: 350, co2_saved_kg: 357.0, notes: "Metals, plastics, drywall" },
        { name: "organic", percentage: 20, weight_estimate_lbs: 100, co2_saved_kg: 34.0, notes: "Cardboard, paper, wood" },
        { name: "non-recyclable", percentage: 10, weight_estimate_lbs: 50, co2_saved_kg: 2.5, notes: "Composites" },
      ],
    ];

    /* ── Georgia job sites ── */
    const gaJobSiteNames = [
      "Midtown Tower Phase 2", "Savannah River Plaza", "Augusta Medical Center",
      "Macon Heritage Park", "Athens Innovation Hub", "Buckhead Residences",
      "Port of Savannah Expansion", "Augusta Cyber Center", "Macon Convention Hall",
      "Atlanta BeltLine Extension",
    ];

    /* ── Tennessee job sites ── */
    const tnJobSiteNames = [
      "Nashville Music Row Towers", "Memphis Riverfront Lofts", "Knoxville Tech Campus",
      "Chattanooga Riverwalk Plaza", "Clarksville Gateway Center", "Nashville SoBro District",
      "Memphis Medical Quarter", "Knoxville Innovation Hub", "Chattanooga Southside Development",
      "Clarksville Industrial Park",
    ];

    const allJobSiteNames = [...gaJobSiteNames, ...tnJobSiteNames];

    const userNames = [
      "Marcus Johnson", "Sarah Chen", "David Williams", "Maria Garcia",
      "James Brown", "Emily Davis", "Robert Wilson", "Ana Martinez",
      "Chris Taylor", "Lisa Anderson",
    ];

    // Create job sites for each state
    let jobSiteIndex = 0;
    for (const sd of stateData) {
      const siteNames = sd.state === "Georgia" ? gaJobSiteNames : tnJobSiteNames;
      for (let i = 0; i < siteNames.length; i++) {
        const city = sd.cities[i % sd.cities.length];
        await ctx.db.insert("jobSites", {
          name: siteNames[i],
          city,
          state: sd.state,
          region: sd.regionFn(city),
          latitude: sd.latBase + Math.random() * sd.latRange,
          longitude: sd.lngBase + Math.random() * sd.lngRange,
          managerId: `mgr-${jobSiteIndex}`,
          totalScans: Math.floor(Math.random() * 150) + 20,
          totalWeightDiverted: Math.floor(Math.random() * 50000) + 5000,
          totalCo2Saved: Math.floor(Math.random() * 10000) + 1000,
          greenScore: Math.floor(Math.random() * 40) + 60,
        });
        jobSiteIndex++;
      }
    }

    // Create users
    for (let i = 0; i < userNames.length; i++) {
      const badges = [];
      if (Math.random() > 0.5) badges.push("first-scan");
      if (Math.random() > 0.6) badges.push("100-lbs");
      if (Math.random() > 0.7) badges.push("zero-waste-week");
      if (Math.random() > 0.8) badges.push("eco-champion");

      await ctx.db.insert("users", {
        name: userNames[i],
        email: `${userNames[i].toLowerCase().replace(" ", ".")}@greenlens.org`,
        role: i < 2 ? "executive" : i < 5 ? "supervisor" : "worker",
        jobSiteId: `site-${i % allJobSiteNames.length}`,
        totalScans: Math.floor(Math.random() * 80) + 5,
        totalWeightDiverted: Math.floor(Math.random() * 5000) + 200,
        totalCo2Saved: Math.floor(Math.random() * 2000) + 100,
        badges,
        streakDays: Math.floor(Math.random() * 30),
      });
    }

    // Create scan records for each state
    let scanIndex = 0;
    for (const sd of stateData) {
      const siteNames = sd.state === "Georgia" ? gaJobSiteNames : tnJobSiteNames;
      const scanCount = sd.state === "Georgia" ? 60 : 50;

      for (let i = 0; i < scanCount; i++) {
        const cityIndex = i % sd.cities.length;
        const city = sd.cities[cityIndex];
        const template = categoryTemplates[i % categoryTemplates.length];
        const scale = 0.5 + Math.random();

        const categories = template.map((cat) => ({
          ...cat,
          weight_estimate_lbs: Math.round(cat.weight_estimate_lbs * scale),
          co2_saved_kg: Math.round(cat.co2_saved_kg * scale * 100) / 100,
        }));

        const totalWeight = categories.reduce((s, c) => s + c.weight_estimate_lbs, 0);
        const totalCo2 = categories.reduce((s, c) => s + c.co2_saved_kg, 0);

        await ctx.db.insert("scans", {
          userId: `user-${scanIndex % userNames.length}`,
          userName: userNames[scanIndex % userNames.length],
          jobSiteId: `site-${scanIndex % siteNames.length}`,
          jobSiteName: siteNames[scanIndex % siteNames.length],
          city,
          state: sd.state,
          categories,
          totalWeightLbs: Math.round(totalWeight),
          co2SavedKg: Math.round(totalCo2 * 100) / 100,
          confidence: 0.85 + Math.random() * 0.14,
          summary: `Construction debris at ${siteNames[scanIndex % siteNames.length]} — classified as recyclable/organic/non-recyclable`,
        });
        scanIndex++;
      }
    }

    return "Demo data seeded successfully (Georgia + Tennessee)";
  },
});
