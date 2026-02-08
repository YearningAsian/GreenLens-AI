// Backend API — auto-detect dev machine IP from Expo
import Constants from "expo-constants";
import { Platform } from "react-native";

// Your dev machine LAN IP (used when tunnel mode can't auto-detect)
const DEV_MACHINE_IP = "192.168.184.187";

function getApiBaseUrl(): string {
  // Only use production if explicitly built for store (not in Expo Go or dev client)
  const isProduction = Constants.executionEnvironment === "storeClient" && !__DEV__;
  
  if (isProduction) {
    return "https://api.greenlens.org";
  }
  
  // Dev: extract host IP from Expo dev server so physical devices can reach backend
  const debuggerHost =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants as any).manifest?.debuggerHost ??
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    // LAN IP (e.g. 192.168.x.x) — use it directly
    if (host && /^\d+\.\d+\.\d+\.\d+$/.test(host) && host !== "127.0.0.1") {
      return `http://${host}:8000`;
    }
  }
  // Emulator shortcuts
  if (Platform.OS === "android") return `http://10.0.2.2:8000`;
  if (Platform.OS === "ios") return `http://127.0.0.1:8000`;
  // Fallback: hardcoded dev machine LAN IP (for tunnel mode on physical devices)
  return `http://${DEV_MACHINE_IP}:8000`;
}

const API_BASE_URL = getApiBaseUrl();
console.log("[GreenLens] API_BASE_URL =", API_BASE_URL);

// Convex HTTP API for database reads/writes
export const CONVEX_URL = Constants.expoConfig?.extra?.convexUrl || "https://laudable-ermine-139.convex.cloud";
console.log("[GreenLens] CONVEX_URL =", CONVEX_URL);

export const COLORS = {
  primary: "#22c55e",
  primaryDark: "#16a34a",
  primaryLight: "#dcfce7",
  primaryBg: "#f0fdf4",
  white: "#ffffff",
  background: "#f8faf9",
  text: "#1a1a2e",
  textSecondary: "#6b7280",
  textLight: "#9ca3af",
  border: "#e5e7eb",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  violet: "#8b5cf6",
  card: "#ffffff",
  shadow: "rgba(0, 0, 0, 0.05)",
};

// Only 3 categories now
export const CATEGORY_COLORS: Record<string, string> = {
  recyclable: "#22c55e",
  organic: "#f59e0b",
  "non-recyclable": "#ef4444",
};

export const CATEGORY_LABELS: Record<string, string> = {
  recyclable: "Recyclable",
  organic: "Organic",
  "non-recyclable": "Non-Recyclable",
};

export const BADGES: Record<string, { label: string; emoji: string }> = {
  "first-scan": { label: "First Scan", emoji: "🌱" },
  "100-lbs": { label: "100 lbs Club", emoji: "💪" },
  "zero-waste-week": { label: "Zero Waste Week", emoji: "🏆" },
  "eco-champion": { label: "Eco Champion", emoji: "🌍" },
  "ton-diverted": { label: "Ton Diverted", emoji: "🎉" },
};

export { API_BASE_URL };
