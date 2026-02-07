// Use your machine's LAN IP so the mobile device can reach the backend.
// On Android emulator use 10.0.2.2; for Expo Go on a real device use LAN IP.
import Constants from "expo-constants";

const DEV_MACHINE_IP = "192.168.184.187";
const API_BASE_URL =
  Constants.executionEnvironment === "storeClient"
    ? "https://api.greenlens.org"  // production
    : `http://${DEV_MACHINE_IP}:8000`;

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
