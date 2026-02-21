import { useHabitProgress } from "@/hooks/habit/useHabitProgress";
import { useHabitDisplay } from "@/hooks/habit/useHabitDisplay";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import { Habit, CompletionType } from "@/types/habit";
import { getEpochMilliseconds } from "@/utils/date";
import { haptic } from "@/utils/haptics";
import { MoreVertical } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useReducedMotion } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { SpringConfig, PressScale } from "@/constants/Animation";
import { Elevation } from "@/constants/Elevation";
import styles from "./HabitItem.styles";
import {
  HabitStatusIndicator,
  HabitSubtitle,
  RepetitionControls,
} from "./habitViewSubComponents/HabitViewSubComponents";

interface HabitItemProps {
  habitId: Habit["id"];
  onLongPress: (habit: Habit) => void;
}

export default function HabitItem({ habitId, onLongPress }: HabitItemProps) {
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

  // Reanimated spring press feedback (replaces old Animated.sequence)
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (reducedMotion) return;
    scale.value = withSpring(PressScale.button, SpringConfig.buttonPress);
  };

  const handlePressOut = () => {
    if (reducedMotion) return;
    scale.value = withSpring(1, SpringConfig.buttonPress);
  };

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
    elapsedTime,
  });

  const handlePress = async () => {
    if (habit?.completion?.type === "simple") {
      await updateCompletion({ id: habit.id });
      // Haptic feedback on completion toggle (§10.4)
      if (!isCompleted) {
        haptic.complete();
      }
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

  const handleIncrement = () => {
    const newValue = (completionValue || 0) + 1;
    updateCompletion({ id: habit.id, value: newValue });
    haptic.complete();
  };

  const handleDecrement = () => {
    if (completionValue <= 0) return;
    const newValue = Math.max(0, (completionValue || 0) - 1);
    updateCompletion({ id: habit.id, value: newValue });
  };

  // Card inner content (shared between gradient and flat variants)
  const cardInner = (
    <>
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
        onPress={habit?.completion?.type !== "repetitions" ? handlePress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => onLongPress(habit)}
        activeOpacity={1}
        disabled={habit?.completion?.type === "repetitions"}
        accessibilityRole="button"
        accessibilityLabel={habit?.title}
        accessibilityState={{ checked: isCompleted }}
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
            <HabitSubtitle
              habit={habit}
              isCompleted={isCompleted}
              timerActive={isTimerActive}
              getSubtitleText={getSubtitleText}
              colors={colors}
            />
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
            <HabitStatusIndicator
              isCompleted={isCompleted}
              timerActive={isTimerActive}
              completionType={habit?.completion?.type}
              colors={colors}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* More options button */}
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => onLongPress(habit)}
        accessibilityRole="button"
        accessibilityLabel="More options"
        accessibilityHint="Opens habit actions menu"
      >
        <MoreVertical size={20} color={colors.textSecondary} strokeWidth={2} />
      </TouchableOpacity>
    </>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        animatedStyle,
        {
          borderColor: colors.border,
          ...Elevation[1],
          shadowColor: colors.shadow,
        },
      ]}
    >
      {isCompleted ? (
        <View style={[styles.contentWrapper, { backgroundColor: colors.successSubtle }]}>{cardInner}</View>
      ) : (
        <LinearGradient
          colors={[colors.gradientCardStart, colors.gradientCardEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.contentWrapper}
        >
          {cardInner}
        </LinearGradient>
      )}
    </Animated.View>
  );
}

