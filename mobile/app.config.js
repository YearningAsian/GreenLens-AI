import "dotenv/config";

export default {
  expo: {
    name: "GreenLens AI",
    slug: "greenlens-ai",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "greenlens",
    splash: {
      backgroundColor: "#22c55e",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "tech.buildgreen.greenlens",
      infoPlist: {
        NSCameraUsageDescription: "GreenLens needs camera access to scan waste materials",
        NSLocationWhenInUseUsageDescription: "GreenLens needs your location to find nearby recycling centers",
      },
      config: {
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#22c55e",
      },
      package: "tech.buildgreen.greenlens",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_COARSE_LOCATION",
      ],
      newArchEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY || "",
        },
      },
    },
    plugins: [
      "expo-router",
      "expo-camera",
      "expo-image-picker",
      "expo-location",
      "expo-asset",
      "expo-font",
      "react-native-maps",
    ],
    extra: {
      router: {},
      eas: {
        projectId: "3faf3255-26cf-4b51-bc3e-3c6697f919ea",
      },
      convexUrl: process.env.CONVEX_URL || "",
    },
  },
};
