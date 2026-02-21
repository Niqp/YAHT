import React from "react";
import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useReducedMotion } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { SpringConfig, PressScale } from "@/constants/Animation";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { Elevation } from "@/constants/Elevation";

interface FloatingButtonProps {
  navigateToAddHabit: () => void;
}

export function FloatingButton({ navigateToAddHabit }: FloatingButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (reducedMotion) return;
    scale.value = withSpring(PressScale.fab, SpringConfig.fabPress);
  };

  const handlePressOut = () => {
    if (reducedMotion) return;
    scale.value = withSpring(1, SpringConfig.fabPress);
  };

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: "absolute",
          bottom: Spacing.lg,
          right: Spacing.lg,
        },
      ]}
    >
      <Pressable
        onPress={navigateToAddHabit}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Add a habit"
        accessibilityHint="Opens the habit creation screen"
      >
        <LinearGradient
          colors={[colors.gradientFabStart, colors.gradientFabEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: BorderRadius.full,
            justifyContent: "center",
            alignItems: "center",
            ...Elevation[3],
            shadowColor: colors.shadow,
          }}
        >
          <Plus size={24} color={colors.textInverse} strokeWidth={2} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

