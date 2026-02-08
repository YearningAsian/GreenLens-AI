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
// LEADERBOARD MUTATIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Rebuild leaderboard from user data. Call periodically or after significant events. */
export const rebuildLeaderboard = mutation({
  args: {
    scope: v.union(v.literal("city"), v.literal("state"), v.literal("national")),
    scopeValue: v.optional(v.string()), // City or state name, null for national
  },
  handler: async (ctx, args) => {
    // Clear existing entries for this scope
    const existing = await ctx.db
      .query("leaderboard")
      .withIndex("by_scope", (q) =>
        q.eq("scope", args.scope).eq("scopeValue", args.scopeValue)
      )
      .collect();

    for (const entry of existing) {
      await ctx.db.delete(entry._id);
    }

    // Get relevant users
    let users;
    if (args.scope === "state" && args.scopeValue) {
      users = await ctx.db
        .query("users")
        .withIndex("by_state", (q) => q.eq("state", args.scopeValue!))
        .collect();
    } else if (args.scope === "city" && args.scopeValue) {
      users = await ctx.db
        .query("users")
        .withIndex("by_city", (q) => q.eq("city", args.scopeValue!))
        .collect();
    } else {
      users = await ctx.db.query("users").collect();
    }

    // Sort by XP descending
    users.sort((a, b) => b.xp - a.xp);

    const now = new Date().toISOString();

    // Insert ranked entries (top 100)
    const top = users.slice(0, 100);
    for (let i = 0; i < top.length; i++) {
      const u = top[i];
      await ctx.db.insert("leaderboard", {
        userId: u.email,
        userName: u.name,
        rank: i + 1,
        xp: u.xp,
        level: u.level,
        totalScans: u.totalScans,
        totalWeightDiverted: u.totalWeightDiverted,
        totalCo2Saved: u.totalCo2Saved,
        streakDays: u.streakDays,
        city: u.city,
        state: u.state,
        role: u.role,
        scope: args.scope,
        scopeValue: args.scopeValue,
        updatedAt: now,
      });
    }

    return { entries: top.length };
  },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEADERBOARD QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const getLeaderboard = query({
  args: {
    scope: v.union(v.literal("city"), v.literal("state"), v.literal("national")),
    scopeValue: v.optional(v.string()),
    limit: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboard")
      .withIndex("by_scope", (q) =>
        q.eq("scope", args.scope).eq("scopeValue", args.scopeValue)
      )
      .collect();

    // Sort by rank
    entries.sort((a, b) => a.rank - b.rank);

    const limited = entries.slice(0, args.limit ?? 25);

    // Apply privacy masking and include profile image
    const result = await Promise.all(
      limited.map(async (entry) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", entry.userId))
          .first();
        
        return {
          ...entry,
          userName: user?.leaderboardPrivacy ? maskName(entry.userName) : entry.userName,
          profileImageUrl: user?.profileImageUrl,
        };
      })
    );

    return result;
  },
});

export const getStateLeaderboard = query({
  args: { state: v.string(), limit: v.optional(v.float64()) },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboard")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .collect();

    // Deduplicate: keep the entry with the best (lowest) rank per user
    const bestPerUser = new Map<string, typeof entries[0]>();
    for (const e of entries) {
      const existing = bestPerUser.get(e.userId);
      if (!existing || e.rank < existing.rank) {
        bestPerUser.set(e.userId, e);
      }
    }

    const deduped = Array.from(bestPerUser.values());
    deduped.sort((a, b) => a.rank - b.rank);

    // Apply privacy masking and include profile image
    const result = await Promise.all(
      deduped.slice(0, args.limit ?? 25).map(async (entry) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", entry.userId))
          .first();
        
        return {
          ...entry,
          userName: user?.leaderboardPrivacy ? maskName(entry.userName) : entry.userName,
          profileImageUrl: user?.profileImageUrl,
        };
      })
    );

    return result;
  },
});

export const getUserRank = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboard")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return entries.length > 0
      ? entries.reduce((best, e) => (e.rank < best.rank ? e : best))
      : null;
  },
});
