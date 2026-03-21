import { CheckCircle, Circle, PlusCircle, RotateCcw, PlayCircle, PauseCircle, Clock } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
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
      <CheckCircle size={20} color={colors.success} strokeWidth={2} />
    ) : completionType === "timed" ? (
      timerActive ? (
        <PauseCircle size={22} color={colors.accent} strokeWidth={2} />
      ) : (
        <PlayCircle size={22} color={colors.textSecondary} strokeWidth={2} />
      )
    ) : completionType === "repetitions" ? (
      <PlusCircle size={22} color={colors.textSecondary} strokeWidth={2} />
    ) : (
      <Circle size={22} color={colors.textSecondary} strokeWidth={2} />
    )}
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
        <Clock
          size={16}
          color={isCompleted ? colors.success : timerActive ? colors.success : colors.textSecondary}
          strokeWidth={2}
        />
      );
    default:
      return null;
  }
};
