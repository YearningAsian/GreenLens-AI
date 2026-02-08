import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPER: Mask name for privacy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "";
  if (parts.length === 1) {
    // Single name: "Marcus" -> "M*****"
    return parts[0][0] + "*".repeat(parts[0].length - 1);
  }
  // Multiple parts: "Marcus Johnson" -> "M***** J******"
  return parts.map(p => p[0] + "*".repeat(Math.max(p.length - 1, 4))).join(" ");
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCAN MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const recordScan = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    locationName: v.string(),
    city: v.string(),
    state: v.string(),
    categories: v.array(
      v.object({
        name: v.string(),
        percentage: v.float64(),
        weight_estimate_lbs: v.float64(),
        co2_saved_kg: v.float64(),
        notes: v.optional(v.string()),
      })
    ),
    totalWeightLbs: v.float64(),
    co2SavedKg: v.float64(),
    confidence: v.float64(),
    summary: v.string(),
    imageUrl: v.optional(v.string()),
    routedToCenter: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    xpAwarded: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const scanId = await ctx.db.insert("scans", {
      ...args,
      wasCorrected: false,
      scannedAt: new Date().toISOString(),
    });

    // Log activity
    await ctx.db.insert("activityFeed", {
      userId: args.userId,
      userName: args.userName,
      type: "scan",
      description: `Scanned ${args.totalWeightLbs} lbs at ${args.locationName}, ${args.city}`,
      city: args.city,
      state: args.state,
      createdAt: new Date().toISOString(),
    });

    return scanId;
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCAN QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Migration: fix old scans with "Community Scan" locationName or "City, ST" format
export const fixScanLocations = mutation({
  args: {},
  handler: async (ctx) => {
    const allScans = await ctx.db.query("scans").collect();
    let fixed = 0;
    for (const scan of allScans) {
      const updates: Record<string, string> = {};
      // Fix "Community Scan" → use the scan's city name
      if (scan.locationName === "Community Scan") {
        updates.locationName = scan.city.replace(/,\s*[A-Z]{2}$/, "");
      }
      // Fix "Atlanta, GA" → "Atlanta" (strip state suffix from city)
      if (scan.city.includes(",")) {
        updates.city = scan.city.split(",")[0].trim();
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(scan._id, updates);
        fixed++;
      }
    }
    return { fixed, total: allScans.length };
  },
});

export const getAllScans = query({
  args: {},
  handler: async (ctx) => {
    const scans = await ctx.db.query("scans").order("desc").take(500);

    // Apply privacy masking
    const result = await Promise.all(
      scans.map(async (scan) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", scan.userId))
          .first();
        
        return {
          ...scan,
          userName: user?.leaderboardPrivacy ? maskName(scan.userName) : scan.userName,
        };
      })
    );

    return result;
  },
});

export const getScansByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .order("desc")
      .take(500);
    
    // Apply privacy masking
    const result = await Promise.all(
      scans.map(async (scan) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", scan.userId))
          .first();
        
        return {
          ...scan,
          userName: user?.leaderboardPrivacy ? maskName(scan.userName) : scan.userName,
        };
      })
    );

    return result;
  },
});

export const getScansByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .order("desc")
      .take(200);
    
    // Apply privacy masking
    const result = await Promise.all(
      scans.map(async (scan) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", scan.userId))
          .first();
        
        return {
          ...scan,
          userName: user?.leaderboardPrivacy ? maskName(scan.userName) : scan.userName,
        };
      })
    );

    return result;
  },
});

export const getScansByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);
    
    // Apply privacy masking
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userId))
      .first();

    if (!user?.leaderboardPrivacy) {
      return scans;
    }

    return scans.map(scan => ({
      ...scan,
      userName: maskName(scan.userName),
    }));
  },
});

export const getDashboardStats = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let allScans;
    if (args.state) {
      const st = args.state;
      allScans = await ctx.db
        .query("scans")
        .withIndex("by_state", (q) => q.eq("state", st))
        .collect();
    } else {
      allScans = await ctx.db.query("scans").collect();
    }

    const totalScans = allScans.length;
    const totalWeight = allScans.reduce((sum, s) => sum + s.totalWeightLbs, 0);
    const totalCo2 = allScans.reduce((sum, s) => sum + s.co2SavedKg, 0);

    // Group by city
    const cityStats: Record<string, { scans: number; weight: number; co2: number }> = {};
    for (const scan of allScans) {
      if (!cityStats[scan.city]) {
        cityStats[scan.city] = { scans: 0, weight: 0, co2: 0 };
      }
      cityStats[scan.city].scans += 1;
      cityStats[scan.city].weight += scan.totalWeightLbs;
      cityStats[scan.city].co2 += scan.co2SavedKg;
    }

    // Group by category
    const categoryStats: Record<string, { weight: number; co2: number; count: number }> = {};
    for (const scan of allScans) {
      for (const cat of scan.categories) {
        if (!categoryStats[cat.name]) {
          categoryStats[cat.name] = { weight: 0, co2: 0, count: 0 };
        }
        categoryStats[cat.name].weight += cat.weight_estimate_lbs;
        categoryStats[cat.name].co2 += cat.co2_saved_kg;
        categoryStats[cat.name].count += 1;
      }
    }

    // Diversion rate
    const recyclableWeight = (categoryStats["recyclable"]?.weight ?? 0) + (categoryStats["organic"]?.weight ?? 0);
    const diversionRate = totalWeight > 0 ? (recyclableWeight / totalWeight) * 100 : 0;

    // Distinct locations
    const locations = new Set(allScans.map((s) => s.locationName));

    // Average confidence
    const avgConfidence =
      totalScans > 0
        ? allScans.reduce((s, sc) => s + (sc.confidence ?? 0), 0) / totalScans
        : 0;

    return {
      totalScans,
      totalWeightLbs: Math.round(totalWeight * 100) / 100,
      totalCo2SavedKg: Math.round(totalCo2 * 100) / 100,
      diversionRate: Math.round(diversionRate * 10) / 10,
      cityStats,
      categoryStats,
      totalLocations: locations.size,
      avgConfidence: Math.round(avgConfidence * 10000) / 100,
    };
  },
});

// Monthly trend for line/bar charts
export const getMonthlyTrend = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let scans;
    if (args.state) {
      const st = args.state;
      scans = await ctx.db
        .query("scans")
        .withIndex("by_state", (q) => q.eq("state", st))
        .collect();
    } else {
      scans = await ctx.db.query("scans").collect();
    }

    const months: Record<string, { weight: number; co2: number; scans: number; landfill: number }> = {};

    for (const scan of scans) {
      const d = scan.scannedAt ? new Date(scan.scannedAt) : new Date(scan._creationTime);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      if (!months[key]) months[key] = { weight: 0, co2: 0, scans: 0, landfill: 0 };
      months[key].weight += scan.totalWeightLbs;
      months[key].co2 += scan.co2SavedKg;
      months[key].scans += 1;

      // Landfill = non-recyclable weight
      for (const cat of scan.categories) {
        if (cat.name === "non-recyclable") {
          months[key].landfill += cat.weight_estimate_lbs;
        }
      }
    }

    return Object.entries(months)
      .map(([month, data]) => ({
        month,
        diverted: Math.round(data.weight),
        co2: Math.round(data.co2 * 100) / 100,
        scans: data.scans,
        landfill: Math.round(data.landfill),
      }))
      .sort((a, b) => new Date(`1 ${a.month}`).getTime() - new Date(`1 ${b.month}`).getTime());
  },
});

// Recent scans for sidebar/widget
export const getRecentScans = query({
  args: { state: v.optional(v.string()), limit: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    const lim = args.limit ?? 10;
    let scans;
    if (args.state) {
      const st = args.state;
      scans = await ctx.db
        .query("scans")
        .withIndex("by_state", (q) => q.eq("state", st))
        .order("desc")
        .take(lim);
    } else {
      scans = await ctx.db.query("scans").order("desc").take(lim);
    }

    // Apply privacy masking
    const result = await Promise.all(
      scans.map(async (scan) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", scan.userId))
          .first();
        
        return {
          ...scan,
          userName: user?.leaderboardPrivacy ? maskName(scan.userName) : scan.userName,
        };
      })
    );

    return result;
  },
});

// Scans with lat/lng for heatmap
export const getScansWithLocation = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let scans;
    if (args.state) {
      const st = args.state;
      scans = await ctx.db
        .query("scans")
        .withIndex("by_state", (q) => q.eq("state", st))
        .collect();
    } else {
      scans = await ctx.db.query("scans").collect();
    }

    return scans
      .filter((s) => s.latitude && s.longitude)
      .map((s) => ({
        lat: s.latitude!,
        lng: s.longitude!,
        weight: s.totalWeightLbs,
        city: s.city,
        categories: s.categories.map((c) => c.name),
        scannedAt: s.scannedAt,
      }));
  },
});

// CO₂ stats by time period for gauge chart (monthly / yearly)
export const getCo2ByPeriod = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let scans;
    if (args.state) {
      const st = args.state;
      scans = await ctx.db
        .query("scans")
        .withIndex("by_state", (q) => q.eq("state", st))
        .collect();
    } else {
      scans = await ctx.db.query("scans").collect();
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthlyCo2 = 0;
    let yearlyCo2 = 0;

    for (const scan of scans) {
      const d = scan.scannedAt ? new Date(scan.scannedAt) : new Date(scan._creationTime);
      if (d.getFullYear() === currentYear) {
        yearlyCo2 += scan.co2SavedKg;
        if (d.getMonth() === currentMonth) {
          monthlyCo2 += scan.co2SavedKg;
        }
      }
    }

    return {
      monthlyCo2: Math.round(monthlyCo2 * 100) / 100,
      yearlyCo2: Math.round(yearlyCo2 * 100) / 100,
    };
  },
});

// City stats broken down by period (month or year) for CityImpactChart
export const getCityStatsByPeriod = query({
  args: {
    state: v.optional(v.string()),
    period: v.union(v.literal("month"), v.literal("year")),
  },
  handler: async (ctx, args) => {
    let scans;
    if (args.state) {
      const st = args.state;
      scans = await ctx.db
        .query("scans")
        .withIndex("by_state", (q) => q.eq("state", st))
        .collect();
    } else {
      scans = await ctx.db.query("scans").collect();
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const cityStats: Record<string, { scans: number; weight: number; co2: number }> = {};

    for (const scan of scans) {
      const d = scan.scannedAt ? new Date(scan.scannedAt) : new Date(scan._creationTime);
      const inYear = d.getFullYear() === currentYear;
      const inMonth = inYear && d.getMonth() === currentMonth;

      if (args.period === "month" ? inMonth : inYear) {
        if (!cityStats[scan.city]) cityStats[scan.city] = { scans: 0, weight: 0, co2: 0 };
        cityStats[scan.city].scans += 1;
        cityStats[scan.city].weight += scan.totalWeightLbs;
        cityStats[scan.city].co2 += scan.co2SavedKg;
      }
    }

    return Object.entries(cityStats)
      .map(([city, data]) => ({
        city,
        scans: data.scans,
        diverted: Math.round(data.weight),
        co2: Math.round(data.co2),
      }))
      .sort((a, b) => b.diverted - a.diverted);
  },
});
