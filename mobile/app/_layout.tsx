import { Stack, useRouter, useSegments, useNavigationContainerRef } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { ToastProvider } from "../src/components/Toast";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import LevelUpOverlay from "../src/components/LevelUpOverlay";

function AuthGate() {
  const { isAuthenticated } = useAuth();
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
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/");
    }
  }, [isAuthenticated, segments, isReady]);

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
