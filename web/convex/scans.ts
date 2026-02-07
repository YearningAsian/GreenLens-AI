import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record a new scan from the mobile app
export const recordScan = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    jobSiteId: v.string(),
    jobSiteName: v.string(),
    city: v.string(),
    state: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const scanId = await ctx.db.insert("scans", args);
    return scanId;
  },
});

// Get all scans (for dashboard)
export const getAllScans = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("scans").order("desc").take(500);
  },
});

// Get scans by state
export const getScansByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scans")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .order("desc")
      .take(500);
  },
});

// Get scans by city
export const getScansByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scans")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .order("desc")
      .take(200);
  },
});

// Get scans by user
export const getScansByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scans")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(100);
  },
});

// Get scans by job site
export const getScansByJobSite = query({
  args: { jobSiteId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("scans")
      .withIndex("by_jobSiteId", (q) => q.eq("jobSiteId", args.jobSiteId))
      .order("desc")
      .take(200);
  },
});

// Get aggregate stats for dashboard (optionally filtered by state)
export const getDashboardStats = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let allScans;
    if (args.state) {
      allScans = await ctx.db
        .query("scans")
        .withIndex("by_state", (q) => q.eq("state", args.state))
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

    // Group by category (organic / recyclable / non-recyclable)
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

    return {
      totalScans,
      totalWeightLbs: Math.round(totalWeight * 100) / 100,
      totalCo2SavedKg: Math.round(totalCo2 * 100) / 100,
      cityStats,
      categoryStats,
    };
  },
});
