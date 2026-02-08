import React, { useEffect, useRef } from "react";
import { Animated, Text, TextStyle } from "react-native";

interface AnimatedNumberProps {
  /** The target value to animate to */
  value: number;
  /** Duration of the count animation in ms (default 800) */
  duration?: number;
  /** Format the number (default: toLocaleString) */
  formatter?: (n: number) => string;
  /** Style for the number text */
  style?: TextStyle | TextStyle[];
  /** Optional suffix like " lbs" */
  suffix?: string;
  /** Optional prefix like "$" */
  prefix?: string;
}

export default function AnimatedNumber({
  value,
  duration = 800,
  formatter,
  style,
  suffix = "",
  prefix = "",
}: AnimatedNumberProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayRef = useRef<Text>(null);
  const prevValue = useRef(0);
  const format = formatter ?? ((n: number) => Math.round(n).toLocaleString());

  useEffect(() => {
    const from = prevValue.current;
    prevValue.current = value;

    // If this is the first render (from 0), snap instantly
    if (from === 0 && value > 0) {
      animatedValue.setValue(value);
      return;
    }

    animatedValue.setValue(from);
    Animated.timing(animatedValue, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start();
  }, [value, duration]);

  // Use a listener to update the text directly for smooth animation
  const [displayText, setDisplayText] = React.useState(
    `${prefix}${format(value)}${suffix}`
  );

  useEffect(() => {
    const listenerId = animatedValue.addListener(({ value: v }) => {
      setDisplayText(`${prefix}${format(v)}${suffix}`);
    });
    return () => animatedValue.removeListener(listenerId);
  }, [prefix, suffix, formatter]);

  // Also update when value changes (for static display)
  useEffect(() => {
    setDisplayText(`${prefix}${format(value)}${suffix}`);
  }, [value, prefix, suffix]);

  return (
    <Text ref={displayRef} style={style}>
      {displayText}
    </Text>
  );
}
