import { API_BASE_URL, CONVEX_URL } from "../constants/theme";
import { File } from "expo-file-system";

/** Read image as base64, with fallback for compatibility */
async function readImageBase64(uri: string): Promise<string> {
  try {
    // New expo-file-system v19 File API
    const file = new File(uri);
    return await file.base64();
  } catch {
    // Fallback: fetch the URI as a blob and convert via FileReader-style
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl.split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/* ── Convex HTTP helpers ── */
async function convexQuery(path: string, args: Record<string, unknown> = {}) {
  const url = `${CONVEX_URL}/api/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) throw new Error(`Convex query failed: ${res.statusText}`);
  const body = await res.json();
  return body.value;
}

async function convexMutation(path: string, args: Record<string, unknown> = {}) {
  const url = `${CONVEX_URL}/api/mutation`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) throw new Error(`Convex mutation failed: ${res.statusText}`);
  const body = await res.json();
  return body.value;
}

async function convexAction(path: string, args: Record<string, unknown> = {}) {
  const url = `${CONVEX_URL}/api/action`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Convex action failed (${res.status}): ${errText}`);
  }
  const body = await res.json();
  return body.value;
}

/* ── Convex DB wrappers ── */
export interface DbUser {
  _id: string;
  name: string;
  email: string;
  role: "volunteer" | "hauler" | "liaison";
  city: string;
  state: string;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate?: string;
  totalScans: number;
  totalWeightDiverted: number;
  totalCo2Saved: number;
  status: string;
  joinedDate: string;
  profileImageUrl?: string;
  leaderboardPrivacy?: boolean;
}

export async function fetchUserByEmail(email: string): Promise<DbUser | null> {
  return convexQuery("users:getUserByEmail", { email });
}

export async function fetchAllUsers(state?: string): Promise<DbUser[]> {
  return convexQuery("users:getAllUsers", state ? { state } : {});
}

export async function fetchUserScans(userId: string) {
  return convexQuery("scans:getScansByUser", { userId });
}

export async function loginUserDb(email: string, passwordHash: string) {
  return convexMutation("users:loginUser", { email, passwordHash });
}

export async function addXpDb(userId: string, amount: number, reason?: string) {
  return convexMutation("users:addXp", { userId, amount, reason });
}

/** Update user stats after a scan (weight, co2, scan count) */
export async function updateUserStatsDb(userId: string, weightDiverted: number, co2Saved: number) {
  return convexMutation("users:updateUserStats", { userId, weightDiverted, co2Saved });
}

/** Save a scan directly to Convex (bypasses backend proxy) */
export async function saveScanDirect(scan: {
  userId: string;
  userName: string;
  locationName: string;
  city: string;
  state: string;
  categories: Array<{ name: string; percentage: number; weight_estimate_lbs: number; co2_saved_kg: number; notes?: string }>;
  totalWeightLbs: number;
  co2SavedKg: number;
  confidence: number;
  summary: string;
  latitude?: number;
  longitude?: number;
  xpAwarded?: number;
}) {
  return convexMutation("scans:recordScan", scan);
}

/** Record a daily task completion in DB */
export async function recordDailyTaskDb(userId: string, taskId: string, xpAwarded: number) {
  return convexMutation("dailyTaskCompletions:recordCompletion", {
    userId,
    date: new Date().toISOString().slice(0, 10),
    taskId,
    xpAwarded,
    completedAt: new Date().toISOString(),
  });
}

/** Update user profile (role, name, etc.) */
export async function updateProfileDb(email: string, updates: { role?: string; name?: string; profileImageUrl?: string; leaderboardPrivacy?: boolean }) {
  return convexMutation("users:updateProfile", { email, ...updates });
}

/** Daily check-in — increments streak if consecutive day */
export async function checkInDb(email: string): Promise<{ streakDays: number; alreadyCheckedIn: boolean } | null> {
  return convexMutation("users:checkIn", { email });
}

/** Fetch community activity feed */
export async function fetchActivityFeed(state?: string, limit?: number) {
  return convexQuery("activityFeed:getRecentActivity", { state, limit: limit ?? 20 });
}

/** Fetch user scan history */
export async function fetchUserScanHistory(userId: string) {
  return convexQuery("scans:getScansByUser", { userId });
}

interface ScanResult {
  categories: Array<{
    name: string;
    percentage: number;
    weight_estimate_lbs: number;
    co2_saved_kg: number;
    notes?: string;
  }>;
  total_weight_estimate_lbs: number;
  co2_saved_kg: number;
  recommended_centers: Array<{
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string;
    matching_categories: string[];
    distance_miles?: number;
    lat?: number;
    lng?: number;
  }>;
  classification_confidence: number;
  timestamp: string;
  summary: string;
  needs_rescan: boolean;
}

export type { ScanResult };

export async function scanWaste(
  imageUri: string,
  latitude?: number,
  longitude?: number
): Promise<ScanResult> {
  // Read image as base64 and send to Convex AI action (no local backend needed)
  const base64 = await readImageBase64(imageUri);

  const filename = imageUri.split("/").pop() || "scan.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  const mimeType = mimeMap[ext] || "image/jpeg";

  return convexAction("ai:classifyWaste", {
    imageBase64: base64,
    mimeType,
    latitude,
    longitude,
  });
}

export async function submitCorrection(
  originalCategories: Array<{ name: string; percentage: number; weight_estimate_lbs: number; co2_saved_kg: number; notes?: string }>,
  correctedCategories: Array<{ name: string; percentage: number; weight_estimate_lbs: number; co2_saved_kg: number; notes?: string }>,
  imageDescription?: string
): Promise<{ message: string; stored: boolean }> {
  // Store correction in Convex DB
  await convexMutation("corrections:submitCorrection", {
    userId: "anonymous",
    originalCategories,
    correctedCategories,
    imageDescription: imageDescription || "",
  });
  return { message: "Correction saved", stored: true };
}

export async function saveScanToDb(scan: {
  userId: string;
  userName: string;
  locationName: string;
  city: string;
  state: string;
  categories: ScanResult["categories"];
  totalWeightLbs: number;
  co2SavedKg: number;
  confidence: number;
  summary: string;
  latitude?: number;
  longitude?: number;
  xpAwarded?: number;
}): Promise<{ message: string; scanId?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scan/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scan),
  });

  if (!response.ok) {
    throw new Error(`Failed to save scan: ${response.statusText}`);
  }

  return response.json();
}

export async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<{
  polyline: string;
  distance: string;
  duration: string;
  steps: Array<{ instruction: string; distance: string; duration: string }>;
}> {
  const url = `${API_BASE_URL}/api/directions?origin_lat=${originLat}&origin_lng=${originLng}&dest_lat=${destLat}&dest_lng=${destLng}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to get directions");
  return response.json();
}

export async function getRecyclingCenters(category?: string, city?: string) {
  // Use Convex instead of backend API for better reliability
  try {
    let centers;
    if (category && category !== "all") {
      // Filter by category
      centers = await convexQuery("recyclingCenters:getCentersByCategory", {
        category,
        state: "Georgia",
      });
    } else if (city) {
      // Filter by city
      centers = await convexQuery("recyclingCenters:getCentersByCity", { city });
    } else {
      // Get all centers for Georgia
      centers = await convexQuery("recyclingCenters:getAllCenters", { state: "Georgia" });
    }
    return { centers, count: centers.length };
  } catch (error) {
    console.error("[API] Failed to fetch centers from Convex:", error);
    throw new Error("Failed to fetch centers");
  }
}
