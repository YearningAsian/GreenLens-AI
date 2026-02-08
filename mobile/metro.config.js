// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure platform-specific extensions are resolved (fixes react-native-maps on web)
config.resolver.sourceExts = [
  ...new Set([
    // Platform-specific extensions first (order matters)
    "web.tsx",
    "web.ts",
    "web.jsx",
    "web.js",
    ...config.resolver.sourceExts,
  ]),
];

module.exports = config;
