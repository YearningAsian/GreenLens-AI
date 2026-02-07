import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";
import { useAuth, getLevelInfo } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

// Particle positions (pre-calculated for consistent layout)
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  x: Math.cos((i / 14) * Math.PI * 2) * width * 0.38,
  y: Math.sin((i / 14) * Math.PI * 2) * height * 0.22,
  delay: i * 60,
  size: 6 + (i % 3) * 4,
}));

export default function LevelUpOverlay() {
  const { user, pendingLevelUp, clearLevelUp } = useAuth();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particleAnims = useRef(PARTICLES.map(() => new Animated.Value(0))).current;

  const level = user ? getLevelInfo(user.xp).level : 1;

  useEffect(() => {
    if (!pendingLevelUp) return;

    // Reset
    scaleAnim.setValue(0);
    opacityAnim.setValue(0);
    numberAnim.setValue(0);
    glowAnim.setValue(0);
    particleAnims.forEach((a) => a.setValue(0));

    // Sequence: fade in → scale bounce → particles → glow pulse → auto-dismiss
    Animated.sequence([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(numberAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        // Particle burst
        Animated.stagger(
          60,
          particleAnims.map((a) =>
            Animated.timing(a, {
              toValue: 1,
              duration: 700,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          )
        ),
      ]),
      // Glow pulse
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Hold
      Animated.delay(800),
      // Fade out
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      clearLevelUp();
    });
  }, [pendingLevelUp]);

  if (!pendingLevelUp) return null;

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        {/* Particles */}
        {PARTICLES.map((p, i) => (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: i % 2 === 0 ? COLORS.primary : "#facc15",
                opacity: particleAnims[i].interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1, 0],
                }),
                transform: [
                  {
                    translateX: particleAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, p.x],
                    }),
                  },
                  {
                    translateY: particleAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, p.y],
                    }),
                  },
                  {
                    scale: particleAnims[i].interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.5, 0.3],
                    }),
                  },
                ],
              },
            ]}
          />
        ))}

        {/* Main badge */}
        <Animated.View
          style={[
            styles.badge,
            {
              transform: [
                {
                  scale: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.2, 1],
                  }),
                },
              ],
              opacity: glowAnim.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0.9, 0.85, 1],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.glowRing,
              {
                opacity: glowAnim,
                transform: [
                  {
                    scale: glowAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1.3],
                    }),
                  },
                ],
              },
            ]}
          />
          <View style={styles.innerBadge}>
            <Ionicons name="arrow-up" size={28} color="#fff" />
            <Animated.Text
              style={[
                styles.levelNumber,
                {
                  transform: [
                    {
                      scale: numberAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              {level}
            </Animated.Text>
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              opacity: numberAnim,
              transform: [
                {
                  translateY: numberAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          LEVEL UP!
        </Animated.Text>

        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: numberAnim,
              transform: [
                {
                  translateY: numberAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          You reached Level {level}
        </Animated.Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  particle: {
    position: "absolute",
  },
  badge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  glowRing: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  innerBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  levelNumber: {
    fontSize: 42,
    fontWeight: "900",
    color: "#fff",
    marginTop: -4,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    marginTop: 24,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
});
