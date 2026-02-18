/**
 * YAHT Design System — AppText Component
 *
 * A typed Text wrapper that enforces the typography scale from
 * UI_UX_GUIDELINES.md §3. Prevents ad-hoc font sizes in components.
 *
 * Usage:
 *   <AppText variant="heading">My Screen</AppText>
 *   <AppText variant="body" color={colors.textSecondary}>Subtitle</AppText>
 *   <AppText variant="display" tabularNums>42</AppText>
 */
import React from "react";
import { Text, type TextProps, type TextStyle } from "react-native";
import { Typography, type TypographyVariant } from "@/constants/Typography";
import { useTheme } from "@/hooks/useTheme";

interface AppTextProps extends TextProps {
  /** Typography scale variant. Defaults to "body". */
  variant?: TypographyVariant;
  /** Override text color. Defaults to colors.text. */
  color?: string;
  /**
   * Apply tabular-nums font variant — required for changing numbers
   * (timers, counters) per UI_UX_GUIDELINES §3.2 rule 3.
   */
  tabularNums?: boolean;
  children: React.ReactNode;
}

/**
 * Typography-scale-aware Text component.
 *
 * @example
 * <AppText variant="heading">Today</AppText>
 * <AppText variant="caption" color={colors.textSecondary}>3 habits</AppText>
 * <AppText variant="display" tabularNums>{elapsedTime}</AppText>
 */
export default function AppText({
  variant = "body",
  color,
  tabularNums = false,
  style,
  children,
  ...textProps
}: AppTextProps) {
  const { colors } = useTheme();

  const resolvedColor = color ?? colors.text;

  const computedStyle: TextStyle = {
    ...Typography[variant],
    color: resolvedColor,
    ...(tabularNums ? { fontVariant: ["tabular-nums"] } : {}),
  };

  return (
    <Text style={[computedStyle, style]} {...textProps}>
      {children}
    </Text>
  );
}
