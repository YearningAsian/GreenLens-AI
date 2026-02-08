import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// ── GreenLens AI — Full Production Schema ────────────────────────
// Covers: Auth, Scans, XP/Leveling, Badges, Daily Tasks,
//         Corrections, Recycling Centers, Leaderboard,
//         Notifications, Activity Feed, Community Goals, Reports
// ──────────────────────────────────────────────────────────────────

export default defineSchema({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. USERS — Authentication, profiles, XP/leveling, streaks
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  users: defineTable({
    // Identity
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    profileImageUrl: v.optional(v.string()),
    role: v.union(
      v.literal("volunteer"),
      v.literal("hauler"),
      v.literal("liaison")
    ),
    // Location
    city: v.string(),
    state: v.string(),
    // Gamification
    xp: v.float64(),
    level: v.float64(),
    streakDays: v.float64(),
    lastActiveDate: v.string(), // ISO date "YYYY-MM-DD" for streak tracking
    // Aggregated stats (denormalized for fast reads)
    totalScans: v.float64(),
    totalWeightDiverted: v.float64(),
    totalCo2Saved: v.float64(),
    // Status
    status: v.union(v.literal("active"), v.literal("inactive")),
    joinedDate: v.string(),
    // Privacy
    leaderboardPrivacy: v.optional(v.boolean()), // If true, name is masked as "F**** L****"
  })
    .index("by_email", ["email"])
    .index("by_city", ["city"])
    .index("by_state", ["state"])
    .index("by_xp", ["xp"])
    .index("by_level", ["level"])
    .index("by_role", ["role"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. SCANS — Every AI classification from mobile
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  scans: defineTable({
    userId: v.string(),
    userName: v.string(),
    locationName: v.string(),
    city: v.string(),
    state: v.string(),
    // Classification results
    categories: v.array(
      v.object({
        name: v.string(), // "recyclable" | "organic" | "non-recyclable"
        percentage: v.float64(),
        weight_estimate_lbs: v.float64(),
        co2_saved_kg: v.float64(),
        notes: v.optional(v.string()),
      })
    ),
    totalWeightLbs: v.float64(),
    co2SavedKg: v.float64(),
    confidence: v.float64(),
    summary: v.string(),
    // Media
    imageUrl: v.optional(v.string()),
    // Routing
    routedToCenter: v.optional(v.string()), // centerId or name
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    // Corrections
    wasCorrected: v.optional(v.boolean()),
    correctionId: v.optional(v.id("corrections")),
    // XP awarded for this scan
    xpAwarded: v.optional(v.float64()),
    // Timestamp override (for seed data with specific dates)
    scannedAt: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_city", ["city"])
    .index("by_state", ["state"])
    .index("by_scannedAt", ["scannedAt"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. CORRECTIONS — User feedback on AI classifications
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  corrections: defineTable({
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
    submittedAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_scanId", ["scanId"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. BADGES — Achievement definitions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  badges: defineTable({
    badgeId: v.string(), // "first-scan", "100-lbs", etc.
    label: v.string(), // "First Scan"
    emoji: v.string(), // "🌱"
    description: v.string(),
    // Unlock criteria (for auto-awarding logic)
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
    criteriaValue: v.float64(), // e.g. 1 for first-scan, 100 for 100-lbs
    xpReward: v.float64(), // XP granted when badge is earned
    sortOrder: v.float64(), // display order
  }).index("by_badgeId", ["badgeId"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. USER BADGES — Earned badges (many-to-many)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  userBadges: defineTable({
    userId: v.string(),
    badgeId: v.string(), // references badges.badgeId
    earnedAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_badgeId", ["badgeId"])
    .index("by_user_badge", ["userId", "badgeId"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. DAILY TASKS — Per-user daily task completions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  dailyTaskCompletions: defineTable({
    userId: v.string(),
    date: v.string(), // "YYYY-MM-DD"
    taskId: v.string(), // "login" | "scan" | "impact" | "center_visit" | "correction"
    xpAwarded: v.float64(),
    completedAt: v.string(),
  })
    .index("by_user_date", ["userId", "date"])
    .index("by_userId", ["userId"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. RECYCLING CENTERS — Cached from backend scraper
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  recyclingCenters: defineTable({
    centerId: v.string(), // e.g. "athens-recycling"
    name: v.string(),
    city: v.string(),
    state: v.string(),
    address: v.string(),
    phone: v.optional(v.string()),
    accepts: v.array(v.string()), // ["recyclable", "organic"]
    lat: v.float64(),
    lng: v.float64(),
    source: v.union(
      v.literal("verified"),
      v.literal("scraped"),
      v.literal("user_submitted")
    ),
    hours: v.optional(v.string()),
    website: v.optional(v.string()),
    lastVerified: v.optional(v.string()),
  })
    .index("by_centerId", ["centerId"])
    .index("by_city", ["city"])
    .index("by_state", ["state"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. NOTIFICATIONS — In-app notifications for users
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  notifications: defineTable({
    userId: v.string(),
    type: v.union(
      v.literal("badge_earned"),
      v.literal("level_up"),
      v.literal("streak_milestone"),
      v.literal("community_goal"),
      v.literal("correction_thanked"),
      v.literal("weekly_summary"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    icon: v.optional(v.string()), // Ionicons name or emoji
    read: v.boolean(),
    actionUrl: v.optional(v.string()), // deep link e.g. "/impact"
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. ACTIVITY FEED — Social/audit log of all user actions
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  activityFeed: defineTable({
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
    metadata: v.optional(v.string()), // JSON string for extra data
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_state", ["state"])
    .index("by_city", ["city"])
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. COMMUNITY GOALS — Shared targets for cities/states
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  communityGoals: defineTable({
    title: v.string(),
    description: v.string(),
    // Scope
    scope: v.union(
      v.literal("city"),
      v.literal("state"),
      v.literal("national")
    ),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    // Targets
    targetType: v.union(
      v.literal("weight_diverted"),
      v.literal("co2_saved"),
      v.literal("scan_count"),
      v.literal("volunteer_count"),
      v.literal("diversion_rate")
    ),
    targetValue: v.float64(),
    currentValue: v.float64(),
    // Timeline
    startDate: v.string(),
    endDate: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("expired")
    ),
    // Reward
    xpReward: v.float64(), // XP per participant on completion
    badgeReward: v.optional(v.string()), // badgeId to award
  })
    .index("by_status", ["status"])
    .index("by_state", ["state"])
    .index("by_city", ["city"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 11. REPORTS — Saved ESG report snapshots
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  reports: defineTable({
    title: v.string(),
    state: v.string(),
    period: v.string(), // "Q1 2026", "Jan 2026", etc.
    // Snapshot metrics
    totalScans: v.float64(),
    totalWeightDiverted: v.float64(),
    totalCo2Saved: v.float64(),
    diversionRate: v.float64(), // 0-100
    activeVolunteers: v.float64(),
    // Breakdowns (JSON strings for flexible structure)
    categoryBreakdown: v.string(), // JSON: {recyclable: lbs, organic: lbs, ...}
    cityBreakdown: v.string(), // JSON: [{city, scans, weight, co2}]
    monthlyTrend: v.string(), // JSON: [{month, co2, diverted, landfill}]
    // Meta
    generatedAt: v.string(),
    generatedBy: v.optional(v.string()), // userId of who generated
  })
    .index("by_state", ["state"])
    .index("by_period", ["period"]),

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 12. LEADERBOARD — Cached leaderboard snapshots (updated periodically)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  leaderboard: defineTable({
    userId: v.string(),
    userName: v.string(),
    rank: v.float64(),
    xp: v.float64(),
    level: v.float64(),
    totalScans: v.float64(),
    totalWeightDiverted: v.float64(),
    totalCo2Saved: v.float64(),
    streakDays: v.float64(),
    city: v.string(),
    state: v.string(),
    role: v.string(),
    // Scope of this leaderboard entry
    scope: v.union(
      v.literal("city"),
      v.literal("state"),
      v.literal("national")
    ),
    scopeValue: v.optional(v.string()), // city name or state name
    updatedAt: v.string(),
  })
    .index("by_scope", ["scope", "scopeValue"])
    .index("by_state", ["state"])
    .index("by_rank", ["rank"])
    .index("by_userId", ["userId"]),
});
