import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getAllJobSites = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("jobSites").collect();
  },
});

export const getJobSitesByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobSites")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .collect();
  },
});

export const getJobSitesByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("jobSites")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .collect();
  },
});

export const createJobSite = mutation({
  args: {
    name: v.string(),
    city: v.string(),
    state: v.optional(v.string()),
    region: v.string(),
    latitude: v.float64(),
    longitude: v.float64(),
    managerId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("jobSites", {
      ...args,
      totalScans: 0,
      totalWeightDiverted: 0,
      totalCo2Saved: 0,
      greenScore: 0,
    });
  },
});

export const updateJobSiteStats = mutation({
  args: {
    jobSiteId: v.id("jobSites"),
    additionalWeight: v.float64(),
    additionalCo2: v.float64(),
  },
  handler: async (ctx, args) => {
    const site = await ctx.db.get(args.jobSiteId);
    if (!site) throw new Error("Job site not found");

    const newWeight = site.totalWeightDiverted + args.additionalWeight;
    const newCo2 = site.totalCo2Saved + args.additionalCo2;
    const newScans = site.totalScans + 1;
    const greenScore = Math.min(100, Math.round((newWeight / 10000) * 100));

    await ctx.db.patch(args.jobSiteId, {
      totalScans: newScans,
      totalWeightDiverted: newWeight,
      totalCo2Saved: newCo2,
      greenScore,
    });
  },
});
