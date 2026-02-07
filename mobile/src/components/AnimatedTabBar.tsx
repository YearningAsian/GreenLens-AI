import React, { useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const TAB_ICONS: Record<string, { outline: string; filled: string }> = {
  index: { outline: "home-outline", filled: "home" },
  scan: { outline: "scan-outline", filled: "scan" },
  impact: { outline: "leaf-outline", filled: "leaf" },
  centers: { outline: "location-outline", filled: "location" },
};

export default function AnimatedTabBar({
  state,
  descriptors,
  navigation,
}: TabBarProps) {
  const tabCount = state.routes.length;
  const tabWidth = SCREEN_WIDTH / tabCount;
  const underlineWidth = 36;

  const getUnderlineX = (index: number) =>
    index * tabWidth + (tabWidth - underlineWidth) / 2;

  const translateX = useRef(new Animated.Value(getUnderlineX(state.index))).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: getUnderlineX(state.index),
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
      mass: 0.7,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.container}>
      {/* Green underline */}
      <Animated.View
        style={[
          styles.underline,
          {
            width: underlineWidth,
            transform: [{ translateX }],
          },
        ]}
      />

      {/* Tab buttons */}
      <View style={styles.tabRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;
          const iconSet = TAB_ICONS[route.name] || {
            outline: "ellipse-outline",
            filled: "ellipse",
          };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Ionicons
                name={
                  (isFocused ? iconSet.filled : iconSet.outline) as any
                }
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textLight}
              />
              <Text
                style={[
                  styles.label,
                  {
                    color: isFocused ? COLORS.primary : COLORS.textLight,
                    fontWeight: isFocused ? "700" : "500",
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderTopColor: "#f0f0f0",
    borderTopWidth: 1,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 12,
  },
  underline: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    position: "absolute",
    top: 0,
    left: 0,
  },
  tabRow: {
    flexDirection: "row",
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  label: {
    fontSize: 11,
  },
});
