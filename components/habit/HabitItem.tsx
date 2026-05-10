import { useHabitProgress } from "@/hooks/habit/useHabitProgress";
import { useHabitDisplay } from "@/hooks/habit/useHabitDisplay";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import { Habit, CompletionType } from "@/types/habit";
import type { HabitPresentationStatus } from "@/utils/habitPresentation";
import { getEpochMilliseconds } from "@/utils/date";
import { haptic } from "@/utils/haptics";
import { MoreVertical } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";
import { SpringConfig, PressScale } from "@/constants/Animation";
import { getElevation } from "@/constants/Elevation";
import styles from "./HabitItem.styles";
import { HabitStatusIndicator, HabitSubtitle } from "./habitViewSubComponents/HabitViewSubComponents";
import { useTranslation } from "@/i18n";

interface HabitItemProps {
  habitId: Habit["id"];
  onLongPress: (habit: Habit) => void;
  presentationStatus?: HabitPresentationStatus;
}

export default function HabitItem({ habitId, onLongPress, presentationStatus = "normal" }: HabitItemProps) {
  if (!habitId) return null;

  const habit = useHabitStore((state) => state.habits[habitId]);
  const { colors, timedHabitGoalBehavior } = useTheme();
  const { t } = useTranslation();
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
  const pulseOpacity = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
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
  const isTimedHabit = completionType === CompletionType.TIMED;
  const isActiveTimedHabit = isTimedHabit && isTimerActive;
  const timerHighlightColor = isCompleted ? colors.success : colors.accent;
  const isScheduledPresentation = presentationStatus === "scheduled";
  const isMissedPresentation = presentationStatus === "missed";

  React.useEffect(() => {
    if (!isActiveTimedHabit) {
      cancelAnimation(pulseOpacity);
      pulseOpacity.value = 0;
      return;
    }

    if (reducedMotion) {
      pulseOpacity.value = 0.1;
      return;
    }

    pulseOpacity.value = withRepeat(withTiming(0.18, { duration: 900 }), -1, true);
  }, [isActiveTimedHabit, pulseOpacity, reducedMotion]);

  const progress = useHabitProgress({
    habit,
    isCompleted,
    completionValue,
    completionGoal,
    isTimerActive,
    elapsedTime,
  });

  const progressBarWidth = `${progress}%` as const;
  const presentationFillWidth = isMissedPresentation ? "100%" : progressBarWidth;
  const presentationFillColor = isMissedPresentation
    ? colors.dangerSoftBg
    : isCompleted
      ? colors.success
      : colors.accent;
  const presentationFillOpacity = isMissedPresentation ? 1 : 0.15;

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
      if (isCompleted && timedHabitGoalBehavior === "stop") {
        return;
      }

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

  // Card inner content shared by all completion states.
  const cardInner = (
    <>
      {/* Progress indicator */}
      <View
        testID={`habit-item-progress-${habitId}`}
        style={[
          styles.progressBar,
          {
            width: presentationFillWidth,
            backgroundColor: presentationFillColor,
            opacity: presentationFillOpacity,
          },
        ]}
      />

      <TouchableOpacity
        style={styles.mainContent}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={() => onLongPress(habit)}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={habit?.title}
        accessibilityState={{ checked: isCompleted }}
      >
        {/* Left section - Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isMissedPresentation
                ? colors.dangerSoftBg
                : isCompleted
                  ? colors.successSoftBg
                  : colors.bgInset,
              borderColor: isMissedPresentation
                ? colors.dangerSoftBorder
                : isCompleted
                  ? colors.successSoftBorder
                  : colors.borderSubtle,
            },
          ]}
        >
          <Text style={styles.iconText}>{habit.icon}</Text>
        </View>

        {/* Middle section - Title and Subtitle */}
        <View style={styles.infoContainer}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
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
          <HabitStatusIndicator
            isCompleted={isCompleted}
            timerActive={isTimerActive}
            completionType={habit?.completion?.type}
            colors={colors}
          />
        </View>
      </TouchableOpacity>

      {/* More options button */}
      <TouchableOpacity
        style={styles.moreButton}
        onPress={() => onLongPress(habit)}
        accessibilityRole="button"
        accessibilityLabel={t("habits.moreOptions")}
        accessibilityHint={t("habits.moreOptionsHint")}
      >
        <MoreVertical size={20} color={colors.iconPrimary} strokeWidth={2} />
      </TouchableOpacity>
    </>
  );

  return (
    <Animated.View
      testID={`habit-item-${habitId}`}
      style={[
        styles.container,
        animatedStyle,
        {
          borderColor: isMissedPresentation
            ? colors.dangerSoftBorder
            : isActiveTimedHabit
              ? timerHighlightColor
              : isCompleted
                ? colors.success
                : colors.borderDefault,
          backgroundColor: colors.bgSurface,
          opacity: isScheduledPresentation ? 0.55 : 1,
          ...getElevation(1, colors.shadow),
        },
      ]}
    >
      <View
        testID={`habit-item-content-${habitId}`}
        style={[
          styles.contentWrapper,
          {
            backgroundColor: colors.bgSurface,
          },
        ]}
      >
        {cardInner}
        {isActiveTimedHabit ? (
          <Animated.View
            pointerEvents="none"
            style={[styles.timerPulseOverlay, { backgroundColor: timerHighlightColor }, pulseStyle]}
          />
        ) : null}
      </View>
    </Animated.View>
  );
}
