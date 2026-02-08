import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

interface StreakFireProps {
  days: number;
  size?: "small" | "large";
}

export default function StreakFire({ days, size = "small" }: StreakFireProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const flickerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (days === 0) return;

    // Pulsing scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.8,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Flicker rotation
    Animated.loop(
      Animated.sequence([
        Animated.timing(flickerAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: -1,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(flickerAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [days]);

  const isLarge = size === "large";
  const iconSize = isLarge ? 38 : 22;
  const containerSize = isLarge ? 64 : 40;

  const flickerRotate = flickerAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-3deg", "0deg", "3deg"],
  });

  // Color intensifies with streak length
  const fireColor =
    days >= 30 ? "#ef4444" : days >= 14 ? "#f97316" : days >= 7 ? "#f59e0b" : "#fbbf24";

  const milestoneLabel = getMilestoneLabel(days);

  if (days === 0) {
    return (
      <View style={[styles.container, isLarge && styles.containerLarge]}>
        <View
          style={[
            styles.iconBg,
            { width: containerSize, height: containerSize, backgroundColor: "#f3f4f6" },
          ]}
        >
          <Ionicons name="flame-outline" size={iconSize} color="#d1d5db" />
        </View>
        <View style={styles.textCol}>
          <Text style={[styles.dayCount, isLarge && styles.dayCountLarge, { color: "#9ca3af" }]}>
            No streak
          </Text>
          <Text style={styles.label}>Scan today to start!</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isLarge && styles.containerLarge]}>
      {/* Animated fire icon */}
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }, { rotate: flickerRotate }],
        }}
      >
        <View style={{ position: "relative" }}>
          {/* Glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                width: containerSize + 12,
                height: containerSize + 12,
                borderRadius: (containerSize + 12) / 2,
                backgroundColor: fireColor,
                opacity: glowAnim,
              },
            ]}
          />
          <View
            style={[
              styles.iconBg,
              {
                width: containerSize,
                height: containerSize,
                backgroundColor: fireColor + "20",
              },
            ]}
          >
            <Ionicons name="flame" size={iconSize} color={fireColor} />
          </View>
        </View>
      </Animated.View>

      {/* Text */}
      <View style={styles.textCol}>
        <Text style={[styles.dayCount, isLarge && styles.dayCountLarge]}>
          {days}-day streak
        </Text>
        {milestoneLabel ? (
          <Text style={[styles.milestone, { color: fireColor }]}>{milestoneLabel}</Text>
        ) : (
          <Text style={styles.label}>Keep it going!</Text>
        )}
      </View>
    </View>
  );
}

function getMilestoneLabel(days: number): string | null {
  if (days >= 100) return "🏆 Legendary!";
  if (days >= 30) return "🔥 On fire! 30+ days";
  if (days >= 14) return "⚡ Two-week warrior!";
  if (days >= 7) return "🌟 One week strong!";
  if (days >= 3) return "💪 Building momentum!";
  return null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  containerLarge: {
    gap: 16,
  },
  iconBg: {
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
    top: -6,
    left: -6,
  },
  textCol: {
    flex: 1,
  },
  dayCount: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  dayCountLarge: {
    fontSize: 20,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  milestone: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 1,
  },
});
