import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BADGE MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const createBadge = mutation({
  args: {
    badgeId: v.string(),
    label: v.string(),
    emoji: v.string(),
    description: v.string(),
    criteriaType: v.union(
      v.literal("scan_count"),
      v.literal("weight_diverted"),
      v.literal("co2_saved"),
      v.literal("streak_days"),
      v.literal("location_count"),
      v.literal("correction_count"),
      v.literal("level_reached"),
      v.literal("manual")
    ),
    criteriaValue: v.float64(),
    xpReward: v.float64(),
    sortOrder: v.float64(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("badges", args);
  },
});

export const awardBadge = mutation({
  args: {
    userId: v.string(),
    badgeId: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already earned
    const existing = await ctx.db
      .query("userBadges")
      .withIndex("by_user_badge", (q) =>
        q.eq("userId", args.userId).eq("badgeId", args.badgeId)
      )
      .first();
    if (existing) return null; // Already has this badge

    const badge = await ctx.db
      .query("badges")
      .withIndex("by_badgeId", (q) => q.eq("badgeId", args.badgeId))
      .first();
    if (!badge) return null;

    const now = new Date().toISOString();

    await ctx.db.insert("userBadges", {
      userId: args.userId,
      badgeId: args.badgeId,
      earnedAt: now,
    });

    // Notify user
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "badge_earned",
      title: `Badge Earned: ${badge.label} ${badge.emoji}`,
      message: badge.description,
      icon: "ribbon",
      read: false,
      actionUrl: "/impact",
      createdAt: now,
    });

    // Log activity
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userId))
      .first();

    await ctx.db.insert("activityFeed", {
      userId: args.userId,
      userName: user?.name ?? "Unknown",
      type: "badge_earned",
      description: `Earned the "${badge.label}" badge ${badge.emoji}`,
      city: user?.city,
      state: user?.state,
      createdAt: now,
    });

    return { badge, xpReward: badge.xpReward };
  },
});

/** Check all badges for a user and auto-award any newly earned ones */
export const checkAndAwardBadges = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userId))
      .first();
    if (!user) return [];

    const allBadges = await ctx.db.query("badges").collect();
    const earnedBadges = await ctx.db
      .query("userBadges")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const earnedIds = new Set(earnedBadges.map((b) => b.badgeId));

    // Count distinct locations
    const userScans = await ctx.db
      .query("scans")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const locationCount = new Set(userScans.map((s) => s.locationName)).size;

    // Count corrections
    const corrections = await ctx.db
      .query("corrections")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const awarded: string[] = [];

    for (const badge of allBadges) {
      if (earnedIds.has(badge.badgeId)) continue;

      let earned = false;
      switch (badge.criteriaType) {
        case "scan_count":
          earned = user.totalScans >= badge.criteriaValue;
          break;
        case "weight_diverted":
          earned = user.totalWeightDiverted >= badge.criteriaValue;
          break;
        case "co2_saved":
          earned = user.totalCo2Saved >= badge.criteriaValue;
          break;
        case "streak_days":
          earned = user.streakDays >= badge.criteriaValue;
          break;
        case "location_count":
          earned = locationCount >= badge.criteriaValue;
          break;
        case "correction_count":
          earned = corrections.length >= badge.criteriaValue;
          break;
        case "level_reached":
          earned = user.level >= badge.criteriaValue;
          break;
        case "manual":
          break; // Must be manually awarded
      }

      if (earned) {
        const now = new Date().toISOString();
        await ctx.db.insert("userBadges", {
          userId: args.userId,
          badgeId: badge.badgeId,
          earnedAt: now,
        });

        await ctx.db.insert("notifications", {
          userId: args.userId,
          type: "badge_earned",
          title: `Badge Earned: ${badge.label} ${badge.emoji}`,
          message: badge.description,
          icon: "ribbon",
          read: false,
          actionUrl: "/impact",
          createdAt: now,
        });

        awarded.push(badge.badgeId);
      }
    }

    return awarded;
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BADGE QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getAllBadges = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("badges").collect();
  },
});

export const getUserBadges = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const earned = await ctx.db
      .query("userBadges")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const allBadges = await ctx.db.query("badges").collect();
    const badgeMap = Object.fromEntries(allBadges.map((b) => [b.badgeId, b]));

    return earned.map((ub) => ({
      ...badgeMap[ub.badgeId],
      earnedAt: ub.earnedAt,
      earned: true,
    }));
  },
});

/** Get all badges with earned status for a user */
export const getBadgesWithStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const allBadges = await ctx.db.query("badges").collect();
    const earned = await ctx.db
      .query("userBadges")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const earnedMap = Object.fromEntries(earned.map((e) => [e.badgeId, e.earnedAt]));

    return allBadges
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((badge) => ({
        ...badge,
        earned: !!earnedMap[badge.badgeId],
        earnedAt: earnedMap[badge.badgeId] ?? null,
      }));
  },
});
