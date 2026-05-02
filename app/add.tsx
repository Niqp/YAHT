import {
  BasicInfoSection,
  CompletionTypeSection,
  RepetitionPatternSection,
  ReminderSection,
  DiscardChangesSheet,
  SheetTriggerCard,
} from "@/components/habitForm";
import { AppBottomSheet, AppText, ScaleButton } from "@/components/ui";
import { getElevation } from "@/constants/Elevation";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { useHabitStore } from "@/store/habitStore";
import { CompletionType, Habit, RepetitionConfig, RepetitionType } from "@/types/habit";
import { getCurrentDateStamp } from "@/utils/date";
import { prepareReminderNotifications } from "@/utils/notifications";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import { usePreventRemove } from "@react-navigation/native";
import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router";
import { CalendarDays, CheckSquare, Bell } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TFunction } from "i18next";

const DEFAULT_ICON = "🌟";
const DEFAULT_REPETITION_GOAL = 1;
const DEFAULT_TIMED_GOAL_MS = 1 * 60 * 1000;
const WEEKDAY_SHORT_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

type AddSheetKey = "completion" | "repetition" | "reminder";
const TODAY_ROUTE = "/(tabs)/today";

const formatDurationLabel = (durationMs: number, t: TFunction) => {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${t("addHabit.units.hr", { count: hours })} ${t("addHabit.units.min", { count: minutes })}`;
  }

  if (hours > 0) {
    return t("addHabit.units.hr", { count: hours });
  }

  return t("addHabit.units.min", { count: minutes });
};

const getCompletionSummary = (
  completionType: CompletionType,
  repetitionGoal: number,
  timedGoalMs: number,
  t: TFunction
) => {
  switch (completionType) {
    case CompletionType.REPETITIONS:
      return t("addHabit.units.rep", { count: repetitionGoal });
    case CompletionType.TIMED:
      return formatDurationLabel(timedGoalMs, t);
    case CompletionType.SIMPLE:
    default:
      return t("addHabit.helpers.simpleCheckOff");
  }
};

const getCompletionHelperText = (completionType: CompletionType, t: TFunction) => {
  switch (completionType) {
    case CompletionType.REPETITIONS:
      return t("addHabit.helpers.countGoal");
    case CompletionType.TIMED:
      return t("addHabit.helpers.timeGoal");
    case CompletionType.SIMPLE:
    default:
      return t("addHabit.helpers.simpleGoal");
  }
};

const getRepetitionSummary = (
  repetitionType: RepetitionType,
  selectedDays: number[],
  customDays: number,
  t: TFunction
) => {
  switch (repetitionType) {
    case RepetitionType.WEEKDAYS: {
      const labels = normalizeDays(selectedDays).map((day) => t(`addHabit.weekdaysShort.${WEEKDAY_SHORT_KEYS[day]}`));

      if (labels.length === 0) {
        return t("addHabit.helpers.pickDay");
      }

      return labels.join(" ");
    }
    case RepetitionType.INTERVAL:
      return customDays === 1 ? t("addHabit.helpers.everyDay") : t("addHabit.helpers.everyDays", { count: customDays });
    case RepetitionType.DAILY:
    default:
      return t("form.daily");
  }
};

const getRepetitionHelperText = (repetitionType: RepetitionType, t: TFunction) => {
  switch (repetitionType) {
    case RepetitionType.WEEKDAYS:
      return t("addHabit.helpers.weekdays");
    case RepetitionType.INTERVAL:
      return t("addHabit.helpers.interval");
    case RepetitionType.DAILY:
    default:
      return t("addHabit.helpers.daily");
  }
};

const getReminderSummary = (
  enabled: boolean,
  hour: number,
  minute: number,
  repeat: boolean,
  intervalMs: number,
  t: TFunction
) => {
  if (!enabled) return t("addHabit.helpers.off");
  const displayHour = hour.toString().padStart(2, "0");
  const displayMin = minute.toString().padStart(2, "0");
  let text = `${displayHour}:${displayMin}`;
  if (repeat) {
    const interval = formatDurationLabel(intervalMs, t);
    text += ` (${t("addHabit.helpers.reminderRepeating", { interval })})`;
  }
  return text;
};

const getReminderHelperText = (enabled: boolean, t: TFunction) => {
  return enabled ? t("addHabit.helpers.getNotified") : t("addHabit.helpers.noNotifications");
};

const normalizeDays = (days: number[]) => {
  return [...new Set(days)].filter((day) => day >= 0 && day <= 6).sort((a, b) => a - b);
};

const buildRepetitionConfig = (
  repetitionType: RepetitionType,
  selectedDays: number[],
  customDays: number,
  t: TFunction
): { repetition: RepetitionConfig | null; errorMessage?: string } => {
  switch (repetitionType) {
    case RepetitionType.WEEKDAYS: {
      const normalizedDays = normalizeDays(selectedDays);

      if (normalizedDays.length === 0) {
        return {
          repetition: null,
          errorMessage: t("addHabit.validation.weekDayRequired"),
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
          errorMessage: t("addHabit.validation.intervalRequired"),
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
  const { t } = useTranslation();
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
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(9);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [reminderRepeat, setReminderRepeat] = useState(false);
  const [reminderRepeatIntervalMs, setReminderRepeatIntervalMs] = useState(15 * 60000);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [completionError, setCompletionError] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<AddSheetKey | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const hasInitializedFormRef = useRef(false);
  const hasHandledMissingHabitRef = useRef(false);
  const allowProgrammaticRemoveRef = useRef(false);
  const pendingNavigationActionRef = useRef<unknown>(null);
  const isDiscardAlertOpenRef = useRef(false);
  const [isDiscardSheetOpen, setIsDiscardSheetOpen] = useState(false);
  const settingsSheetRef = useRef<BottomSheet>(null);

  const navigation = useNavigation();
  const hasUnsavedChanges = isDirty;

  const navigateBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(TODAY_ROUTE);
  }, []);

  const clearPendingExit = useCallback(() => {
    pendingNavigationActionRef.current = null;
    isDiscardAlertOpenRef.current = false;
  }, []);

  const exitWithoutPrompt = useCallback(
    (action?: unknown) => {
      setIsDiscardSheetOpen(false);
      clearPendingExit();

      if (action) {
        allowProgrammaticRemoveRef.current = true;
        navigation.dispatch(action as never);
        return;
      }

      allowProgrammaticRemoveRef.current = true;
      navigateBack();
    },
    [clearPendingExit, navigateBack, navigation]
  );

  const handleKeepEditing = useCallback(() => {
    setIsDiscardSheetOpen(false);
    clearPendingExit();
  }, [clearPendingExit]);

  const handleDiscardConfirmed = useCallback(() => {
    const pendingAction = pendingNavigationActionRef.current;
    exitWithoutPrompt(pendingAction ?? undefined);
  }, [exitWithoutPrompt]);

  const showDiscardConfirmation = useCallback(() => {
    if (Platform.OS === "ios") {
      if (isDiscardAlertOpenRef.current) {
        return;
      }

      isDiscardAlertOpenRef.current = true;

      Alert.alert(t("addHabit.alerts.unsavedTitle"), isEditMode ? t("form.discardEdit") : t("form.discardCreate"), [
        {
          text: t("form.keepEditing"),
          style: "cancel",
          onPress: handleKeepEditing,
        },
        {
          text: t("form.discard"),
          style: "destructive",
          onPress: handleDiscardConfirmed,
        },
      ]);
      return;
    }

    setIsDiscardSheetOpen(true);
  }, [handleDiscardConfirmed, handleKeepEditing, isEditMode, t]);

  const attemptClose = useCallback(
    ({ action }: { action?: unknown } = {}) => {
      if (activeSheet !== null) {
        setActiveSheet(null);
        return;
      }

      if (!hasUnsavedChanges) {
        if (action) {
          navigation.dispatch(action as never);
          return;
        }

        navigateBack();
        return;
      }

      pendingNavigationActionRef.current = action ?? null;
      showDiscardConfirmation();
    },
    [activeSheet, hasUnsavedChanges, navigateBack, navigation, showDiscardConfirmation]
  );

  usePreventRemove(activeSheet !== null || hasUnsavedChanges, ({ data }) => {
    if (allowProgrammaticRemoveRef.current) {
      allowProgrammaticRemoveRef.current = false;
      navigation.dispatch(data.action as never);
      return;
    }

    attemptClose({ action: data.action });
  });

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
      setReminderEnabled(false);
      setReminderHour(9);
      setReminderMinute(0);
      setReminderRepeat(false);
      setReminderRepeatIntervalMs(15 * 60000);
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
        Alert.alert(t("addHabit.alerts.habitNotFoundTitle"), t("addHabit.alerts.habitNotFoundBody"), [
          {
            text: t("common.ok"),
            onPress: navigateBack,
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
    setReminderEnabled(habit.reminder?.enabled ?? false);
    setReminderHour(habit.reminder?.hour ?? 9);
    setReminderMinute(habit.reminder?.minute ?? 0);
    setReminderRepeat(habit.reminder?.repeatIfNotCompleted ?? false);
    setReminderRepeatIntervalMs(habit.reminder?.repeatIntervalMs ?? 15 * 60000);
    setIsDirty(false);
    setTitleError(null);
    setScheduleError(null);
    setCompletionError(null);

    hasInitializedFormRef.current = true;
  }, [habit, habitId, isHydrated, navigateBack, t]);

  // Workaround for RN #52596: KeyboardAvoidingView leaves residual bottom padding on Android
  // after keyboard dismissal. Disabling it on hide forces an immediate offset reset to zero.
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const openReminderSheet = useCallback(() => {
    setActiveSheet("reminder");
  }, []);

  const handleReminderEnabledChange = useCallback((value: boolean) => {
    if (!value) {
      setReminderEnabled(false);
      setIsDirty(true);
      return;
    }

    void (async () => {
      const canEnableReminder = await prepareReminderNotifications();
      if (!canEnableReminder) {
        setReminderEnabled(false);
        return;
      }

      setReminderEnabled(true);
      setIsDirty(true);
    })();
  }, []);

  const handleReminderHourChange = useCallback((value: number) => {
    setReminderHour(value);
    setIsDirty(true);
  }, []);

  const handleReminderMinuteChange = useCallback((value: number) => {
    setReminderMinute(value);
    setIsDirty(true);
  }, []);

  const handleReminderRepeatChange = useCallback((value: boolean) => {
    setReminderRepeat(value);
    setIsDirty(true);
  }, []);

  const handleReminderRepeatIntervalChange = useCallback((value: number) => {
    setReminderRepeatIntervalMs(value);
    setIsDirty(true);
  }, []);

  const resolvedCompletionGoal =
    completionType === CompletionType.TIMED
      ? timedGoalMs
      : completionType === CompletionType.REPETITIONS
        ? repetitionGoal
        : DEFAULT_REPETITION_GOAL;
  const completionSummary = getCompletionSummary(completionType, repetitionGoal, timedGoalMs, t);
  const completionHelperText = getCompletionHelperText(completionType, t);
  const repetitionSummary = getRepetitionSummary(repetitionType, selectedDays, customDays, t);
  const repetitionHelperText = getRepetitionHelperText(repetitionType, t);
  const reminderSummary = getReminderSummary(
    reminderEnabled,
    reminderHour,
    reminderMinute,
    reminderRepeat,
    reminderRepeatIntervalMs,
    t
  );
  const reminderHelperText = getReminderHelperText(reminderEnabled, t);

  const handleCancel = useCallback(() => {
    attemptClose();
  }, [attemptClose]);

  const handleSave = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedTitle = title.trim();

      if (!normalizedTitle) {
        setTitleError(t("addHabit.validation.titleRequired"));
        return;
      }

      setTitleError(null);

      if (
        completionType !== CompletionType.SIMPLE &&
        (!Number.isFinite(resolvedCompletionGoal) || resolvedCompletionGoal <= 0)
      ) {
        setCompletionError(t("addHabit.validation.completionGoalRequired"));
        return;
      }

      setCompletionError(null);

      const { repetition, errorMessage } = buildRepetitionConfig(repetitionType, selectedDays, customDays, t);
      if (!repetition) {
        setScheduleError(errorMessage || t("addHabit.validation.repetitionRequired"));
        return;
      }

      setScheduleError(null);

      const completion = buildCompletionConfig(completionType, resolvedCompletionGoal);

      const reminder = reminderEnabled
        ? {
            enabled: true,
            hour: Math.floor(reminderHour),
            minute: Math.floor(reminderMinute),
            repeatIfNotCompleted: reminderRepeat,
            repeatIntervalMs: reminderRepeat ? reminderRepeatIntervalMs : undefined,
          }
        : {
            enabled: false,
            hour: Math.floor(reminderHour),
            minute: Math.floor(reminderMinute),
            repeatIfNotCompleted: false,
          };

      if (isEditMode && habitId) {
        await updateHabit(habitId, {
          title: normalizedTitle,
          icon,
          repetition,
          completion,
          reminder,
        });
      } else {
        const habitData: Omit<Habit, "id"> = {
          title: normalizedTitle,
          icon,
          completionHistory: {},
          completion,
          repetition,
          createdAt: getCurrentDateStamp(),
          reminder,
        };

        await addHabit(habitData);
      }

      const { error } = useHabitStore.getState();
      if (error) {
        Alert.alert(t("common.error"), error);
        return;
      }

      setIsDirty(false);
      exitWithoutPrompt();
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
        Alert.alert(t("common.error"), error);
        return;
      }

      setIsDirty(false);
      exitWithoutPrompt();
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteHabit, exitWithoutPrompt, habitId, isSubmitting]);

  const handleDelete = useCallback(() => {
    if (!isEditMode || !habitId) {
      return;
    }

    Alert.alert(t("addHabit.alerts.deleteTitle"), t("addHabit.alerts.deleteBody"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: () => {
          void handleConfirmedDelete();
        },
      },
    ]);
  }, [habitId, isEditMode, handleConfirmedDelete, t]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgApp,
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <Stack.Screen
        options={{
          title: isEditMode ? t("addHabit.sections.editHabitTitle") : t("addHabit.sections.newHabitTitle"),
          headerStyle: {
            backgroundColor: colors.bgApp,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
          },
          headerTintColor: colors.textPrimary,
        }}
      />

      <KeyboardAvoidingView behavior="padding" enabled={isKeyboardVisible} style={styles.keyboardContainer}>
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
              {t("addHabit.sections.setupPanels")}
            </AppText>
            <AppText variant="caption" color={colors.textTertiary} style={styles.panelSectionDescription}>
              {t("addHabit.sections.setupPanelsDescription")}
            </AppText>

            <SheetTriggerCard
              label={t("addHabit.sections.habitType")}
              value={completionSummary}
              helperText={completionHelperText}
              icon={<CheckSquare size={18} color={colors.accent} />}
              onPress={openCompletionSheet}
              errorMessage={completionError}
            />

            <SheetTriggerCard
              label={t("addHabit.sections.repeatability")}
              value={repetitionSummary}
              helperText={repetitionHelperText}
              icon={<CalendarDays size={18} color={colors.accent} />}
              onPress={openRepetitionSheet}
              errorMessage={scheduleError}
            />

            <SheetTriggerCard
              label={t("addHabit.sections.reminders")}
              value={reminderSummary}
              helperText={reminderHelperText}
              icon={<Bell size={18} color={colors.accent} />}
              onPress={openReminderSheet}
            />
          </View>

          {isEditMode && (
            <View style={styles.dangerZone}>
              <AppText variant="label" color={colors.textSecondary} style={styles.dangerLabel}>
                {t("addHabit.sections.dangerZone")}
              </AppText>
              <ScaleButton
                label={t("addHabit.sections.deleteHabit")}
                variant="destructive"
                onPress={handleDelete}
                style={styles.deleteButton}
                disabled={isSubmitting}
                accessibilityHint={t("addHabit.sections.deleteHint")}
              />
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.bgSurface,
              borderTopColor: colors.borderSubtle,
              paddingBottom: insets.bottom + Spacing.base,
            },
            getElevation(2, colors.shadow),
          ]}
        >
          <View style={styles.primaryActionsRow}>
            <ScaleButton
              label={t("common.cancel")}
              variant="secondary"
              onPress={handleCancel}
              style={styles.cancelButton}
              accessibilityHint={t("addHabit.sections.cancelHint")}
            />
            <ScaleButton
              label={isEditMode ? t("addHabit.sections.saveChanges") : t("addHabit.sections.createHabit")}
              onPress={() => {
                void handleSave();
              }}
              style={styles.saveButton}
              disabled={isSubmitting || (isEditMode && !isDirty)}
              accessibilityHint={t("addHabit.sections.saveHint")}
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
            ) : activeSheet === "repetition" ? (
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
            ) : (
              <ReminderSection
                enabled={reminderEnabled}
                setEnabled={handleReminderEnabledChange}
                hour={reminderHour}
                setHour={handleReminderHourChange}
                minute={reminderMinute}
                setMinute={handleReminderMinuteChange}
                repeatIfNotCompleted={reminderRepeat}
                setRepeatIfNotCompleted={handleReminderRepeatChange}
                repeatIntervalMs={reminderRepeatIntervalMs}
                setRepeatIntervalMs={handleReminderRepeatIntervalChange}
                presentation="sheet"
              />
            )}

            <ScaleButton
              label={t("common.done")}
              variant="secondary"
              onPress={closeSettingsSheet}
              style={styles.sheetDoneButton}
            />
          </BottomSheetView>
        </AppBottomSheet>
      ) : null}

      <DiscardChangesSheet
        isOpen={Platform.OS !== "ios" && isDiscardSheetOpen}
        isEditMode={isEditMode}
        onClose={handleKeepEditing}
        onDiscard={handleDiscardConfirmed}
      />
    </View>
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
