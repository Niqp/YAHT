import { useHabitProgress } from "@/hooks/habit/useHabitProgress";
import { useHabitDisplay } from "@/hooks/habit/useHabitDisplay";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import { Habit, CompletionType } from "@/types/habit";
import { getEpochMilliseconds } from "@/utils/date";
import { MoreVertical } from "lucide-react-native";
import React, { useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import styles from "./HabitItem.styles";
import { HabitStatusIndicator, HabitSubtitle, RepetitionControls } from "./habitViewSubComponents/HabitViewSubComponents";

interface HabitItemProps {
  habitId: Habit["id"];
  onLongPress: (habit: Habit) => void;
}

export default function HabitItem({ habitId, onLongPress }: HabitItemProps) {
  // Fail early if habit is undefined
  if (!habitId) return null;

  const habit = useHabitStore((state) => state.habits[habitId]);
  const { colors } = useTheme();
  const selectedDate = useHabitStore((state) => state.selectedDate);
  const updateCompletion = useHabitStore((state) => state.updateCompletion);
  const startTimer = useHabitStore((state) => state.activateTimer);
  const removeTimer = useHabitStore((state) => state.removeTimer);
  const timer = useHabitStore((state) => state.activeTimers[habitId]?.[selectedDate]);
  const timerRenderTickMs = useHabitStore((state) => state.timerRenderTickMs);
  const isTimerActive = !!timer?.lastResumedAt;
  const elapsedTime = React.useMemo(() => {
    if (!timer?.lastResumedAt || !isTimerActive) return 0;
    const resumeMs = getEpochMilliseconds(timer.lastResumedAt);
    return Math.max(0, timerRenderTickMs - resumeMs);
  }, [isTimerActive, timer?.lastResumedAt, timerRenderTickMs]);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Get completion status data
  const completionToday = habit?.completionHistory[selectedDate];
  const completionValue = completionToday?.value || 0;
  const isCompleted = completionToday?.isCompleted || false;
  const completionType = habit?.completion?.type;
  const completionGoal = completionType === CompletionType.SIMPLE ? 0 : habit?.completion?.goal || 0;

  const progress = useHabitProgress({
    habit,
    isCompleted,
    completionValue,
    completionGoal,
    isTimerActive,
    elapsedTime,
  });

  const progressBarWidth = `${progress}%`;

  const { getSubtitleText } = useHabitDisplay({
    habit,
    isCompleted,
    completionValue,
    completionGoal,
    isTimerActive,
    elapsedTime,
  });

  // Handle main press action with animation
  const handlePress = async () => {
    // Animate the press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (habit?.completion?.type === "simple") {
      // For simple habits, toggle completion
      await updateCompletion({ id: habit.id });
    } else if (habit?.completion?.type === "timed") {
      if (!isTimerActive) {
        startTimer(habit.id, selectedDate);
      } else {
        removeTimer(habit.id, selectedDate);
      }
    } else if (habit?.completion?.type === "repetitions") {
      handleIncrement();
    }
  };

  // Handle increment for repetition habits
  const handleIncrement = () => {
    const newValue = (completionValue || 0) + 1;
    updateCompletion({ id: habit.id, value: newValue });
  };

  // Handle decrement for repetition habits
  const handleDecrement = () => {
    if (completionValue <= 0) return;
    const newValue = Math.max(0, (completionValue || 0) - 1);
    updateCompletion({ id: habit.id, value: newValue });
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.habitBackground,
          borderColor: colors.border,
          transform: [{ scale: scaleAnim }],
        },
        isCompleted && { backgroundColor: colors.habitCompleted },
      ]}
    >
      {/* Progress indicator */}
      <View
        style={[
          styles.progressBar,
          {
            width: Number(progressBarWidth),
            backgroundColor: isCompleted ? colors.success : colors.primary,
            opacity: 0.15,
          },
        ]}
      />

      <TouchableOpacity
        style={styles.mainContent}
        onPress={habit?.completion?.type !== "repetitions" ? handlePress : handlePress}
        onLongPress={() => onLongPress(habit)}
        activeOpacity={0.7}
        disabled={habit?.completion?.type === "repetitions"}
      >
        {/* Left section - Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.input }]}>
          <Text style={styles.iconText}>{habit.icon}</Text>
        </View>

        {/* Middle section - Title and Subtitle */}
        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
            {habit.title}
          </Text>
          {habit?.completion?.type !== "simple" && (
            <HabitSubtitle habit={habit} isCompleted={isCompleted} timerActive={isTimerActive} getSubtitleText={getSubtitleText} colors={colors} />
          )}
        </View>

        {/* Right section - Action buttons or completion indicator */}
        <View style={styles.actionButtons}>
          {habit?.completion?.type === "repetitions" ? (
            <RepetitionControls
              completionValue={completionValue}
              handleIncrement={handleIncrement}
              handleDecrement={handleDecrement}
              colors={colors}
            />
          ) : (
            <HabitStatusIndicator isCompleted={isCompleted} timerActive={isTimerActive} completionType={habit?.completion?.type} colors={colors} />
          )}
        </View>
      </TouchableOpacity>

      {/* More options button */}
      <TouchableOpacity style={styles.moreButton} onPress={() => onLongPress(habit)}>
        <MoreVertical size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}
