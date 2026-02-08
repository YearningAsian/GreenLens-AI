import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMUNITY GOAL MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const createGoal = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    scope: v.union(v.literal("city"), v.literal("state"), v.literal("national")),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    targetType: v.union(
      v.literal("weight_diverted"),
      v.literal("co2_saved"),
      v.literal("scan_count"),
      v.literal("volunteer_count"),
      v.literal("diversion_rate")
    ),
    targetValue: v.float64(),
    startDate: v.string(),
    endDate: v.string(),
    xpReward: v.float64(),
    badgeReward: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("communityGoals", {
      ...args,
      currentValue: 0,
      status: "active",
    });
  },
});

export const updateGoalProgress = mutation({
  args: {
    goalId: v.id("communityGoals"),
    incrementBy: v.float64(),
  },
  handler: async (ctx, args) => {
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.status !== "active") return null;

    const newValue = goal.currentValue + args.incrementBy;
    const completed = newValue >= goal.targetValue;

    await ctx.db.patch(args.goalId, {
      currentValue: newValue,
      status: completed ? "completed" : "active",
    });

    return { currentValue: newValue, completed };
  },
});

export const expireOldGoals = mutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    const active = await ctx.db
      .query("communityGoals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    let expired = 0;
    for (const goal of active) {
      if (goal.endDate < today) {
        await ctx.db.patch(goal._id, { status: "expired" });
        expired++;
      }
    }
    return { expired };
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COMMUNITY GOAL QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getActiveGoals = query({
  args: { state: v.optional(v.string()), city: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let goals = await ctx.db
      .query("communityGoals")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    if (args.state) {
      goals = goals.filter(
        (g) => g.scope === "national" || g.state === args.state
      );
    }
    if (args.city) {
      goals = goals.filter(
        (g) => g.scope !== "city" || g.city === args.city
      );
    }

    return goals.map((g) => ({
      ...g,
      progressPercent: g.targetValue > 0
        ? Math.min((g.currentValue / g.targetValue) * 100, 100)
        : 0,
    }));
  },
});

export const getAllGoals = query({
  args: {},
  handler: async (ctx) => {
    const goals = await ctx.db.query("communityGoals").order("desc").take(100);
    return goals.map((g) => ({
      ...g,
      progressPercent: g.targetValue > 0
        ? Math.min((g.currentValue / g.targetValue) * 100, 100)
        : 0,
    }));
  },
});

export const getGoalsByState = query({
  args: { state: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("communityGoals")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .collect();
  },
});
