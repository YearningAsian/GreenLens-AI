import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DAILY TASK DEFINITIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DAILY_TASKS = [
  { taskId: "login", title: "Login & check in", icon: "log-in-outline", points: 10 },
  { taskId: "scan", title: "Complete 1 scan", icon: "scan-outline", points: 25 },
  { taskId: "impact", title: "Check impact", icon: "stats-chart-outline", points: 15 },
  { taskId: "center_visit", title: "View recycling centers", icon: "location-outline", points: 10 },
  { taskId: "correction", title: "Submit a correction", icon: "create-outline", points: 20 },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const completeTask = mutation({
  args: {
    userId: v.string(),
    taskId: v.string(),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);

    // Check if already completed today
    const existing = await ctx.db
      .query("dailyTaskCompletions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .collect();

    if (existing.find((t) => t.taskId === args.taskId)) {
      return { alreadyCompleted: true, xpAwarded: 0 };
    }

    const taskDef = DAILY_TASKS.find((t) => t.taskId === args.taskId);
    const xp = taskDef?.points ?? 10;

    await ctx.db.insert("dailyTaskCompletions", {
      userId: args.userId,
      date: today,
      taskId: args.taskId,
      xpAwarded: xp,
      completedAt: new Date().toISOString(),
    });

    return { alreadyCompleted: false, xpAwarded: xp };
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Get today's tasks with completion status for a user */
export const getTodaysTasks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().slice(0, 10);

    const completions = await ctx.db
      .query("dailyTaskCompletions")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .collect();

    const completedIds = new Set(completions.map((c) => c.taskId));

    return DAILY_TASKS.map((task) => ({
      ...task,
      completed: completedIds.has(task.taskId),
    }));
  },
});

/** Get task completion history for a user (for streak analytics) */
export const getTaskHistory = query({
  args: { userId: v.string(), days: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    const allCompletions = await ctx.db
      .query("dailyTaskCompletions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.days ? args.days * 5 : 150); // ~5 tasks/day max

    // Group by date
    const byDate: Record<string, { taskId: string; xpAwarded: number }[]> = {};
    for (const c of allCompletions) {
      if (!byDate[c.date]) byDate[c.date] = [];
      byDate[c.date].push({ taskId: c.taskId, xpAwarded: c.xpAwarded });
    }

    return {
      completions: byDate,
      totalXpFromTasks: allCompletions.reduce((s, c) => s + c.xpAwarded, 0),
      daysActive: Object.keys(byDate).length,
    };
  },
});
