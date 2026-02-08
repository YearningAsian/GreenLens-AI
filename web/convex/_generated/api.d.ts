/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activityFeed from "../activityFeed.js";
import type * as ai from "../ai.js";
import type * as badges from "../badges.js";
import type * as communityGoals from "../communityGoals.js";
import type * as corrections from "../corrections.js";
import type * as dailyTaskCompletions from "../dailyTaskCompletions.js";
import type * as dailyTasks from "../dailyTasks.js";
import type * as leaderboard from "../leaderboard.js";
import type * as notifications from "../notifications.js";
import type * as recyclingCenters from "../recyclingCenters.js";
import type * as reports from "../reports.js";
import type * as scans from "../scans.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activityFeed: typeof activityFeed;
  ai: typeof ai;
  badges: typeof badges;
  communityGoals: typeof communityGoals;
  corrections: typeof corrections;
  dailyTaskCompletions: typeof dailyTaskCompletions;
  dailyTasks: typeof dailyTasks;
  leaderboard: typeof leaderboard;
  notifications: typeof notifications;
  recyclingCenters: typeof recyclingCenters;
  reports: typeof reports;
  scans: typeof scans;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
