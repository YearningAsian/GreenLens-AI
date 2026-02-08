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
// USER MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(
      v.literal("volunteer"),
      v.literal("hauler"),
      v.literal("liaison")
    ),
    city: v.string(),
    state: v.string(),
    profileImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) throw new Error("Email already registered");

    const now = new Date().toISOString();
    const userId = await ctx.db.insert("users", {
      ...args,
      xp: 10, // Login XP bonus
      level: 1,
      streakDays: 1,
      lastActiveDate: now.slice(0, 10),
      totalScans: 0,
      totalWeightDiverted: 0,
      totalCo2Saved: 0,
      status: "active",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    });

    // Log signup activity
    await ctx.db.insert("activityFeed", {
      userId: args.email,
      userName: args.name,
      type: "signup",
      description: `${args.name} joined GreenLens as a ${args.role}`,
      city: args.city,
      state: args.state,
      createdAt: now,
    });

    // Welcome notification
    await ctx.db.insert("notifications", {
      userId: args.email,
      type: "system",
      title: "Welcome to GreenLens! 🌿",
      message: "Start scanning waste to earn XP and unlock badges. Your community impact begins now!",
      icon: "leaf",
      read: false,
      actionUrl: "/scan",
      createdAt: now,
    });

    return userId;
  },
});

export const loginUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user || user.passwordHash !== args.passwordHash) {
      return null;
    }

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak = user.streakDays;

    if (user.lastActiveDate === yesterday) {
      newStreak += 1;
    } else if (user.lastActiveDate !== today) {
      newStreak = 1; // Streak broken
    }

    // Update last active + streak
    await ctx.db.patch(user._id, {
      lastActiveDate: today,
      streakDays: newStreak,
    });

    return { ...user, streakDays: newStreak };
  },
});

export const addXp = mutation({
  args: {
    userId: v.string(),
    amount: v.float64(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userId))
      .first();
    if (!user) return null;

    const THRESHOLDS = [0, 100, 250, 500, 850, 1300, 1900, 2600, 3500, 4600, 6000, 7800, 10000, 13000, 17000, 22000, 28000, 36000, 46000, 60000];
    const newXp = user.xp + args.amount;
    let newLevel = 1;
    for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
      if (newXp >= THRESHOLDS[i]) { newLevel = i + 1; break; }
    }

    const leveledUp = newLevel > user.level;
    await ctx.db.patch(user._id, { xp: newXp, level: newLevel });

    if (leveledUp) {
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "level_up",
        title: `Level Up! 🎉`,
        message: `You reached Level ${newLevel}! Keep up the amazing work.`,
        icon: "trophy",
        read: false,
        createdAt: new Date().toISOString(),
      });

      await ctx.db.insert("activityFeed", {
        userId: args.userId,
        userName: user.name,
        type: "level_up",
        description: `Reached Level ${newLevel}`,
        city: user.city,
        state: user.state,
        createdAt: new Date().toISOString(),
      });
    }

    return { xp: newXp, level: newLevel, leveledUp };
  },
});

export const updateUserStats = mutation({
  args: {
    userId: v.string(),
    weightDiverted: v.float64(),
    co2Saved: v.float64(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userId))
      .first();
    if (!user) return;

    await ctx.db.patch(user._id, {
      totalScans: user.totalScans + 1,
      totalWeightDiverted: user.totalWeightDiverted + args.weightDiverted,
      totalCo2Saved: user.totalCo2Saved + args.co2Saved,
    });
  },
});

export const updateProfile = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    role: v.optional(
      v.union(v.literal("volunteer"), v.literal("hauler"), v.literal("liaison"))
    ),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    leaderboardPrivacy: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!user) throw new Error("User not found");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.role !== undefined) updates.role = args.role;
    if (args.city !== undefined) updates.city = args.city;
    if (args.state !== undefined) updates.state = args.state;
    if (args.profileImageUrl !== undefined) updates.profileImageUrl = args.profileImageUrl;
    if (args.leaderboardPrivacy !== undefined) updates.leaderboardPrivacy = args.leaderboardPrivacy;

    await ctx.db.patch(user._id, updates);
    return { ...user, ...updates };
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getAllUsers = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let users;
    if (args.state) {
      const st = args.state;
      users = await ctx.db
        .query("users")
        .withIndex("by_state", (q) => q.eq("state", st))
        .collect();
    } else {
      users = await ctx.db.query("users").collect();
    }

    // Apply privacy masking
    return users.map(user => ({
      ...user,
      name: user.leaderboardPrivacy ? maskName(user.name) : user.name,
    }));
  },
});

export const getUsersByRole = query({
  args: { role: v.union(v.literal("volunteer"), v.literal("hauler"), v.literal("liaison")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
  },
});

export const getUsersByCity = query({
  args: { city: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_city", (q) => q.eq("city", args.city))
      .collect();
  },
});

export const getCommunityStats = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Users for role counts, active count, streak
    const users = args.state
      ? await ctx.db.query("users").withIndex("by_state", (q) => q.eq("state", args.state!)).collect()
      : await ctx.db.query("users").collect();

    const activeCount = users.filter((u) => u.status === "active").length;
    const avgStreak = users.length > 0 ? users.reduce((a, u) => a + u.streakDays, 0) / users.length : 0;

    const roleCounts = users.reduce(
      (acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Aggregate scan metrics from actual scans table (source of truth)
    const scans = args.state
      ? await ctx.db.query("scans").withIndex("by_state", (q) => q.eq("state", args.state!)).collect()
      : await ctx.db.query("scans").collect();

    const totalScans = scans.length;
    const totalWeight = scans.reduce((a, s) => a + s.totalWeightLbs, 0);
    const totalCo2 = scans.reduce((a, s) => a + s.co2SavedKg, 0);

    return {
      totalUsers: users.length,
      activeCount,
      totalScans,
      totalWeight: Math.round(totalWeight),
      totalCo2: Math.round(totalCo2),
      avgStreak: Math.round(avgStreak * 10) / 10,
      roleCounts,
    };
  },
});

/** Daily check-in — updates lastActiveDate and increments streak. */
export const checkIn = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) return null;

    const today = new Date().toISOString().slice(0, 10);

    // Already checked in today — no-op, return current streak
    if (user.lastActiveDate === today) {
      return { streakDays: user.streakDays, alreadyCheckedIn: true };
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let newStreak = user.streakDays;

    if (user.lastActiveDate === yesterday) {
      newStreak += 1; // consecutive day
    } else {
      newStreak = 1; // streak broken — start fresh
    }

    await ctx.db.patch(user._id, {
      lastActiveDate: today,
      streakDays: newStreak,
    });

    return { streakDays: newStreak, alreadyCheckedIn: false };
  },
});

/** Migration: recalculate all user stats from actual scan records */
export const recalcUserStats = mutation({
  args: {},
  handler: async (ctx) => {
    const allScans = await ctx.db.query("scans").collect();
    const allUsers = await ctx.db.query("users").collect();

    // Build per-user aggregates from scans
    const userAgg: Record<string, { scans: number; weight: number; co2: number }> = {};
    for (const scan of allScans) {
      const uid = scan.userId;
      if (!userAgg[uid]) userAgg[uid] = { scans: 0, weight: 0, co2: 0 };
      userAgg[uid].scans += 1;
      userAgg[uid].weight += scan.totalWeightLbs;
      userAgg[uid].co2 += scan.co2SavedKg;
    }

    let updated = 0;
    for (const user of allUsers) {
      const agg = userAgg[user.email] ?? { scans: 0, weight: 0, co2: 0 };
      // Only patch if values differ
      if (
        user.totalScans !== agg.scans ||
        Math.abs(user.totalWeightDiverted - agg.weight) > 0.01 ||
        Math.abs(user.totalCo2Saved - agg.co2) > 0.01
      ) {
        await ctx.db.patch(user._id, {
          totalScans: agg.scans,
          totalWeightDiverted: Math.round(agg.weight * 100) / 100,
          totalCo2Saved: Math.round(agg.co2 * 100) / 100,
        });
        updated++;
      }
    }

    return { updated, totalUsers: allUsers.length, totalScans: allScans.length };
  },
});
