import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordCompletion = mutation({
  args: {
    userId: v.string(),
    date: v.string(),
    taskId: v.string(),
    xpAwarded: v.float64(),
    completedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check for duplicate
    const existing = await ctx.db
      .query("dailyTaskCompletions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
    const already = existing.find((e) => e.taskId === args.taskId);
    if (already) return already._id; // idempotent

    return await ctx.db.insert("dailyTaskCompletions", args);
  },
});

export const getCompletionsForDate = query({
  args: { userId: v.string(), date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("dailyTaskCompletions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .collect();
  },
});
