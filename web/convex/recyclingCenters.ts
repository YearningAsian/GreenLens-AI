import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECYCLING CENTER MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const upsertCenter = mutation({
  args: {
    centerId: v.string(),
    name: v.string(),
    city: v.string(),
    state: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    accepts: v.array(v.string()),
    lat: v.float64(),
    lng: v.float64(),
    source: v.union(
      v.literal("verified"),
      v.literal("scraped"),
      v.literal("user_submitted")
    ),
    hours: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("recyclingCenters")
      .withIndex("by_centerId", (q) => q.eq("centerId", args.centerId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastVerified: new Date().toISOString(),
      });
      return existing._id;
    }

    return await ctx.db.insert("recyclingCenters", {
      ...args,
      lastVerified: new Date().toISOString(),
    });
  },
});

export const bulkInsertCenters = mutation({
  args: {
    centers: v.array(
      v.object({
        centerId: v.string(),
        name: v.string(),
        city: v.string(),
        state: v.string(),
        address: v.string(),
        phone: v.optional(v.string()),
        accepts: v.array(v.string()),
        lat: v.float64(),
        lng: v.float64(),
        source: v.union(
          v.literal("verified"),
          v.literal("scraped"),
          v.literal("user_submitted")
        ),
        hours: v.optional(v.string()),
        website: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    let count = 0;
    for (const center of args.centers) {
      const existing = await ctx.db
        .query("recyclingCenters")
        .withIndex("by_centerId", (q) => q.eq("centerId", center.centerId))
        .first();

      if (!existing) {
        await ctx.db.insert("recyclingCenters", {
          ...center,
          lastVerified: new Date().toISOString(),
        });
        count++;
      }
    }
    return { inserted: count };
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECYCLING CENTER QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getAllCenters = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.state) {
      return await ctx.db
        .query("recyclingCenters")
        .withIndex("by_state", (q) => q.eq("state", args.state))
        .collect();
    }
    return await ctx.db.query("recyclingCenters").collect();
  },
});

export const getCentersByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("recyclingCenters")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .collect();
  },
});

export const getCentersByCategory = query({
  args: { category: v.string(), state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let centers;
    if (args.state) {
      centers = await ctx.db
        .query("recyclingCenters")
        .withIndex("by_state", (q) => q.eq("state", args.state))
        .collect();
    } else {
      centers = await ctx.db.query("recyclingCenters").collect();
    }
    return centers.filter((c) => c.accepts.includes(args.category));
  },
});

export const getCenterStats = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const centers = args.state
      ? await ctx.db.query("recyclingCenters").withIndex("by_state", (q) => q.eq("state", args.state)).collect()
      : await ctx.db.query("recyclingCenters").collect();

    const byCityCount: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const bySource: Record<string, number> = {};

    for (const c of centers) {
      byCityCount[c.city] = (byCityCount[c.city] || 0) + 1;
      for (const cat of c.accepts) {
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
      bySource[c.source] = (bySource[c.source] || 0) + 1;
    }

    return {
      totalCenters: centers.length,
      byCityCount,
      byCategory,
      bySource,
    };
  },
});
