import { mutation } from "./_generated/server";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SEED: 50 users, ~300 scans, all tables populated
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Wipe every table so seed can re-run cleanly. */
export const clearAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "users", "scans", "badges", "userBadges", "corrections",
      "dailyTaskCompletions", "recyclingCenters", "communityGoals",
      "notifications", "activityFeed", "leaderboard", "reports",
    ] as const;
    let total = 0;
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) {
        await ctx.db.delete(doc._id);
      }
      total += docs.length;
    }
    return { deleted: total };
  },
});

export const seedDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").take(1);
    if (existing.length > 0) return "Data already seeded";

    const now = new Date();
    const isoNow = now.toISOString();
    const today = isoNow.slice(0, 10);

    // ── CITY COORDINATES (real centres for heatmap clustering) ──
    const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
      Atlanta:     { lat: 33.749,  lng: -84.388 },
      Augusta:     { lat: 33.474,  lng: -81.975 },
      Columbus:    { lat: 32.461,  lng: -84.988 },
      Macon:       { lat: 32.841,  lng: -83.632 },
      Savannah:    { lat: 32.081,  lng: -81.091 },
      Athens:      { lat: 33.961,  lng: -83.378 },
      Nashville:   { lat: 36.163,  lng: -86.781 },
      Memphis:     { lat: 35.150,  lng: -90.049 },
      Knoxville:   { lat: 35.961,  lng: -83.921 },
      Chattanooga: { lat: 35.046,  lng: -85.309 },
      Clarksville: { lat: 36.530,  lng: -87.359 },
    };

    // ── STATE CONFIG ──
    const stateConfig = [
      { state: "Georgia", cities: ["Atlanta", "Savannah", "Augusta", "Macon", "Athens", "Columbus"], latBase: 32, latRange: 2, lngBase: -84, lngRange: 3 },
      { state: "Tennessee", cities: ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville"], latBase: 35, latRange: 1.5, lngBase: -87, lngRange: 3 },
    ];

    const gaLocations = [
      "Midtown Cleanup", "Savannah Riverfront", "Augusta Community Center",
      "Macon Heritage Park", "Athens Innovation Hub", "Buckhead Neighborhood",
      "Port of Savannah Area", "Augusta Downtown", "Macon Convention Area",
      "BeltLine Trail Corridor",
    ];

    const tnLocations = [
      "Music Row District", "Memphis Riverfront", "Knoxville Tech District",
      "Chattanooga Riverwalk", "Clarksville Gateway", "SoBro Nashville",
      "Memphis Medical Area", "Knoxville Innovation Zone", "Chattanooga Southside",
      "Clarksville Industrial Area",
    ];

    // 6 category templates for variety (small → large)
    const categoryTemplates = [
      // Small residential
      [
        { name: "recyclable", percentage: 50, weight_estimate_lbs: 15, co2_saved_kg: 15.3, notes: "Aluminum cans, glass bottles, cardboard" },
        { name: "organic", percentage: 35, weight_estimate_lbs: 10, co2_saved_kg: 3.4, notes: "Food scraps, yard waste" },
        { name: "non-recyclable", percentage: 15, weight_estimate_lbs: 5, co2_saved_kg: 0.25, notes: "Styrofoam, plastic film" },
      ],
      // Medium community cleanup
      [
        { name: "recyclable", percentage: 55, weight_estimate_lbs: 120, co2_saved_kg: 122.4, notes: "Steel cans, aluminum siding" },
        { name: "organic", percentage: 30, weight_estimate_lbs: 65, co2_saved_kg: 22.1, notes: "Untreated lumber, cardboard" },
        { name: "non-recyclable", percentage: 15, weight_estimate_lbs: 33, co2_saved_kg: 1.65, notes: "Mixed contaminated debris" },
      ],
      // Large construction haul
      [
        { name: "recyclable", percentage: 40, weight_estimate_lbs: 200, co2_saved_kg: 204.0, notes: "Concrete, rebar, glass" },
        { name: "organic", percentage: 45, weight_estimate_lbs: 225, co2_saved_kg: 76.5, notes: "Wood framing, plywood" },
        { name: "non-recyclable", percentage: 15, weight_estimate_lbs: 75, co2_saved_kg: 3.75, notes: "Treated lumber, insulation" },
      ],
      // Large commercial
      [
        { name: "recyclable", percentage: 70, weight_estimate_lbs: 350, co2_saved_kg: 357.0, notes: "Metals, plastics, drywall" },
        { name: "organic", percentage: 20, weight_estimate_lbs: 100, co2_saved_kg: 34.0, notes: "Cardboard, paper, wood" },
        { name: "non-recyclable", percentage: 10, weight_estimate_lbs: 50, co2_saved_kg: 2.5, notes: "Composites" },
      ],
      // Electronics / e-waste
      [
        { name: "recyclable", percentage: 75, weight_estimate_lbs: 30, co2_saved_kg: 36.0, notes: "Circuit boards, copper wire" },
        { name: "non-recyclable", percentage: 25, weight_estimate_lbs: 10, co2_saved_kg: 0.5, notes: "Plastic casings, batteries" },
      ],
      // Yard waste & composting
      [
        { name: "organic", percentage: 85, weight_estimate_lbs: 180, co2_saved_kg: 61.2, notes: "Leaves, branches, grass" },
        { name: "recyclable", percentage: 10, weight_estimate_lbs: 20, co2_saved_kg: 20.4, notes: "Garden pots, wire" },
        { name: "non-recyclable", percentage: 5, weight_estimate_lbs: 10, co2_saved_kg: 0.5, notes: "Plastic bags, treated wood" },
      ],
    ];

    const summaries = [
      "Mixed waste materials classified — includes recyclables and organic matter",
      "Construction debris sorted — significant recyclable component identified",
      "Residential waste scan — cardboard and plastic predominant",
      "Community cleanup haul — mixed materials requiring separation",
      "Commercial waste assessment — high recyclable content detected",
      "Yard waste and landscaping debris — primarily organic material",
      "E-waste collection — electronics components sorted for recycling",
      "Post-renovation waste — drywall, lumber, and fixtures classified",
    ];

    // ──────────────────────────────────────────────────────────────
    // 1. USERS (50 total — 30 GA + 20 TN)
    //    scanCount varies: power(15-22), active(8-14), moderate(4-7), casual(1-3), new(0)
    // ──────────────────────────────────────────────────────────────
    const usersToCreate: Array<{
      name: string; email: string; role: "volunteer" | "hauler" | "liaison";
      city: string; state: string; scanCount: number; streak: number; xp: number; level: number;
      profileImageUrl?: string;
    }> = [
      // ── Georgia (30) ──
      // Atlanta (6)
      { name: "Marcus Johnson", email: "marcus@greenlens.org", role: "volunteer", city: "Atlanta", state: "Georgia", scanCount: 22, streak: 45, xp: 4820, level: 9, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=MarcusJ&gender=male&backgroundColor=b6e3f4&hair=short01,short02,short03&facialHair=beardMedium,beardLight" },
      { name: "Emily Davis", email: "emily.d@greenlens.org", role: "liaison", city: "Atlanta", state: "Georgia", scanCount: 14, streak: 22, xp: 3320, level: 7, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emilyd&gender=female" },
      { name: "Jessica Lee", email: "jessica@greenlens.org", role: "hauler", city: "Atlanta", state: "Georgia", scanCount: 6, streak: 6, xp: 850, level: 4, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jessicalee&gender=female" },
      { name: "Olivia Wright", email: "olivia@greenlens.org", role: "volunteer", city: "Atlanta", state: "Georgia", scanCount: 5, streak: 8, xp: 680, level: 3 },
      { name: "Nathan Cooper", email: "nathan@greenlens.org", role: "hauler", city: "Atlanta", state: "Georgia", scanCount: 2, streak: 2, xp: 120, level: 2 },
      { name: "Brianna Foster", email: "brianna@greenlens.org", role: "volunteer", city: "Atlanta", state: "Georgia", scanCount: 1, streak: 1, xp: 60, level: 1 },
      // Savannah (5)
      { name: "Sarah Chen", email: "sarah@greenlens.org", role: "hauler", city: "Savannah", state: "Georgia", scanCount: 19, streak: 32, xp: 4210, level: 8, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarahchen&gender=female" },
      { name: "Robert Wilson", email: "robert@greenlens.org", role: "hauler", city: "Savannah", state: "Georgia", scanCount: 7, streak: 12, xp: 1900, level: 6, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=robertwilson&gender=male" },
      { name: "Maya Robinson", email: "maya@greenlens.org", role: "volunteer", city: "Savannah", state: "Georgia", scanCount: 5, streak: 7, xp: 600, level: 3 },
      { name: "Ethan Brooks", email: "ethan.b@greenlens.org", role: "liaison", city: "Savannah", state: "Georgia", scanCount: 4, streak: 5, xp: 450, level: 2 },
      { name: "Chloe Adams", email: "chloe@greenlens.org", role: "volunteer", city: "Savannah", state: "Georgia", scanCount: 0, streak: 1, xp: 10, level: 1 },
      // Augusta (5)
      { name: "David Williams", email: "david@greenlens.org", role: "volunteer", city: "Augusta", state: "Georgia", scanCount: 12, streak: 28, xp: 3880, level: 8, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=davidwilliams&gender=male" },
      { name: "Rachel Green", email: "rachel@greenlens.org", role: "liaison", city: "Augusta", state: "Georgia", scanCount: 6, streak: 9, xp: 1100, level: 4 },
      { name: "Austin Pierce", email: "austin@greenlens.org", role: "hauler", city: "Augusta", state: "Georgia", scanCount: 2, streak: 3, xp: 160, level: 2 },
      { name: "Sophia Rivera", email: "sophia@greenlens.org", role: "volunteer", city: "Augusta", state: "Georgia", scanCount: 0, streak: 1, xp: 10, level: 1 },
      { name: "Sean Murphy", email: "sean@greenlens.org", role: "hauler", city: "Augusta", state: "Georgia", scanCount: 0, streak: 1, xp: 10, level: 1 },
      // Macon (5)
      { name: "Maria Garcia", email: "maria@greenlens.org", role: "hauler", city: "Macon", state: "Georgia", scanCount: 10, streak: 18, xp: 2950, level: 7, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=mariagarcia&gender=female" },
      { name: "Daniel Thompson", email: "daniel@greenlens.org", role: "volunteer", city: "Macon", state: "Georgia", scanCount: 5, streak: 4, xp: 500, level: 3 },
      { name: "Jasmine Howard", email: "jasmine@greenlens.org", role: "liaison", city: "Macon", state: "Georgia", scanCount: 4, streak: 6, xp: 380, level: 2 },
      { name: "Logan Reed", email: "logan@greenlens.org", role: "volunteer", city: "Macon", state: "Georgia", scanCount: 1, streak: 2, xp: 70, level: 1 },
      { name: "Amber Collins", email: "amber@greenlens.org", role: "hauler", city: "Macon", state: "Georgia", scanCount: 0, streak: 1, xp: 10, level: 1 },
      // Athens (5)
      { name: "James Brown", email: "james@greenlens.org", role: "volunteer", city: "Athens", state: "Georgia", scanCount: 9, streak: 15, xp: 2600, level: 7, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jamesbrown&gender=male" },
      { name: "Lisa Anderson", email: "lisa@greenlens.org", role: "volunteer", city: "Athens", state: "Georgia", scanCount: 6, streak: 3, xp: 250, level: 2 },
      { name: "Caleb Mitchell", email: "caleb@greenlens.org", role: "hauler", city: "Athens", state: "Georgia", scanCount: 3, streak: 4, xp: 200, level: 2 },
      { name: "Diana Torres", email: "diana@greenlens.org", role: "liaison", city: "Athens", state: "Georgia", scanCount: 0, streak: 1, xp: 10, level: 1 },
      { name: "Ryan Price", email: "ryan@greenlens.org", role: "volunteer", city: "Athens", state: "Georgia", scanCount: 0, streak: 1, xp: 10, level: 1 },
      // Columbus (4)
      { name: "Ana Martinez", email: "ana@greenlens.org", role: "liaison", city: "Columbus", state: "Georgia", scanCount: 8, streak: 10, xp: 1500, level: 5, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=anamartinez&gender=female" },
      { name: "Chris Taylor", email: "chris@greenlens.org", role: "volunteer", city: "Columbus", state: "Georgia", scanCount: 7, streak: 8, xp: 1100, level: 4, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=christaylor&gender=male" },
      { name: "Kayla Stewart", email: "kayla@greenlens.org", role: "hauler", city: "Columbus", state: "Georgia", scanCount: 2, streak: 3, xp: 140, level: 2 },
      { name: "Dominic Reyes", email: "dominic@greenlens.org", role: "volunteer", city: "Columbus", state: "Georgia", scanCount: 0, streak: 1, xp: 10, level: 1 },

      // ── Tennessee (20) ──
      // Nashville (4)
      { name: "Tyler Brooks", email: "tyler@greenlens.org", role: "volunteer", city: "Nashville", state: "Tennessee", scanCount: 20, streak: 38, xp: 4500, level: 9, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=tylerbrooks&gender=male" },
      { name: "Nina Patel", email: "nina@greenlens.org", role: "liaison", city: "Nashville", state: "Tennessee", scanCount: 9, streak: 11, xp: 1300, level: 5, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ninapatel&gender=female" },
      { name: "Liam Foster", email: "liam@greenlens.org", role: "volunteer", city: "Nashville", state: "Tennessee", scanCount: 5, streak: 7, xp: 550, level: 3 },
      { name: "Grace Kim", email: "grace@greenlens.org", role: "hauler", city: "Nashville", state: "Tennessee", scanCount: 2, streak: 3, xp: 130, level: 2 },
      // Memphis (4)
      { name: "Keisha Harmon", email: "keisha@greenlens.org", role: "hauler", city: "Memphis", state: "Tennessee", scanCount: 18, streak: 30, xp: 3900, level: 8, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=keishaharmon&gender=female" },
      { name: "Derek Nguyen", email: "derek@greenlens.org", role: "volunteer", city: "Memphis", state: "Tennessee", scanCount: 8, streak: 9, xp: 900, level: 4, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=dereknguyen&gender=male" },
      { name: "Aiden Scott", email: "aiden@greenlens.org", role: "liaison", city: "Memphis", state: "Tennessee", scanCount: 4, streak: 5, xp: 350, level: 2 },
      { name: "Mia Phillips", email: "mia@greenlens.org", role: "volunteer", city: "Memphis", state: "Tennessee", scanCount: 1, streak: 2, xp: 60, level: 1 },
      // Knoxville (4)
      { name: "Jordan Wells", email: "jordan@greenlens.org", role: "volunteer", city: "Knoxville", state: "Tennessee", scanCount: 17, streak: 25, xp: 3200, level: 7, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordanwells&gender=male" },
      { name: "Samira Jackson", email: "samira@greenlens.org", role: "hauler", city: "Knoxville", state: "Tennessee", scanCount: 10, streak: 7, xp: 600, level: 3, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=samirajackson&gender=female" },
      { name: "Owen Bennett", email: "owen@greenlens.org", role: "volunteer", city: "Knoxville", state: "Tennessee", scanCount: 6, streak: 6, xp: 520, level: 3 },
      { name: "Hannah Lee", email: "hannah@greenlens.org", role: "liaison", city: "Knoxville", state: "Tennessee", scanCount: 3, streak: 3, xp: 180, level: 2 },
      // Chattanooga (4)
      { name: "Aaliyah Scott", email: "aaliyah@greenlens.org", role: "liaison", city: "Chattanooga", state: "Tennessee", scanCount: 11, streak: 20, xp: 2700, level: 7, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=aaliyahscott&gender=female" },
      { name: "Marcus Reid", email: "marcus.r@greenlens.org", role: "volunteer", city: "Chattanooga", state: "Tennessee", scanCount: 5, streak: 8, xp: 650, level: 3, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcusreid&gender=male" },
      { name: "Taylor Bennett", email: "taylor@greenlens.org", role: "hauler", city: "Chattanooga", state: "Tennessee", scanCount: 1, streak: 2, xp: 55, level: 1 },
      { name: "Zoe Chang", email: "zoe@greenlens.org", role: "volunteer", city: "Chattanooga", state: "Tennessee", scanCount: 0, streak: 1, xp: 10, level: 1 },
      // Clarksville (4)
      { name: "Brandon Cole", email: "brandon@greenlens.org", role: "hauler", city: "Clarksville", state: "Tennessee", scanCount: 13, streak: 14, xp: 1800, level: 6, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=brandoncole&gender=male" },
      { name: "Elena Vasquez", email: "elena@greenlens.org", role: "volunteer", city: "Clarksville", state: "Tennessee", scanCount: 4, streak: 5, xp: 320, level: 2, profileImageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=elenavasquez&gender=female" },
      { name: "Jake Morrison", email: "jake@greenlens.org", role: "liaison", city: "Clarksville", state: "Tennessee", scanCount: 1, streak: 1, xp: 50, level: 1 },
      { name: "Piper Walsh", email: "piper@greenlens.org", role: "hauler", city: "Clarksville", state: "Tennessee", scanCount: 1, streak: 1, xp: 50, level: 1 },
    ];

    // ──────────────────────────────────────────────────────────────
    // 2. PRE-COMPUTE ALL SCANS (for consistent user stats + badges)
    // ──────────────────────────────────────────────────────────────
    interface ScanRecord {
      userId: string; userName: string; locationName: string; city: string; state: string;
      categories: Array<{ name: string; percentage: number; weight_estimate_lbs: number; co2_saved_kg: number; notes?: string }>;
      totalWeightLbs: number; co2SavedKg: number; confidence: number; summary: string;
      latitude: number; longitude: number; wasCorrected: boolean; xpAwarded: number; scannedAt: string;
    }

    const scanRecords: ScanRecord[] = [];
    const userTotals: Record<string, { scans: number; weight: number; co2: number }> = {};

    for (const u of usersToCreate) {
      userTotals[u.email] = { scans: 0, weight: 0, co2: 0 };
      if (u.scanCount === 0) continue;

      const locations = u.state === "Georgia" ? gaLocations : tnLocations;
      const sc = stateConfig.find((s) => s.state === u.state)!;

      // Spread dates: power users over 180d, active 120d, moderate 90d, casual 30d
      const spreadDays = u.scanCount >= 15 ? 180 : u.scanCount >= 8 ? 120 : u.scanCount >= 4 ? 90 : 30;

      for (let i = 0; i < u.scanCount; i++) {
        const template = categoryTemplates[i % categoryTemplates.length];
        const scale = 0.3 + Math.random() * 1.2;
        const categories = template.map((cat) => ({
          ...cat,
          weight_estimate_lbs: Math.round(cat.weight_estimate_lbs * scale),
          co2_saved_kg: Math.round(cat.co2_saved_kg * scale * 100) / 100,
        }));

        const totalWeight = categories.reduce((s, c) => s + c.weight_estimate_lbs, 0);
        const totalCo2 = categories.reduce((s, c) => s + c.co2_saved_kg, 0);
        const daysAgo = Math.floor(Math.random() * spreadDays);
        const scanDate = new Date(now.getTime() - daysAgo * 86400000);

        // 10% chance user scanned in a different city in their state
        let city = u.city;
        if (Math.random() < 0.1) {
          const opts = sc.cities.filter((c) => c !== u.city);
          city = opts[Math.floor(Math.random() * opts.length)] ?? u.city;
        }

        scanRecords.push({
          userId: u.email,
          userName: u.name,
          locationName: locations[i % locations.length],
          city,
          state: u.state,
          categories,
          totalWeightLbs: Math.round(totalWeight),
          co2SavedKg: Math.round(totalCo2 * 100) / 100,
          confidence: 0.78 + Math.random() * 0.21,
          summary: summaries[i % summaries.length],
          latitude: (CITY_COORDS[city]?.lat ?? sc.latBase + 1) + (Math.random() - 0.5) * 0.06,
          longitude: (CITY_COORDS[city]?.lng ?? sc.lngBase + 1.5) + (Math.random() - 0.5) * 0.06,
          wasCorrected: false,
          xpAwarded: 25,
          scannedAt: scanDate.toISOString(),
        });

        userTotals[u.email].scans++;
        userTotals[u.email].weight += Math.round(totalWeight);
        userTotals[u.email].co2 += Math.round(totalCo2 * 100) / 100;
      }
    }

    // ──────────────────────────────────────────────────────────────
    // 3. INSERT USERS (stats derived from actual scan data)
    // ──────────────────────────────────────────────────────────────
    for (let idx = 0; idx < usersToCreate.length; idx++) {
      const u = usersToCreate[idx];
      const t = userTotals[u.email];
      // Roughly half opt into privacy (alternating pattern with some variation)
      const hasPrivacy = (idx % 2 === 0) || (idx % 7 === 0);
      await ctx.db.insert("users", {
        name: u.name,
        email: u.email,
        passwordHash: "pbkdf2_sha256$password123",
        profileImageUrl: u.profileImageUrl,
        role: u.role,
        city: u.city,
        state: u.state,
        xp: u.xp,
        level: u.level,
        streakDays: u.streak,
        lastActiveDate: today,
        totalScans: t.scans,
        totalWeightDiverted: Math.round(t.weight * 100) / 100,
        totalCo2Saved: Math.round(t.co2 * 100) / 100,
        status: u.scanCount > 0 ? "active" : "inactive",
        joinedDate: "Oct 2025",
        leaderboardPrivacy: hasPrivacy,
      });
    }

    // ──────────────────────────────────────────────────────────────
    // 4. INSERT SCANS
    // ──────────────────────────────────────────────────────────────
    for (const scan of scanRecords) {
      await ctx.db.insert("scans", scan);
    }

    // ──────────────────────────────────────────────────────────────
    // 5. BADGES (12 badge definitions)
    // ──────────────────────────────────────────────────────────────
    const badgeDefs = [
      { badgeId: "first-scan", label: "First Scan", emoji: "🌱", description: "Completed your very first waste scan. Every green journey starts with a single step!", criteriaType: "scan_count" as const, criteriaValue: 1, xpReward: 50, sortOrder: 1 },
      { badgeId: "10-scans", label: "Getting Started", emoji: "📸", description: "Reached 10 total waste scans. You're building a habit!", criteriaType: "scan_count" as const, criteriaValue: 10, xpReward: 100, sortOrder: 2 },
      { badgeId: "50-scans", label: "Scanner Pro", emoji: "🔬", description: "50 scans completed! You have a trained eye for waste classification.", criteriaType: "scan_count" as const, criteriaValue: 50, xpReward: 200, sortOrder: 3 },
      { badgeId: "100-lbs", label: "100 lbs Club", emoji: "💪", description: "Diverted over 100 pounds of waste from landfills. That's real impact!", criteriaType: "weight_diverted" as const, criteriaValue: 100, xpReward: 75, sortOrder: 4 },
      { badgeId: "1000-lbs", label: "Half-Ton Hero", emoji: "🏗️", description: "Diverted 1,000+ pounds! You've kept a half ton out of landfills.", criteriaType: "weight_diverted" as const, criteriaValue: 1000, xpReward: 150, sortOrder: 5 },
      { badgeId: "ton-diverted", label: "Ton Diverted", emoji: "🎉", description: "Diverted a full ton (2,000 lbs) of waste from landfills.", criteriaType: "weight_diverted" as const, criteriaValue: 2000, xpReward: 500, sortOrder: 6 },
      { badgeId: "co2-saver", label: "Carbon Cutter", emoji: "☁️", description: "Saved over 500 kg of CO₂ emissions through waste diversion.", criteriaType: "co2_saved" as const, criteriaValue: 500, xpReward: 200, sortOrder: 7 },
      { badgeId: "week-streak", label: "7-Day Streak", emoji: "🔥", description: "Maintained a 7-day active scanning streak. Consistency is key!", criteriaType: "streak_days" as const, criteriaValue: 7, xpReward: 100, sortOrder: 8 },
      { badgeId: "month-streak", label: "30-Day Warrior", emoji: "⚡", description: "30 consecutive days of scanning. You're unstoppable!", criteriaType: "streak_days" as const, criteriaValue: 30, xpReward: 300, sortOrder: 9 },
      { badgeId: "eco-champion", label: "Eco Champion", emoji: "🌍", description: "Reached the top tier of sustainability impact in your community.", criteriaType: "level_reached" as const, criteriaValue: 8, xpReward: 250, sortOrder: 10 },
      { badgeId: "team-player", label: "Team Player", emoji: "🤝", description: "Scanned at 3+ different locations. Collaboration makes the difference.", criteriaType: "location_count" as const, criteriaValue: 3, xpReward: 100, sortOrder: 11 },
      { badgeId: "ai-trainer", label: "AI Trainer", emoji: "🤖", description: "Submitted 5+ corrections to help improve GreenLens AI accuracy.", criteriaType: "correction_count" as const, criteriaValue: 5, xpReward: 150, sortOrder: 12 },
    ];
    for (const badge of badgeDefs) {
      await ctx.db.insert("badges", badge);
    }

    // ──────────────────────────────────────────────────────────────
    // 6. USER BADGES (award based on ACTUAL scan totals)
    // ──────────────────────────────────────────────────────────────
    for (const u of usersToCreate) {
      const t = userTotals[u.email];
      const earnBadges: string[] = [];
      if (t.scans >= 1) earnBadges.push("first-scan");
      if (t.scans >= 10) earnBadges.push("10-scans");
      if (t.scans >= 50) earnBadges.push("50-scans");
      if (t.weight >= 100) earnBadges.push("100-lbs");
      if (t.weight >= 1000) earnBadges.push("1000-lbs");
      if (t.weight >= 2000) earnBadges.push("ton-diverted");
      if (t.co2 >= 500) earnBadges.push("co2-saver");
      if (u.streak >= 7) earnBadges.push("week-streak");
      if (u.streak >= 30) earnBadges.push("month-streak");
      if (u.level >= 8) earnBadges.push("eco-champion");

      for (const bid of earnBadges) {
        const daysAgo = Math.floor(Math.random() * 60);
        const d = new Date(now.getTime() - daysAgo * 86400000);
        await ctx.db.insert("userBadges", {
          userId: u.email,
          badgeId: bid,
          earnedAt: d.toISOString(),
        });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // 7. CORRECTIONS (8 sample corrections)
    // ──────────────────────────────────────────────────────────────
    const correctionUsers = ["marcus@greenlens.org", "sarah@greenlens.org", "tyler@greenlens.org", "keisha@greenlens.org"];
    for (let i = 0; i < 8; i++) {
      const user = correctionUsers[i % correctionUsers.length];
      await ctx.db.insert("corrections", {
        userId: user,
        originalCategories: [
          { name: "recyclable", percentage: 60, weight_estimate_lbs: 100, co2_saved_kg: 102, notes: "AI classified as metal" },
          { name: "non-recyclable", percentage: 40, weight_estimate_lbs: 65, co2_saved_kg: 3.25, notes: "Mixed debris" },
        ],
        correctedCategories: [
          { name: "recyclable", percentage: 45, weight_estimate_lbs: 75, co2_saved_kg: 76.5, notes: "Aluminum cans, glass" },
          { name: "organic", percentage: 30, weight_estimate_lbs: 50, co2_saved_kg: 17, notes: "Cardboard, untreated wood" },
          { name: "non-recyclable", percentage: 25, weight_estimate_lbs: 40, co2_saved_kg: 2, notes: "Contaminated plastic" },
        ],
        imageDescription: `Correction ${i + 1}: mixed waste pile near community center`,
        submittedAt: new Date(now.getTime() - i * 3 * 86400000).toISOString(),
      });
    }

    // ──────────────────────────────────────────────────────────────
    // 8. DAILY TASK COMPLETIONS (last 7 days for top 8 users)
    // ──────────────────────────────────────────────────────────────
    const taskIds = ["login", "scan", "impact", "center_visit", "correction"];
    const taskXp = [10, 25, 15, 10, 20];
    const topUsers = usersToCreate.filter((u) => u.scanCount >= 10).slice(0, 8);

    for (const user of topUsers) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(now.getTime() - day * 86400000);
        const dateStr = date.toISOString().slice(0, 10);
        const numTasks = 2 + Math.floor(Math.random() * 3);
        const shuffled = [...taskIds].sort(() => Math.random() - 0.5);
        for (let t = 0; t < numTasks; t++) {
          await ctx.db.insert("dailyTaskCompletions", {
            userId: user.email,
            date: dateStr,
            taskId: shuffled[t],
            xpAwarded: taskXp[taskIds.indexOf(shuffled[t])],
            completedAt: date.toISOString(),
          });
        }
      }
    }

    // ──────────────────────────────────────────────────────────────
    // 9. RECYCLING CENTERS (20 verified centers)
    // ──────────────────────────────────────────────────────────────
    const centers = [
      { centerId: "athens-recycling", name: "Athens-Clarke Recycling Center", city: "Athens", state: "Georgia", address: "725 Hancock Industrial Way, Athens, GA 30605", phone: "(706) 613-3512", accepts: ["recyclable", "organic"], lat: 33.9361, lng: -83.3271 },
      { centerId: "lbc-atlanta", name: "Lifecycle Building Center", city: "Atlanta", state: "Georgia", address: "649 Atlanta Ave SE, Atlanta, GA 30315", phone: "(404) 525-0455", accepts: ["recyclable", "organic"], lat: 33.7901, lng: -84.3637 },
      { centerId: "sa-recycling-atlanta", name: "SA Recycling – Atlanta", city: "Atlanta", state: "Georgia", address: "1577 Sylvan Rd SW, Atlanta, GA 30310", phone: "(404) 758-6606", accepts: ["recyclable"], lat: 33.7279, lng: -84.4107 },
      { centerId: "savannah-recycling", name: "Savannah Recycling Center", city: "Savannah", state: "Georgia", address: "1309 Wheaton St, Savannah, GA 31404", phone: "(912) 651-6579", accepts: ["recyclable", "organic"], lat: 32.0651, lng: -81.0877 },
      { centerId: "augusta-recycling", name: "Augusta Recycling Center", city: "Augusta", state: "Georgia", address: "2727 Doug Barnard Pkwy, Augusta, GA 30906", phone: "(706) 796-5025", accepts: ["recyclable"], lat: 33.4282, lng: -81.9968 },
      { centerId: "macon-recycling", name: "Macon Recycling Center", city: "Macon", state: "Georgia", address: "3075 Hawkinsville Rd, Macon, GA 31206", phone: "(478) 751-7450", accepts: ["recyclable", "organic"], lat: 32.8050, lng: -83.6457 },
      { centerId: "columbus-recycling", name: "Columbus Recycling Center", city: "Columbus", state: "Georgia", address: "800 Cusseta Rd, Columbus, GA 31903", phone: "(706) 653-4200", accepts: ["recyclable"], lat: 32.4410, lng: -84.9926 },
      { centerId: "atlanta-compost", name: "Atlanta Compost Facility", city: "Atlanta", state: "Georgia", address: "3000 Cleburne Ave, Atlanta, GA 30317", phone: "(404) 371-0002", accepts: ["organic"], lat: 33.7525, lng: -84.3287 },
      { centerId: "cobb-recycling", name: "Cobb County Recycling Center", city: "Atlanta", state: "Georgia", address: "1897 County Services Pkwy, Marietta, GA 30008", phone: "(770) 528-1135", accepts: ["recyclable", "organic"], lat: 33.8940, lng: -84.5400 },
      { centerId: "dekalb-recycling", name: "DeKalb County Recycling Center", city: "Atlanta", state: "Georgia", address: "3720 Leroy Scott Dr, Decatur, GA 30032", phone: "(404) 294-2900", accepts: ["recyclable"], lat: 33.7404, lng: -84.2896 },
      { centerId: "nashville-recycling", name: "Nashville Recycling Center", city: "Nashville", state: "Tennessee", address: "1019 Omohundro Pl, Nashville, TN 37210", phone: "(615) 862-8750", accepts: ["recyclable", "organic"], lat: 36.1460, lng: -86.7614 },
      { centerId: "memphis-recycling", name: "Memphis Recycling Center", city: "Memphis", state: "Tennessee", address: "1770 Pierson Ave, Memphis, TN 38104", phone: "(901) 636-6750", accepts: ["recyclable"], lat: 35.1340, lng: -89.9988 },
      { centerId: "knoxville-recycling", name: "Knoxville Recycling Center", city: "Knoxville", state: "Tennessee", address: "1033 Elm St, Knoxville, TN 37921", phone: "(865) 215-4311", accepts: ["recyclable", "organic"], lat: 35.9722, lng: -83.9380 },
      { centerId: "chattanooga-recycling", name: "Chattanooga Recycling Center", city: "Chattanooga", state: "Tennessee", address: "1250 Market St, Chattanooga, TN 37402", phone: "(423) 643-6311", accepts: ["recyclable"], lat: 35.0426, lng: -85.3079 },
      { centerId: "clarksville-recycling", name: "Clarksville Recycling Center", city: "Clarksville", state: "Tennessee", address: "1320 College St, Clarksville, TN 37040", phone: "(931) 645-7464", accepts: ["recyclable", "organic"], lat: 36.5347, lng: -87.3440 },
      { centerId: "nashville-compost", name: "Nashville Compost Facility", city: "Nashville", state: "Tennessee", address: "4720 Centennial Blvd, Nashville, TN 37209", phone: "(615) 880-1000", accepts: ["organic"], lat: 36.1590, lng: -86.8420 },
      { centerId: "memphis-metals", name: "Memphis Metal Recycling", city: "Memphis", state: "Tennessee", address: "2560 Chelsea Ave, Memphis, TN 38108", phone: "(901) 327-4100", accepts: ["recyclable"], lat: 35.1700, lng: -89.9600 },
      { centerId: "knox-earth", name: "Knox County Earth Recycling", city: "Knoxville", state: "Tennessee", address: "800 Callahan Dr, Knoxville, TN 37912", phone: "(865) 524-3900", accepts: ["recyclable", "organic"], lat: 35.9900, lng: -83.9200 },
      { centerId: "hamilton-recycling", name: "Hamilton County Recycling", city: "Chattanooga", state: "Tennessee", address: "6829 Collection Center Dr, Chattanooga, TN 37416", phone: "(423) 209-7800", accepts: ["recyclable"], lat: 35.0800, lng: -85.2500 },
      { centerId: "clarksville-compost", name: "Clarksville Compost Center", city: "Clarksville", state: "Tennessee", address: "1640 Kraft St, Clarksville, TN 37040", phone: "(931) 648-9730", accepts: ["organic"], lat: 36.5200, lng: -87.3200 },
    ];
    for (const c of centers) {
      await ctx.db.insert("recyclingCenters", {
        ...c,
        source: "verified",
        lastVerified: isoNow,
      });
    }

    // ──────────────────────────────────────────────────────────────
    // 10. COMMUNITY GOALS (6 goals)
    // ──────────────────────────────────────────────────────────────
    const goals = [
      { title: "Atlanta 50-Ton Challenge", description: "Divert 50 tons of waste in Metro Atlanta by end of Q1 2026", scope: "city" as const, city: "Atlanta", state: "Georgia", targetType: "weight_diverted" as const, targetValue: 100000, currentValue: 78500, startDate: "2025-10-01", endDate: "2026-03-31", status: "active" as const, xpReward: 100 },
      { title: "Georgia State CO₂ Goal", description: "Save 25,000 kg of CO₂ across all Georgia communities", scope: "state" as const, state: "Georgia", targetType: "co2_saved" as const, targetValue: 25000, currentValue: 22800, startDate: "2025-07-01", endDate: "2026-06-30", status: "active" as const, xpReward: 150 },
      { title: "Nashville Volunteer Drive", description: "Recruit 50 active volunteers in Nashville", scope: "city" as const, city: "Nashville", state: "Tennessee", targetType: "volunteer_count" as const, targetValue: 50, currentValue: 34, startDate: "2025-11-01", endDate: "2026-04-30", status: "active" as const, xpReward: 75 },
      { title: "TN 1000-Scan Milestone", description: "Reach 1,000 scans across Tennessee", scope: "state" as const, state: "Tennessee", targetType: "scan_count" as const, targetValue: 1000, currentValue: 1000, startDate: "2025-09-01", endDate: "2026-02-28", status: "completed" as const, xpReward: 200 },
      { title: "National 75% Diversion Rate", description: "Achieve a 75% diversion rate nationally", scope: "national" as const, targetType: "diversion_rate" as const, targetValue: 75, currentValue: 73.4, startDate: "2025-07-01", endDate: "2026-12-31", status: "active" as const, xpReward: 500 },
      { title: "Savannah Coastal Cleanup", description: "Divert 20 tons of waste in the Savannah coastal area", scope: "city" as const, city: "Savannah", state: "Georgia", targetType: "weight_diverted" as const, targetValue: 40000, currentValue: 42200, startDate: "2025-08-01", endDate: "2026-01-31", status: "completed" as const, xpReward: 100 },
    ];
    for (const g of goals) {
      await ctx.db.insert("communityGoals", g);
    }

    // ──────────────────────────────────────────────────────────────
    // 11. NOTIFICATIONS (top 6 users)
    // ──────────────────────────────────────────────────────────────
    const notifTemplates = [
      { type: "badge_earned" as const, title: "Badge Earned: Eco Champion 🌍", message: "You've reached the top tier of sustainability impact!", icon: "ribbon", actionUrl: "/impact" },
      { type: "level_up" as const, title: "Level Up! 🎉", message: "You reached a new level! Keep up the amazing work.", icon: "trophy" },
      { type: "streak_milestone" as const, title: "Streak Milestone! ⚡", message: "Incredible scanning streak maintained!", icon: "flame" },
      { type: "community_goal" as const, title: "Goal Progress Update", message: "A community goal is making great progress!", icon: "flag" },
      { type: "weekly_summary" as const, title: "Your Weekly Impact", message: "Check out your weekly scanning stats and environmental impact.", icon: "stats-chart" },
      { type: "system" as const, title: "New Feature: Map Directions 🗺️", message: "You can now get turn-by-turn directions to recycling centers!", icon: "navigate" },
    ];
    for (let i = 0; i < 6; i++) {
      const user = usersToCreate[i];
      for (let j = 0; j < notifTemplates.length; j++) {
        const n = notifTemplates[j];
        await ctx.db.insert("notifications", {
          userId: user.email,
          type: n.type,
          title: n.title,
          message: n.message,
          icon: n.icon,
          read: j < 3,
          actionUrl: n.actionUrl,
          createdAt: new Date(now.getTime() - j * 86400000).toISOString(),
        });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // 12. ACTIVITY FEED (recent activities)
    // ──────────────────────────────────────────────────────────────
    const activityTypes: Array<{ type: "scan" | "correction" | "badge_earned" | "level_up" | "streak" | "center_route" | "daily_task" | "signup"; desc: string }> = [
      { type: "scan", desc: "Scanned 120 lbs at Midtown Cleanup, Atlanta" },
      { type: "scan", desc: "Scanned 450 lbs at Savannah Riverfront, Savannah" },
      { type: "badge_earned", desc: "Earned the \"Eco Champion\" badge 🌍" },
      { type: "level_up", desc: "Reached Level 9" },
      { type: "correction", desc: "Submitted a classification correction" },
      { type: "center_route", desc: "Routed waste to Athens-Clarke Recycling Center" },
      { type: "streak", desc: "Achieved a 30-day scanning streak ⚡" },
      { type: "daily_task", desc: "Completed all daily tasks (+50 XP)" },
      { type: "scan", desc: "Scanned 85 lbs at Augusta Community Center, Augusta" },
      { type: "signup", desc: "Joined GreenLens as a Neighborhood Volunteer" },
      { type: "scan", desc: "Scanned 200 lbs at Music Row District, Nashville" },
      { type: "badge_earned", desc: "Earned the \"Half-Ton Hero\" badge 🏗️" },
      { type: "center_route", desc: "Routed waste to Nashville Recycling Center" },
      { type: "scan", desc: "Scanned 350 lbs at Memphis Riverfront, Memphis" },
      { type: "correction", desc: "Improved AI classification for organic waste" },
      { type: "scan", desc: "Scanned 95 lbs at Macon Heritage Park, Macon" },
      { type: "level_up", desc: "Reached Level 7" },
      { type: "scan", desc: "Scanned 180 lbs at Knoxville Tech District, Knoxville" },
      { type: "badge_earned", desc: "Earned the \"Carbon Cutter\" badge ☁️" },
      { type: "signup", desc: "Joined GreenLens as a General Worker" },
    ];
    for (let i = 0; i < activityTypes.length; i++) {
      const user = usersToCreate[i % usersToCreate.length];
      const a = activityTypes[i];
      await ctx.db.insert("activityFeed", {
        userId: user.email,
        userName: user.name,
        type: a.type,
        description: a.desc,
        city: user.city,
        state: user.state,
        createdAt: new Date(now.getTime() - i * 1800000).toISOString(),
      });
    }

    // ──────────────────────────────────────────────────────────────
    // 13. LEADERBOARD (uses actual scan totals)
    // ──────────────────────────────────────────────────────────────
    const sortedByXp = [...usersToCreate].sort((a, b) => b.xp - a.xp);
    for (let i = 0; i < sortedByXp.length; i++) {
      const u = sortedByXp[i];
      const t = userTotals[u.email];
      await ctx.db.insert("leaderboard", {
        userId: u.email,
        userName: u.name,
        rank: i + 1,
        xp: u.xp,
        level: u.level,
        totalScans: t.scans,
        totalWeightDiverted: Math.round(t.weight * 100) / 100,
        totalCo2Saved: Math.round(t.co2 * 100) / 100,
        streakDays: u.streak,
        city: u.city,
        state: u.state,
        role: u.role,
        scope: "national",
        updatedAt: isoNow,
      });
    }

    // State leaderboards
    for (const sc of stateConfig) {
      const stateUsers = [...usersToCreate]
        .filter((u) => u.state === sc.state)
        .sort((a, b) => b.xp - a.xp);
      for (let i = 0; i < stateUsers.length; i++) {
        const u = stateUsers[i];
        const t = userTotals[u.email];
        await ctx.db.insert("leaderboard", {
          userId: u.email,
          userName: u.name,
          rank: i + 1,
          xp: u.xp,
          level: u.level,
          totalScans: t.scans,
          totalWeightDiverted: Math.round(t.weight * 100) / 100,
          totalCo2Saved: Math.round(t.co2 * 100) / 100,
          streakDays: u.streak,
          city: u.city,
          state: u.state,
          role: u.role,
          scope: "state",
          scopeValue: sc.state,
          updatedAt: isoNow,
        });
      }
    }

    // ──────────────────────────────────────────────────────────────
    // 14. REPORTS (quarterly snapshots)
    // ──────────────────────────────────────────────────────────────
    // Compute actual state totals for report accuracy
    const gaTotals = scanRecords
      .filter((s) => s.state === "Georgia")
      .reduce((a, s) => ({ scans: a.scans + 1, weight: a.weight + s.totalWeightLbs, co2: a.co2 + s.co2SavedKg }), { scans: 0, weight: 0, co2: 0 });
    const tnTotals = scanRecords
      .filter((s) => s.state === "Tennessee")
      .reduce((a, s) => ({ scans: a.scans + 1, weight: a.weight + s.totalWeightLbs, co2: a.co2 + s.co2SavedKg }), { scans: 0, weight: 0, co2: 0 });

    // Georgia city breakdown from actual scans
    const gaCityBreak: Record<string, { scans: number; weight: number; co2: number }> = {};
    for (const s of scanRecords.filter((r) => r.state === "Georgia")) {
      if (!gaCityBreak[s.city]) gaCityBreak[s.city] = { scans: 0, weight: 0, co2: 0 };
      gaCityBreak[s.city].scans++;
      gaCityBreak[s.city].weight += s.totalWeightLbs;
      gaCityBreak[s.city].co2 += s.co2SavedKg;
    }
    const tnCityBreak: Record<string, { scans: number; weight: number; co2: number }> = {};
    for (const s of scanRecords.filter((r) => r.state === "Tennessee")) {
      if (!tnCityBreak[s.city]) tnCityBreak[s.city] = { scans: 0, weight: 0, co2: 0 };
      tnCityBreak[s.city].scans++;
      tnCityBreak[s.city].weight += s.totalWeightLbs;
      tnCityBreak[s.city].co2 += s.co2SavedKg;
    }

    const gaVolunteers = usersToCreate.filter((u) => u.state === "Georgia" && u.scanCount > 0).length;
    const tnVolunteers = usersToCreate.filter((u) => u.state === "Tennessee" && u.scanCount > 0).length;

    await ctx.db.insert("reports", {
      title: "Georgia Q4 2025 Impact Report",
      state: "Georgia",
      period: "Q4 2025",
      totalScans: gaTotals.scans,
      totalWeightDiverted: Math.round(gaTotals.weight),
      totalCo2Saved: Math.round(gaTotals.co2),
      diversionRate: 71.8,
      activeVolunteers: gaVolunteers,
      categoryBreakdown: JSON.stringify({ recyclable: Math.round(gaTotals.weight * 0.52), organic: Math.round(gaTotals.weight * 0.33), "non-recyclable": Math.round(gaTotals.weight * 0.15) }),
      cityBreakdown: JSON.stringify(
        Object.entries(gaCityBreak).map(([city, d]) => ({ city, scans: d.scans, weight: Math.round(d.weight), co2: Math.round(d.co2) }))
      ),
      monthlyTrend: JSON.stringify([
        { month: "Oct 2025", co2: Math.round(gaTotals.co2 * 0.28), diverted: Math.round(gaTotals.weight * 0.28), landfill: Math.round(gaTotals.weight * 0.04) },
        { month: "Nov 2025", co2: Math.round(gaTotals.co2 * 0.38), diverted: Math.round(gaTotals.weight * 0.38), landfill: Math.round(gaTotals.weight * 0.035) },
        { month: "Dec 2025", co2: Math.round(gaTotals.co2 * 0.34), diverted: Math.round(gaTotals.weight * 0.34), landfill: Math.round(gaTotals.weight * 0.038) },
      ]),
      generatedAt: isoNow,
      generatedBy: "system",
    });

    await ctx.db.insert("reports", {
      title: "Tennessee Q4 2025 Impact Report",
      state: "Tennessee",
      period: "Q4 2025",
      totalScans: tnTotals.scans,
      totalWeightDiverted: Math.round(tnTotals.weight),
      totalCo2Saved: Math.round(tnTotals.co2),
      diversionRate: 69.5,
      activeVolunteers: tnVolunteers,
      categoryBreakdown: JSON.stringify({ recyclable: Math.round(tnTotals.weight * 0.50), organic: Math.round(tnTotals.weight * 0.35), "non-recyclable": Math.round(tnTotals.weight * 0.15) }),
      cityBreakdown: JSON.stringify(
        Object.entries(tnCityBreak).map(([city, d]) => ({ city, scans: d.scans, weight: Math.round(d.weight), co2: Math.round(d.co2) }))
      ),
      monthlyTrend: JSON.stringify([
        { month: "Oct 2025", co2: Math.round(tnTotals.co2 * 0.30), diverted: Math.round(tnTotals.weight * 0.30), landfill: Math.round(tnTotals.weight * 0.045) },
        { month: "Nov 2025", co2: Math.round(tnTotals.co2 * 0.36), diverted: Math.round(tnTotals.weight * 0.36), landfill: Math.round(tnTotals.weight * 0.04) },
        { month: "Dec 2025", co2: Math.round(tnTotals.co2 * 0.34), diverted: Math.round(tnTotals.weight * 0.34), landfill: Math.round(tnTotals.weight * 0.042) },
      ]),
      generatedAt: isoNow,
      generatedBy: "system",
    });

    return `Demo data seeded: ${usersToCreate.length} users, 12 badges, ${scanRecords.length} scans, 8 corrections, 20 centers, 6 goals, notifications, activity feed, leaderboard, 2 reports`;
  },
});
