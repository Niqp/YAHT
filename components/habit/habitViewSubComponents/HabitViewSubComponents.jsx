import { CheckCircle, Circle, Minus, Plus, RotateCcw, Timer } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import styles from "../HabitItem.styles";

// Simple habit status indicator
export const HabitStatusIndicator = ({ isCompleted, timerActive, completionType, colors }) => (
  <View style={styles.statusContainer}>
    {isCompleted ? (
      <CheckCircle size={22} color={colors.success} />
    ) : completionType === "timed" && timerActive ? (
      <Timer size={22} color={colors.accent} />
    ) : (
      <Circle size={22} color={colors.textSecondary} />
    )}
  </View>
);

// Repetition controls
export const RepetitionControls = ({ completionValue, handleIncrement, handleDecrement, colors }) => (
  <View style={styles.repControlsContainer}>
    <TouchableOpacity style={[styles.repButton, { backgroundColor: colors.input }]} onPress={handleDecrement}>
      <Minus size={16} color={colors.textSecondary} />
    </TouchableOpacity>

    <Text style={[styles.repCount, { color: colors.text }]}>{completionValue}</Text>

    <TouchableOpacity style={[styles.repButton, { backgroundColor: colors.input }]} onPress={handleIncrement}>
      <Plus size={16} color={colors.textSecondary} />
    </TouchableOpacity>
  </View>
);

// Subtitle with icon
export const HabitSubtitle = ({ habit, isCompleted, timerActive, getSubtitleText, colors }) => (
  <View style={styles.subtitleContainer}>
    <SubtitleIcon habit={habit} isCompleted={isCompleted} timerActive={timerActive} colors={colors} />
    <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1} ellipsizeMode="tail">
      {getSubtitleText()}
    </Text>
  </View>
);

export const SubtitleIcon = ({ habit, isCompleted, timerActive, colors }) => {
  if (!habit) return null;

  switch (habit.completionType) {
    case "simple":
      return isCompleted ? (
        <CheckCircle size={16} color={colors.success} />
      ) : (
        <Circle size={16} color={colors.textSecondary} />
      );
    case "repetitions":
      return <RotateCcw size={16} color={isCompleted ? colors.success : colors.textSecondary} />;
    case "timed":
      return (
        <Timer size={16} color={timerActive ? colors.accent : isCompleted ? colors.success : colors.textSecondary} />
      );
    default:
      return null;
  }
};
