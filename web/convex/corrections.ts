import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORRECTION MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const submitCorrection = mutation({
  args: {
    scanId: v.optional(v.id("scans")),
    userId: v.string(),
    originalCategories: v.array(
      v.object({
        name: v.string(),
        percentage: v.float64(),
        weight_estimate_lbs: v.float64(),
        co2_saved_kg: v.float64(),
        notes: v.optional(v.string()),
      })
    ),
    correctedCategories: v.array(
      v.object({
        name: v.string(),
        percentage: v.float64(),
        weight_estimate_lbs: v.float64(),
        co2_saved_kg: v.float64(),
        notes: v.optional(v.string()),
      })
    ),
    imageDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const correctionId = await ctx.db.insert("corrections", {
      ...args,
      submittedAt: now,
    });

    // Mark the scan as corrected
    if (args.scanId) {
      await ctx.db.patch(args.scanId, {
        wasCorrected: true,
        correctionId,
      });
    }

    // Log activity
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userId))
      .first();

    await ctx.db.insert("activityFeed", {
      userId: args.userId,
      userName: user?.name ?? "Unknown",
      type: "correction",
      description: "Submitted a classification correction to improve AI accuracy",
      city: user?.city,
      state: user?.state,
      createdAt: now,
    });

    return correctionId;
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CORRECTION QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getCorrectionsByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("corrections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);
  },
});

export const getCorrectionForScan = query({
  args: { scanId: v.id("scans") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("corrections")
      .withIndex("by_scanId", (q) => q.eq("scanId", args.scanId))
      .first();
  },
});

export const getAllCorrections = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("corrections").order("desc").take(200);
  },
});

export const getCorrectionStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("corrections").collect();
    const uniqueUsers = new Set(all.map((c) => c.userId)).size;
    return {
      totalCorrections: all.length,
      uniqueContributors: uniqueUsers,
    };
  },
});
