import { CheckCircle, Circle, Minus, Plus, RotateCcw, Timer } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import type { ColorTheme } from "@/constants/Colors";
import type { Habit } from "@/types/habit";
import styles from "../HabitItem.styles";

interface ColorsSubset {
  success: string;
  accent: string;
  textSecondary: string;
  input: string;
  text: string;
}

// Simple habit status indicator
export const HabitStatusIndicator = ({
  isCompleted,
  timerActive,
  completionType,
  colors,
}: {
  isCompleted: boolean;
  timerActive: boolean;
  completionType: string | undefined;
  colors: ColorsSubset;
}) => (
  <View style={styles.statusContainer}>
    {isCompleted ? (
      <CheckCircle size={22} color={colors.success} strokeWidth={2} />
    ) : completionType === "timed" && timerActive ? (
      <Timer size={22} color={colors.accent} strokeWidth={2} />
    ) : (
      <Circle size={22} color={colors.textSecondary} strokeWidth={2} />
    )}
  </View>
);

// Repetition controls
export const RepetitionControls = ({
  completionValue,
  handleIncrement,
  handleDecrement,
  colors,
}: {
  completionValue: number;
  handleIncrement: () => void;
  handleDecrement: () => void;
  colors: ColorsSubset;
}) => (
  <View style={styles.repControlsContainer}>
    <TouchableOpacity
      style={[styles.repButton, { backgroundColor: colors.input }]}
      onPress={handleDecrement}
      accessibilityRole="button"
      accessibilityLabel="Decrease count"
    >
      <Minus size={16} color={colors.textSecondary} strokeWidth={2} />
    </TouchableOpacity>

    <Text style={[styles.repCount, { color: colors.text }]}>{completionValue}</Text>

    <TouchableOpacity
      style={[styles.repButton, { backgroundColor: colors.input }]}
      onPress={handleIncrement}
      accessibilityRole="button"
      accessibilityLabel="Increase count"
    >
      <Plus size={16} color={colors.textSecondary} strokeWidth={2} />
    </TouchableOpacity>
  </View>
);

// Subtitle with icon
export const HabitSubtitle = ({
  habit,
  isCompleted,
  timerActive,
  getSubtitleText,
  colors,
}: {
  habit: Habit;
  isCompleted: boolean;
  timerActive: boolean;
  getSubtitleText: () => string;
  colors: ColorsSubset;
}) => (
  <View style={styles.subtitleContainer}>
    <SubtitleIcon habit={habit} isCompleted={isCompleted} timerActive={timerActive} colors={colors} />
    <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
      {getSubtitleText()}
    </Text>
  </View>
);

export const SubtitleIcon = ({
  habit,
  isCompleted,
  timerActive,
  colors,
}: {
  habit: Habit | null | undefined;
  isCompleted: boolean;
  timerActive: boolean;
  colors: ColorsSubset;
}) => {
  if (!habit) return null;

  switch (habit.completion?.type) {
    case "simple":
      return isCompleted ? (
        <CheckCircle size={16} color={colors.success} strokeWidth={2} />
      ) : (
        <Circle size={16} color={colors.textSecondary} strokeWidth={2} />
      );
    case "repetitions":
      return <RotateCcw size={16} color={isCompleted ? colors.success : colors.textSecondary} strokeWidth={2} />;
    case "timed":
      return (
        <Timer
          size={16}
          color={timerActive ? colors.accent : isCompleted ? colors.success : colors.textSecondary}
          strokeWidth={2}
        />
      );
    default:
      return null;
  }
};
