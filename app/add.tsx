import {
  BasicInfoSection,
  CompletionTypeSection,
  RepetitionPatternSection,
  DiscardChangesSheet,
  SheetTriggerCard,
} from "@/components/habitForm";
import { AppBottomSheet, AppText, ScaleButton } from "@/components/ui";
import { WheelPicker } from "@/components/ui/form";
import { Elevation } from "@/constants/Elevation";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import { CompletionType, Habit, RepetitionConfig, RepetitionType } from "@/types/habit";
import { getCurrentDateStamp } from "@/utils/date";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { CalendarDays, CheckSquare } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const DEFAULT_ICON = "🌟";
const DEFAULT_REPETITION_GOAL = 5;
const DEFAULT_TIMED_GOAL_MS = 5 * 60 * 1000;
const WEEKDAY_SHORT_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WARMUP_REPETITION_OPTIONS = Array.from({ length: 100 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1} reps`,
}));
const WARMUP_INTERVAL_OPTIONS = Array.from({ length: 365 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1} days`,
}));
const WARMUP_HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => ({
  value: index,
  label: index === 1 ? "1 hr" : `${index} hrs`,
}));
const WARMUP_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) => ({
  value: index,
  label: index === 1 ? "1 min" : `${index} min`,
}));

type AddSheetKey = "completion" | "repetition";

const formatCountLabel = (count: number, singular: string, plural: string) => {
  return `${count} ${count === 1 ? singular : plural}`;
};

const formatDurationLabel = (durationMs: number) => {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${formatCountLabel(hours, "hr", "hrs")} ${formatCountLabel(minutes, "min", "min")}`;
  }

  if (hours > 0) {
    return formatCountLabel(hours, "hr", "hrs");
  }

  return formatCountLabel(minutes, "min", "min");
};

const getCompletionSummary = (completionType: CompletionType, repetitionGoal: number, timedGoalMs: number) => {
  switch (completionType) {
    case CompletionType.REPETITIONS:
      return formatCountLabel(repetitionGoal, "rep", "reps");
    case CompletionType.TIMED:
      return formatDurationLabel(timedGoalMs);
    case CompletionType.SIMPLE:
    default:
      return "Simple check-off";
  }
};

const getCompletionHelperText = (completionType: CompletionType) => {
  switch (completionType) {
    case CompletionType.REPETITIONS:
      return "Count toward a repetition goal";
    case CompletionType.TIMED:
      return "Track elapsed time to completion";
    case CompletionType.SIMPLE:
    default:
      return "Single tap completes the habit";
  }
};

const getRepetitionSummary = (repetitionType: RepetitionType, selectedDays: number[], customDays: number) => {
  switch (repetitionType) {
    case RepetitionType.WEEKDAYS: {
      const labels = normalizeDays(selectedDays).map((day) => WEEKDAY_SHORT_LABELS[day]);

      if (labels.length === 0) {
        return "Pick at least one day";
      }

      return labels.join(" ");
    }
    case RepetitionType.INTERVAL:
      return customDays === 1 ? "Every day" : `Every ${customDays} days`;
    case RepetitionType.DAILY:
    default:
      return "Daily";
  }
};

const getRepetitionHelperText = (repetitionType: RepetitionType) => {
  switch (repetitionType) {
    case RepetitionType.WEEKDAYS:
      return "Only show the habit on selected weekdays";
    case RepetitionType.INTERVAL:
      return "Space the habit by a repeating interval";
    case RepetitionType.DAILY:
    default:
      return "Keep it due every day";
  }
};

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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
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
  const [titleError, setTitleError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<AddSheetKey | null>(null);
  const [shouldWarmPickers, setShouldWarmPickers] = useState(false);

  const hasInitializedFormRef = useRef(false);
  const hasHandledMissingHabitRef = useRef(false);
  const [isDiscardSheetOpen, setIsDiscardSheetOpen] = useState(false);
  const settingsSheetRef = useRef<BottomSheet>(null);

  const availableHeight = windowHeight - insets.top - insets.bottom;
  const maxSheetContentSize = Math.max(availableHeight - Spacing.xxl, 320);

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
      setTitleError(null);
      setScheduleError(null);
      setCompletionError(null);
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
    setTitleError(null);
    setScheduleError(null);
    setCompletionError(null);

    hasInitializedFormRef.current = true;
  }, [habit, habitId, isHydrated]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    let interactionTask: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;
    const timeoutId = setTimeout(() => {
      interactionTask = InteractionManager.runAfterInteractions(() => {
        setShouldWarmPickers(true);
      });
    }, 350);

    return () => {
      clearTimeout(timeoutId);
      interactionTask?.cancel();
    };
  }, []);

  const hasUnsavedChanges = isDirty;

  const handleTitleChange = useCallback((nextTitle: string) => {
    setTitle(nextTitle);
    if (nextTitle.trim()) {
      setTitleError(null);
    }
    setIsDirty(true);
  }, []);

  const handleIconChange = useCallback((nextIcon: string) => {
    setIcon(nextIcon);
    setIsDirty(true);
  }, []);

  const handleRepetitionTypeChange = useCallback((nextType: RepetitionType) => {
    setRepetitionType(nextType);
    setScheduleError(null);
    setIsDirty(true);
  }, []);

  const handleSelectedDaysChange = useCallback((nextDays: number[]) => {
    setSelectedDays(nextDays);
    if (nextDays.length > 0) {
      setScheduleError(null);
    }
    setIsDirty(true);
  }, []);

  const handleCustomDaysChange = useCallback((nextDays: number) => {
    setCustomDays(nextDays);
    if (nextDays >= 1) {
      setScheduleError(null);
    }
    setIsDirty(true);
  }, []);

  const handleCompletionTypeChange = useCallback((nextType: CompletionType) => {
    setCompletionType(nextType);
    setCompletionError(null);
    setIsDirty(true);
  }, []);

  const handleCompletionGoalChange = useCallback(
    (nextGoal: number) => {
      if (completionType === CompletionType.TIMED) {
        setTimedGoalMs(nextGoal);
      }

      if (completionType === CompletionType.REPETITIONS) {
        setRepetitionGoal(nextGoal);
      }

      setIsDirty(true);
      setCompletionError(null);
    },
    [completionType]
  );

  const openCompletionSheet = useCallback(() => {
    setActiveSheet("completion");
  }, []);

  const closeSettingsSheet = useCallback(() => {
    settingsSheetRef.current?.close();
  }, []);

  const openRepetitionSheet = useCallback(() => {
    setActiveSheet("repetition");
  }, []);

  const resolvedCompletionGoal =
    completionType === CompletionType.TIMED
      ? timedGoalMs
      : completionType === CompletionType.REPETITIONS
        ? repetitionGoal
        : DEFAULT_REPETITION_GOAL;
  const completionSummary = getCompletionSummary(completionType, repetitionGoal, timedGoalMs);
  const completionHelperText = getCompletionHelperText(completionType);
  const repetitionSummary = getRepetitionSummary(repetitionType, selectedDays, customDays);
  const repetitionHelperText = getRepetitionHelperText(repetitionType);

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/today");
  }, []);

  const handleCancel = useCallback(() => {
    if (!hasUnsavedChanges) {
      navigateBack();
      return;
    }

    setIsDiscardSheetOpen(true);
  }, [hasUnsavedChanges, navigateBack]);

  const handleSave = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedTitle = title.trim();

      if (!normalizedTitle) {
        setTitleError("Give this habit a short, clear name.");
        return;
      }

      setTitleError(null);

      if (
        completionType !== CompletionType.SIMPLE &&
        (!Number.isFinite(resolvedCompletionGoal) || resolvedCompletionGoal <= 0)
      ) {
        setCompletionError("Choose a valid completion goal.");
        return;
      }

      setCompletionError(null);

      const { repetition, errorMessage } = buildRepetitionConfig(repetitionType, selectedDays, customDays);
      if (!repetition) {
        setScheduleError(errorMessage || "Please enter a valid repetition pattern");
        return;
      }

      setScheduleError(null);

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

  const handleConfirmedDelete = useCallback(async () => {
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
  }, [deleteHabit, habitId, isSubmitting]);

  const handleDelete = useCallback(() => {
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
  }, [habitId, isEditMode, handleConfirmedDelete]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: isEditMode ? "Edit Habit" : "New Habit",
          headerStyle: {
            backgroundColor: colors.background,
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
          <BasicInfoSection
            title={title}
            setTitle={handleTitleChange}
            icon={icon}
            setIcon={handleIconChange}
            errorMessage={titleError}
          />

          <View style={styles.panelSection}>
            <AppText variant="label" color={colors.textSecondary} style={styles.panelSectionLabel}>
              Setup panels
            </AppText>
            <AppText variant="caption" color={colors.textTertiary} style={styles.panelSectionDescription}>
              Open a panel to adjust details while keeping the main form compact.
            </AppText>

            <SheetTriggerCard
              label="Habit type"
              value={completionSummary}
              helperText={completionHelperText}
              icon={<CheckSquare size={18} color={colors.primary} />}
              onPress={openCompletionSheet}
              errorMessage={completionError}
            />

            <SheetTriggerCard
              label="Repeatability"
              value={repetitionSummary}
              helperText={repetitionHelperText}
              icon={<CalendarDays size={18} color={colors.primary} />}
              onPress={openRepetitionSheet}
              errorMessage={scheduleError}
            />
          </View>

          {isEditMode && (
            <View style={styles.dangerZone}>
              <AppText variant="label" color={colors.textSecondary} style={styles.dangerLabel}>
                Danger zone
              </AppText>
              <ScaleButton
                label="Delete Habit"
                variant="destructive"
                onPress={handleDelete}
                style={styles.deleteButton}
                disabled={isSubmitting}
                accessibilityHint="Delete this habit permanently"
              />
            </View>
          )}
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
        </View>
      </KeyboardAvoidingView>

      {activeSheet ? (
        <AppBottomSheet
          ref={settingsSheetRef}
          index={0}
          enableDynamicSizing
          enableContentPanningGesture={false}
          overDragResistanceFactor={8}
          topInset={insets.top}
          bottomInset={insets.bottom}
          maxDynamicContentSize={maxSheetContentSize}
          onClose={() => setActiveSheet(null)}
        >
          <BottomSheetView style={[styles.sheetScrollContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
            {activeSheet === "completion" ? (
              <CompletionTypeSection
                completionType={completionType}
                setCompletionType={handleCompletionTypeChange}
                completionGoal={resolvedCompletionGoal}
                setCompletionGoal={handleCompletionGoalChange}
                isEditMode={isEditMode}
                errorMessage={completionError}
                presentation="sheet"
              />
            ) : (
              <RepetitionPatternSection
                repetitionType={repetitionType}
                setRepetitionType={handleRepetitionTypeChange}
                selectedDays={selectedDays}
                setSelectedDays={handleSelectedDaysChange}
                customDays={customDays}
                setCustomDays={handleCustomDaysChange}
                weekStartDay={weekStartDay}
                errorMessage={scheduleError}
                presentation="sheet"
              />
            )}

            <ScaleButton label="Done" variant="secondary" onPress={closeSettingsSheet} style={styles.sheetDoneButton} />
          </BottomSheetView>
        </AppBottomSheet>
      ) : null}

      <DiscardChangesSheet
        isOpen={isDiscardSheetOpen}
        isEditMode={isEditMode}
        onClose={() => setIsDiscardSheetOpen(false)}
        onDiscard={() => {
          setIsDiscardSheetOpen(false);
          navigateBack();
        }}
      />

      {shouldWarmPickers ? (
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.pickerWarmupHost}>
          <View style={styles.pickerWarmupRow}>
            <WheelPicker
              data={WARMUP_REPETITION_OPTIONS}
              value={5}
              onChange={() => { }}
              style={styles.pickerWarmupWheel}
            />
            <WheelPicker
              data={WARMUP_INTERVAL_OPTIONS}
              value={7}
              onChange={() => { }}
              style={styles.pickerWarmupWheel}
            />
            <WheelPicker
              data={WARMUP_HOUR_OPTIONS}
              value={0}
              onChange={() => { }}
              style={styles.pickerWarmupWheel}
            />
            <WheelPicker
              data={WARMUP_MINUTE_OPTIONS}
              value={15}
              onChange={() => { }}
              style={styles.pickerWarmupWheel}
            />
          </View>
        </View>
      ) : null}
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
    paddingBottom: Spacing.xxxl + 72,
  },
  panelSection: {
    marginBottom: Spacing.lg,
  },
  panelSectionLabel: {
    marginBottom: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  panelSectionDescription: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  dangerZone: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.base,
  },
  dangerLabel: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
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
    width: "100%",
  },
  sheetScrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
  },
  sheetDoneButton: {
    marginTop: Spacing.lg,
  },
  pickerWarmupHost: {
    position: "absolute",
    left: -9999,
    top: -9999,
    width: 360,
    height: 180,
    opacity: 0,
  },
  pickerWarmupRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  pickerWarmupWheel: {
    width: 80,
    height: 120,
  },
});
