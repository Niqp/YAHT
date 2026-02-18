/**
 * YAHT Design System — PressableCard Component
 *
 * A card-style pressable surface that satisfies UI_UX_GUIDELINES.md §5.2 and §5.3:
 *  - Visually distinguishable from background (background color + optional border + shadow)
 *  - Platform-specific press feedback: ripple on Android, opacity dim on iOS
 *  - Minimum touch area enforced via minHeight
 */
import React from "react";
import { Platform, Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from "react-native";
import { BorderRadius } from "@/constants/Spacing";
import { Elevation } from "@/constants/Elevation";
import { useTheme } from "@/hooks/useTheme";

interface PressableCardProps extends PressableProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** Elevation level for shadow. Defaults to 1. */
  elevation?: 0 | 1 | 2 | 3;
  /** Whether to show a border. Defaults to false. */
  bordered?: boolean;
  /** Override background color. Defaults to colors.cardBackground. */
  backgroundColor?: string;
}

/**
 * A card surface with platform-appropriate press feedback.
 *
 * @example
 * <PressableCard onPress={handlePress} style={{ marginBottom: Spacing.md }}>
 *   <Text>Content</Text>
 * </PressableCard>
 */
export default function PressableCard({
  children,
  style,
  elevation = 1,
  bordered = false,
  backgroundColor,
  ...pressableProps
}: PressableCardProps) {
  const { colors } = useTheme();

  const bg = backgroundColor ?? colors.cardBackground;

  return (
    <Pressable
      {...pressableProps}
      android_ripple={Platform.OS === "android" ? { color: colors.ripple, borderless: false } : undefined}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg,
          borderColor: bordered ? colors.border : "transparent",
          borderWidth: bordered ? 1 : 0,
          ...Elevation[elevation],
          shadowColor: colors.shadow,
        },
        // iOS press feedback — opacity dim
        Platform.OS === "ios" && pressed && styles.pressedIos,
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    // Minimum touch area for list items (56h) is enforced by the consumer,
    // but we set a sensible floor here.
    minHeight: 44,
  },
  pressedIos: {
    opacity: 0.75,
  },
});
