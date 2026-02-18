/**
 * YAHT Design System — ScaleButton Component
 *
 * An animated button with spring-based scale press feedback as specified in
 * UI_UX_GUIDELINES.md §5.3 and §9.1.
 *
 * Variants:
 *  - primary: filled with buttonPrimary, optional subtle gradient
 *  - secondary: filled with buttonSecondary, 1px border
 *  - destructive: filled with buttonDestructive
 *  - disabled: uses disabled tokens, no shadow, no animation
 */
import React from "react";
import { StyleSheet, Text, type TextStyle, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useReducedMotion } from "react-native-reanimated";
import { BorderRadius } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { SpringConfig, PressScale } from "@/constants/Animation";
import { useTheme } from "@/hooks/useTheme";

export type ButtonVariant = "primary" | "secondary" | "destructive";

interface ScaleButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Whether to show a subtle gradient on primary buttons. Defaults to true. */
  gradient?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/**
 * A button with spring-based scale press feedback.
 *
 * @example
 * <ScaleButton label="Save Habit" onPress={handleSave} variant="primary" />
 * <ScaleButton label="Delete" onPress={handleDelete} variant="destructive" />
 */
export default function ScaleButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  gradient = true,
  style,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
}: ScaleButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled || reducedMotion) return;
    scale.value = withSpring(PressScale.button, SpringConfig.buttonPress);
  };

  const handlePressOut = () => {
    if (disabled || reducedMotion) return;
    scale.value = withSpring(1, SpringConfig.buttonPress);
  };

  // Resolve colors based on variant and disabled state
  const resolvedBg = disabled
    ? colors.buttonDisabled
    : variant === "primary"
      ? colors.buttonPrimary
      : variant === "secondary"
        ? colors.buttonSecondary
        : colors.buttonDestructive;

  const resolvedTextColor = disabled
    ? colors.buttonDisabledText
    : variant === "primary"
      ? colors.buttonPrimaryText
      : variant === "secondary"
        ? colors.buttonSecondaryText
        : colors.textInverse;

  const showGradient = !disabled && variant === "primary" && gradient;

  const containerStyle: ViewStyle = {
    backgroundColor: resolvedBg,
    borderWidth: variant === "secondary" ? 1 : 0,
    borderColor: variant === "secondary" ? colors.border : "transparent",
    borderRadius: BorderRadius.sm,
  };

  const textStyle: TextStyle = {
    color: resolvedTextColor,
    ...Typography.bodyMedium,
  };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
        style={[styles.button, containerStyle]}
      >
        {showGradient ? (
          <LinearGradient
            colors={[colors.gradientCardStart, colors.gradientCardEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          >
            <Text style={[styles.label, textStyle, labelStyle]}>{label}</Text>
          </LinearGradient>
        ) : (
          <Text style={[styles.label, textStyle, labelStyle]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Ensures the animated scale doesn't clip children
    alignSelf: "stretch",
  },
  button: {
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    textAlign: "center",
  },
});
