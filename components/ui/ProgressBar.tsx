import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

type ProgressBarSize = "sm" | "md";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: ProgressBarSize;
  style?: StyleProp<ViewStyle>;
  trackColor?: string;
  fillColor?: string;
}

const HEIGHT_MAP: Record<ProgressBarSize, number> = {
  sm: Spacing.sm,
  md: Spacing.md,
};

export default function ProgressBar({ value, max = 100, size = "sm", style, trackColor, fillColor }: ProgressBarProps) {
  const { colors } = useTheme();
  const safeMax = max <= 0 ? 100 : max;
  const progress = Math.max(0, Math.min(100, (value / safeMax) * 100));

  return (
    <View
      style={[
        styles.track,
        {
          height: HEIGHT_MAP[size],
          backgroundColor: trackColor ?? colors.surface,
        },
        style,
      ]}
    >
      <View style={[styles.fill, { width: `${progress}%`, backgroundColor: fillColor ?? colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: BorderRadius.xs,
  },
});
