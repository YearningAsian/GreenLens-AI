import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REPORT MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const generateReport = mutation({
  args: {
    title: v.string(),
    state: v.string(),
    period: v.string(),
    generatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Gather all scans for this state
    const scans = await ctx.db
      .query("scans")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .collect();

    const users = await ctx.db
      .query("users")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .collect();

    const totalScans = scans.length;
    const totalWeight = scans.reduce((s, sc) => s + sc.totalWeightLbs, 0);
    const totalCo2 = scans.reduce((s, sc) => s + sc.co2SavedKg, 0);
    const activeVolunteers = users.filter((u) => u.status === "active").length;

    // Category breakdown
    const catBreakdown: Record<string, number> = {};
    for (const scan of scans) {
      for (const cat of scan.categories) {
        catBreakdown[cat.name] = (catBreakdown[cat.name] || 0) + cat.weight_estimate_lbs;
      }
    }

    const recyclableWeight = (catBreakdown["recyclable"] || 0) + (catBreakdown["organic"] || 0);
    const diversionRate = totalWeight > 0 ? (recyclableWeight / totalWeight) * 100 : 0;

    // City breakdown
    const cityMap: Record<string, { scans: number; weight: number; co2: number }> = {};
    for (const scan of scans) {
      if (!cityMap[scan.city]) cityMap[scan.city] = { scans: 0, weight: 0, co2: 0 };
      cityMap[scan.city].scans += 1;
      cityMap[scan.city].weight += scan.totalWeightLbs;
      cityMap[scan.city].co2 += scan.co2SavedKg;
    }
    const cityBreakdown = Object.entries(cityMap).map(([city, stats]) => ({
      city,
      ...stats,
    }));

    return await ctx.db.insert("reports", {
      title: args.title,
      state: args.state,
      period: args.period,
      totalScans,
      totalWeightDiverted: Math.round(totalWeight),
      totalCo2Saved: Math.round(totalCo2 * 100) / 100,
      diversionRate: Math.round(diversionRate * 10) / 10,
      activeVolunteers,
      categoryBreakdown: JSON.stringify(catBreakdown),
      cityBreakdown: JSON.stringify(cityBreakdown),
      monthlyTrend: JSON.stringify([]), // Would compute from timestamps
      generatedAt: new Date().toISOString(),
      generatedBy: args.generatedBy,
    });
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REPORT QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getReportsByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reports")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .order("desc")
      .take(20);
  },
});

export const getReportByPeriod = query({
  args: { period: v.string(), state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let reports = await ctx.db
      .query("reports")
      .withIndex("by_period", (q) => q.eq("period", args.period))
      .collect();

    if (args.state) {
      reports = reports.filter((r) => r.state === args.state);
    }

    return reports[0] ?? null;
  },
});

export const getAllReports = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("reports").order("desc").take(50);
  },
});
