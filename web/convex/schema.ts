import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  scans: defineTable({
    userId: v.string(),
    userName: v.string(),
    jobSiteId: v.string(),
    jobSiteName: v.string(),
    city: v.string(),
    state: v.optional(v.string()),
    // Categories: "recyclable", "organic", "non-recyclable"
    categories: v.array(
      v.object({
        name: v.string(),
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
    imageUrl: v.optional(v.string()),
    routedToCenter: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
  }).index("by_userId", ["userId"])
    .index("by_jobSiteId", ["jobSiteId"])
    .index("by_city", ["city"])
    .index("by_state", ["state"]),

  jobSites: defineTable({
    name: v.string(),
    city: v.string(),
    state: v.optional(v.string()),
    region: v.string(),
    latitude: v.float64(),
    longitude: v.float64(),
    managerId: v.string(),
    totalScans: v.float64(),
    totalWeightDiverted: v.float64(),
    totalCo2Saved: v.float64(),
    greenScore: v.float64(),
  }).index("by_city", ["city"])
    .index("by_region", ["region"])
    .index("by_state", ["state"]),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("worker"), v.literal("supervisor"), v.literal("executive")),
    jobSiteId: v.string(),
    totalScans: v.float64(),
    totalWeightDiverted: v.float64(),
    totalCo2Saved: v.float64(),
    badges: v.array(v.string()),
    streakDays: v.float64(),
  }).index("by_email", ["email"])
    .index("by_jobSiteId", ["jobSiteId"]),
});
