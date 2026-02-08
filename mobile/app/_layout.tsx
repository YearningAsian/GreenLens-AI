// ── Window Polyfill for React Native ──
// Fix: window.addEventListener is not a function
if (typeof window !== 'undefined') {
  if (!window.addEventListener) {
    window.addEventListener = () => {};
  }
  if (!window.removeEventListener) {
    window.removeEventListener = () => {};
  }
}

import { Stack, useRouter, useSegments, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { ToastProvider } from "../src/components/Toast";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import LevelUpOverlay from "../src/components/LevelUpOverlay";

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navRef = useNavigationContainerRef();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (navRef?.isReady()) {
      setIsReady(true);
    }
  });

  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)" || segments[0] === "login";
    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/login");
    } else if (isAuthenticated && !isLoading && inAuthGroup) {
      router.replace("/(tabs)/scan");
    }
  }, [isAuthenticated, isLoading, segments, isReady]);

  // Show loading screen while data is being fetched after login
  if (isLoading) {
    return (
      <View style={loadingStyles.container}>
        <StatusBar style="light" />
        <View style={loadingStyles.content}>
          <View style={loadingStyles.logoCircle}>
            <Ionicons name="leaf" size={44} color="#fff" />
          </View>
          <Text style={loadingStyles.title}>GreenLens AI</Text>
          <ActivityIndicator size="large" color="#22c55e" style={loadingStyles.spinner} />
          <Text style={loadingStyles.message}>Loading your profile...</Text>
          <Text style={loadingStyles.sub}>Syncing data &amp; recycling centers</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f8faf9" },
          animation: "fade",
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f1a12",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  spinner: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    color: "#a3e3b8",
    marginBottom: 6,
  },
  sub: {
    fontSize: 13,
    color: "#6b8f74",
  },
});

export default function RootLayout() {
  // Request location permission early so the prompt appears at app launch
  useEffect(() => {
    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch {}
    })();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGate />
        <LevelUpOverlay />
      </ToastProvider>
    </AuthProvider>
  );
}
