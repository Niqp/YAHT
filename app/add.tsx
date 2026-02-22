import { BasicInfoSection, CompletionTypeSection, RepetitionPatternSection, DiscardChangesSheet } from "@/components/habitForm";
import { AppText, ScaleButton } from "@/components/ui";
import { Elevation } from "@/constants/Elevation";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import { CompletionType, Habit, RepetitionConfig, RepetitionType } from "@/types/habit";
import { getCurrentDateStamp } from "@/utils/date";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DEFAULT_ICON = "🌟";
const DEFAULT_REPETITION_GOAL = 5;
const DEFAULT_TIMED_GOAL_MS = 5 * 60 * 1000;

const normalizeDays = (days: number[]) => {
  return [...new Set(days)].filter((day) => day >= 0 && day <= 6).sort((a, b) => a - b);
};

const buildRepetitionConfig = (
  repetitionType: RepetitionType,
  selectedDays: number[],
  customDays: number
): { repetition: RepetitionConfig | null; errorMessage?: string } => {
  switch (repetitionType) {
    case RepetitionType.WEEKDAYS: {
      const normalizedDays = normalizeDays(selectedDays);

      if (normalizedDays.length === 0) {
        return {
          repetition: null,
          errorMessage: "Please select at least one day of the week",
        };
      }

      return {
        repetition: {
          type: RepetitionType.WEEKDAYS,
          days: normalizedDays,
        },
      };
    }
    case RepetitionType.INTERVAL: {
      const normalizedDays = Math.floor(customDays);

      if (!Number.isFinite(normalizedDays) || normalizedDays < 1) {
        return {
          repetition: null,
          errorMessage: "Please enter a valid interval (1 day or more)",
        };
      }

      return {
        repetition: {
          type: RepetitionType.INTERVAL,
          days: normalizedDays,
        },
      };
    }
    case RepetitionType.DAILY:
    default:
      return {
        repetition: { type: RepetitionType.DAILY },
      };
  }
};

const buildCompletionConfig = (completionType: CompletionType, completionGoal: number): Habit["completion"] => {
  switch (completionType) {
    case CompletionType.REPETITIONS:
      return { type: CompletionType.REPETITIONS, goal: completionGoal };
    case CompletionType.TIMED:
      return { type: CompletionType.TIMED, goal: completionGoal };
    case CompletionType.SIMPLE:
    default:
      return { type: CompletionType.SIMPLE };
  }
};

export default function AddEditHabitScreen() {
  const { colors, weekStartDay } = useTheme();
  const params = useLocalSearchParams();
  const habitIdParam = params.habitId;
  const habitId = Array.isArray(habitIdParam) ? habitIdParam[0] : habitIdParam;

  const addHabit = useHabitStore((state) => state.addHabit);
  const updateHabit = useHabitStore((state) => state.updateHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const habit = useHabitStore((state) => (habitId ? state.habits[habitId] : undefined));
  const isEditMode = Boolean(habitId);

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [repetitionType, setRepetitionType] = useState<RepetitionType>(RepetitionType.DAILY);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [customDays, setCustomDays] = useState<number>(1);
  const [completionType, setCompletionType] = useState<CompletionType>(CompletionType.SIMPLE);
  const [repetitionGoal, setRepetitionGoal] = useState<number>(DEFAULT_REPETITION_GOAL);
  const [timedGoalMs, setTimedGoalMs] = useState<number>(DEFAULT_TIMED_GOAL_MS);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasInitializedFormRef = useRef(false);
  const hasHandledMissingHabitRef = useRef(false);
  const [isDiscardSheetOpen, setIsDiscardSheetOpen] = useState(false);

  useEffect(() => {
    hasInitializedFormRef.current = false;
    hasHandledMissingHabitRef.current = false;

    if (!habitId) {
      setTitle("");
      setIcon(DEFAULT_ICON);
      setRepetitionType(RepetitionType.DAILY);
      setSelectedDays([]);
      setCustomDays(1);
      setCompletionType(CompletionType.SIMPLE);
      setRepetitionGoal(DEFAULT_REPETITION_GOAL);
      setTimedGoalMs(DEFAULT_TIMED_GOAL_MS);
      setIsDirty(false);
    }
  }, [habitId]);

  useEffect(() => {
    if (!habitId || !isHydrated || hasInitializedFormRef.current) {
      return;
    }

    if (!habit) {
      if (!hasHandledMissingHabitRef.current) {
        hasHandledMissingHabitRef.current = true;
        Alert.alert("Habit Not Found", "This habit no longer exists.", [
          {
            text: "OK",
            onPress: () => {
              router.replace("/today");
            },
          },
        ]);
      }
      return;
    }

    const nextSelectedDays = habit.repetition.type === RepetitionType.WEEKDAYS ? habit.repetition.days : [];
    const nextCustomDays = habit.repetition.type === RepetitionType.INTERVAL ? habit.repetition.days : 1;
    const nextRepetitionGoal =
      habit.completion.type === CompletionType.REPETITIONS && typeof habit.completion.goal === "number"
        ? habit.completion.goal
        : DEFAULT_REPETITION_GOAL;
    const nextTimedGoalMs =
      habit.completion.type === CompletionType.TIMED && typeof habit.completion.goal === "number"
        ? habit.completion.goal
        : DEFAULT_TIMED_GOAL_MS;

    setTitle(habit.title);
    setIcon(habit.icon);
    setRepetitionType(habit.repetition.type);
    setSelectedDays(nextSelectedDays);
    setCustomDays(nextCustomDays);
    setCompletionType(habit.completion.type);
    setRepetitionGoal(nextRepetitionGoal);
    setTimedGoalMs(nextTimedGoalMs);
    setIsDirty(false);

    hasInitializedFormRef.current = true;
  }, [habit, habitId, isHydrated]);

  const hasUnsavedChanges = isDirty;

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle);
    setIsDirty(true);
  };

  const handleIconChange = (nextIcon: string) => {
    setIcon(nextIcon);
    setIsDirty(true);
  };

  const handleRepetitionTypeChange = (nextType: RepetitionType) => {
    setRepetitionType(nextType);
    setIsDirty(true);
  };

  const handleSelectedDaysChange = (nextDays: number[]) => {
    setSelectedDays(nextDays);
    setIsDirty(true);
  };

  const handleCustomDaysChange = (nextDays: number) => {
    setCustomDays(nextDays);
    setIsDirty(true);
  };

  const handleCompletionTypeChange = (nextType: CompletionType) => {
    setCompletionType(nextType);
    setIsDirty(true);
  };

  const handleCompletionGoalChange = (nextGoal: number) => {
    if (completionType === CompletionType.TIMED) {
      setTimedGoalMs(nextGoal);
    }

    if (completionType === CompletionType.REPETITIONS) {
      setRepetitionGoal(nextGoal);
    }

    setIsDirty(true);
  };

  const resolvedCompletionGoal =
    completionType === CompletionType.TIMED
      ? timedGoalMs
      : completionType === CompletionType.REPETITIONS
        ? repetitionGoal
        : DEFAULT_REPETITION_GOAL;

  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/today");
  };

  const handleCancel = () => {
    if (!hasUnsavedChanges) {
      navigateBack();
      return;
    }

    setIsDiscardSheetOpen(true);
  };

  const handleSave = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedTitle = title.trim();

      if (!normalizedTitle) {
        Alert.alert("Error", "Please enter a title for your habit");
        return;
      }

      if (completionType !== CompletionType.SIMPLE && (!Number.isFinite(resolvedCompletionGoal) || resolvedCompletionGoal <= 0)) {
        Alert.alert("Error", "Please enter a valid completion goal");
        return;
      }

      const { repetition, errorMessage } = buildRepetitionConfig(repetitionType, selectedDays, customDays);
      if (!repetition) {
        Alert.alert("Error", errorMessage || "Please enter a valid repetition pattern");
        return;
      }

      const completion = buildCompletionConfig(completionType, resolvedCompletionGoal);

      if (isEditMode && habitId) {
        await updateHabit(habitId, {
          title: normalizedTitle,
          icon,
          repetition,
          completion,
        });
      } else {
        const habitData: Omit<Habit, "id"> = {
          title: normalizedTitle,
          icon,
          completionHistory: {},
          completion,
          repetition,
          createdAt: getCurrentDateStamp(),
        };

        await addHabit(habitData);
      }

      const { error } = useHabitStore.getState();
      if (error) {
        Alert.alert("Error", error);
        return;
      }

      router.replace("/today");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmedDelete = async () => {
    if (!habitId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await deleteHabit(habitId);

      const { error } = useHabitStore.getState();
      if (error) {
        Alert.alert("Error", error);
        return;
      }

      router.replace("/today");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!isEditMode || !habitId) {
      return;
    }

    Alert.alert("Delete Habit", "Are you sure you want to delete this habit? This action cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void handleConfirmedDelete();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: isEditMode ? "Edit Habit" : "Add New Habit",
          headerStyle: {
            backgroundColor: colors.cardBackground,
          },
          headerTitleStyle: {
            color: colors.text,
          },
          headerTintColor: colors.text,
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introBlock}>
            <AppText variant="title" color={colors.text}>
              {isEditMode ? "Edit habit" : "Create habit"}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.introText}>
              {isEditMode
                ? "Update details and schedule. Existing completion history stays intact."
                : "Set a clear title, repetition pattern, and completion type."}
            </AppText>
          </View>

          <BasicInfoSection title={title} setTitle={handleTitleChange} icon={icon} setIcon={handleIconChange} />

          <RepetitionPatternSection
            repetitionType={repetitionType}
            setRepetitionType={handleRepetitionTypeChange}
            selectedDays={selectedDays}
            setSelectedDays={handleSelectedDaysChange}
            customDays={customDays}
            setCustomDays={handleCustomDaysChange}
            weekStartDay={weekStartDay}
          />

          <CompletionTypeSection
            completionType={completionType}
            setCompletionType={handleCompletionTypeChange}
            completionGoal={resolvedCompletionGoal}
            setCompletionGoal={handleCompletionGoalChange}
            isEditMode={isEditMode}
          />
        </ScrollView>

        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.cardBackground,
              borderTopColor: colors.divider,
              shadowColor: colors.shadow,
            },
            Elevation[2],
          ]}
        >
          <View style={styles.primaryActionsRow}>
            <ScaleButton
              label="Cancel"
              variant="secondary"
              onPress={handleCancel}
              style={styles.cancelButton}
              accessibilityHint="Return to the previous screen without saving"
            />
            <ScaleButton
              label={isEditMode ? "Save Changes" : "Create Habit"}
              onPress={() => {
                void handleSave();
              }}
              style={styles.saveButton}
              disabled={isSubmitting || (isEditMode && !isDirty)}
              accessibilityHint="Save this habit and return to today"
            />
          </View>

          {isEditMode && (
            <ScaleButton
              label="Delete Habit"
              variant="destructive"
              onPress={handleDelete}
              style={styles.deleteButton}
              disabled={isSubmitting}
              accessibilityHint="Delete this habit permanently"
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <DiscardChangesSheet
        isOpen={isDiscardSheetOpen}
        isEditMode={isEditMode}
        onClose={() => setIsDiscardSheetOpen(false)}
        onDiscard={() => {
          setIsDiscardSheetOpen(false);
          navigateBack();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  introBlock: {
    marginBottom: Spacing.lg,
  },
  introText: {
    marginTop: Spacing.xs,
  },
  actionBar: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
  },
  primaryActionsRow: {
    flexDirection: "row",
  },
  cancelButton: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  saveButton: {
    flex: 1,
  },
  deleteButton: {
    marginTop: Spacing.sm,
  },
});
