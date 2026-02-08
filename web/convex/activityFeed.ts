import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIVITY FEED MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const logActivity = mutation({
  args: {
    userId: v.string(),
    userName: v.string(),
    type: v.union(
      v.literal("scan"),
      v.literal("correction"),
      v.literal("badge_earned"),
      v.literal("level_up"),
      v.literal("streak"),
      v.literal("center_route"),
      v.literal("daily_task"),
      v.literal("signup")
    ),
    description: v.string(),
    metadata: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activityFeed", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACTIVITY FEED QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getRecentActivity = query({
  args: {
    state: v.optional(v.string()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    if (args.state) {
      return await ctx.db
        .query("activityFeed")
        .withIndex("by_state", (q) => q.eq("state", args.state))
        .order("desc")
        .take(args.limit ?? 50);
    }
    return await ctx.db
      .query("activityFeed")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getUserActivity = query({
  args: { userId: v.string(), limit: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityFeed")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 30);
  },
});

export const getActivityByType = query({
  args: { type: v.string(), limit: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityFeed")
      .withIndex("by_type", (q) => q.eq("type", args.type as any))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getActivityByCity = query({
  args: { city: v.string(), limit: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activityFeed")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .order("desc")
      .take(args.limit ?? 50);
  },
});
