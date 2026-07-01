import { BasicInfoSection, DiscardChangesSheet, SheetTriggerCard } from "@/components/habitForm";
import { AppText, ScaleButton } from "@/components/ui";
import { getElevation } from "@/constants/Elevation";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { DEFAULT_REPETITION_GOAL, useAddHabitDraftStore } from "@/store/addHabitDraftStore";
import { useHabitStore } from "@/store/habitStore";
import { CompletionType, Habit, RepetitionConfig, RepetitionType } from "@/types/habit";
import { getCurrentDateStamp } from "@/utils/date";
import { usePreventRemove } from "@react-navigation/native";
import { Stack, router, useLocalSearchParams, useNavigation } from "expo-router";
import { CalendarDays, CheckSquare, Bell } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { TFunction } from "i18next";

const WEEKDAY_SHORT_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

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
  customMonths: number,
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
    case RepetitionType.MONTHLY:
      return customMonths === 1
        ? t("addHabit.helpers.everyMonth")
        : t("addHabit.helpers.everyMonths", { count: customMonths });
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
    case RepetitionType.MONTHLY:
      return t("addHabit.helpers.monthly");
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
  customMonths: number,
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
    case RepetitionType.MONTHLY: {
      const normalizedMonths = Math.floor(customMonths);

      if (!Number.isFinite(normalizedMonths) || normalizedMonths < 1) {
        return {
          repetition: null,
          errorMessage: t("addHabit.validation.monthlyRequired"),
        };
      }

      return {
        repetition: {
          type: RepetitionType.MONTHLY,
          months: normalizedMonths,
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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const habitIdParam = params.habitId;
  const habitId = Array.isArray(habitIdParam) ? habitIdParam[0] : habitIdParam;

  const addHabit = useHabitStore((state) => state.addHabit);
  const updateHabit = useHabitStore((state) => state.updateHabit);
  const deleteHabit = useHabitStore((state) => state.deleteHabit);
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const habit = useHabitStore((state) => (habitId ? state.habits[habitId] : undefined));
  const isEditMode = Boolean(habitId);

  const title = useAddHabitDraftStore((state) => state.title);
  const icon = useAddHabitDraftStore((state) => state.icon);
  const repetitionType = useAddHabitDraftStore((state) => state.repetitionType);
  const selectedDays = useAddHabitDraftStore((state) => state.selectedDays);
  const customDays = useAddHabitDraftStore((state) => state.customDays);
  const customMonths = useAddHabitDraftStore((state) => state.customMonths);
  const completionType = useAddHabitDraftStore((state) => state.completionType);
  const repetitionGoal = useAddHabitDraftStore((state) => state.repetitionGoal);
  const timedGoalMs = useAddHabitDraftStore((state) => state.timedGoalMs);
  const reminderEnabled = useAddHabitDraftStore((state) => state.reminderEnabled);
  const reminderHour = useAddHabitDraftStore((state) => state.reminderHour);
  const reminderMinute = useAddHabitDraftStore((state) => state.reminderMinute);
  const reminderRepeat = useAddHabitDraftStore((state) => state.reminderRepeat);
  const reminderRepeatIntervalMs = useAddHabitDraftStore((state) => state.reminderRepeatIntervalMs);
  const isDirty = useAddHabitDraftStore((state) => state.isDirty);
  const titleError = useAddHabitDraftStore((state) => state.titleError);
  const scheduleError = useAddHabitDraftStore((state) => state.scheduleError);
  const completionError = useAddHabitDraftStore((state) => state.completionError);
  const setTitle = useAddHabitDraftStore((state) => state.setTitle);
  const setIcon = useAddHabitDraftStore((state) => state.setIcon);
  const resetForCreate = useAddHabitDraftStore((state) => state.resetForCreate);
  const loadHabit = useAddHabitDraftStore((state) => state.loadHabit);
  const setTitleError = useAddHabitDraftStore((state) => state.setTitleError);
  const setScheduleError = useAddHabitDraftStore((state) => state.setScheduleError);
  const setCompletionError = useAddHabitDraftStore((state) => state.setCompletionError);
  const markDraftClean = useAddHabitDraftStore((state) => state.markClean);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const hasInitializedFormRef = useRef(false);
  const hasHandledMissingHabitRef = useRef(false);
  const allowProgrammaticRemoveRef = useRef(false);
  const pendingNavigationActionRef = useRef<unknown>(null);
  const isDiscardAlertOpenRef = useRef(false);
  const [isDiscardSheetOpen, setIsDiscardSheetOpen] = useState(false);

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
    [hasUnsavedChanges, navigateBack, navigation, showDiscardConfirmation]
  );

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    if (allowProgrammaticRemoveRef.current) {
      allowProgrammaticRemoveRef.current = false;
      navigation.dispatch(data.action as never);
      return;
    }

    attemptClose({ action: data.action });
  });

  useEffect(() => {
    hasInitializedFormRef.current = false;
    hasHandledMissingHabitRef.current = false;

    if (!habitId) {
      resetForCreate();
    }
  }, [habitId, resetForCreate]);

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

    loadHabit(habit);

    hasInitializedFormRef.current = true;
  }, [habit, habitId, isHydrated, loadHabit, navigateBack, t]);

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

  const getPanelParams = useCallback(() => (habitId ? { habitId } : undefined), [habitId]);

  const openCompletionRoute = useCallback(() => {
    router.push({ pathname: "/add/completion", params: getPanelParams() });
  }, [getPanelParams]);

  const openRepetitionRoute = useCallback(() => {
    router.push({ pathname: "/add/repetition", params: getPanelParams() });
  }, [getPanelParams]);

  const openReminderRoute = useCallback(() => {
    router.push({ pathname: "/add/reminder", params: getPanelParams() });
  }, [getPanelParams]);

  const resolvedCompletionGoal =
    completionType === CompletionType.TIMED
      ? timedGoalMs
      : completionType === CompletionType.REPETITIONS
        ? repetitionGoal
        : DEFAULT_REPETITION_GOAL;
  const completionSummary = getCompletionSummary(completionType, repetitionGoal, timedGoalMs, t);
  const completionHelperText = getCompletionHelperText(completionType, t);
  const repetitionSummary = getRepetitionSummary(repetitionType, selectedDays, customDays, customMonths, t);
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
  const addScreenTitle = isEditMode ? t("addHabit.sections.editHabitTitle") : t("addHabit.sections.newHabitTitle");

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

      const { repetition, errorMessage } = buildRepetitionConfig(
        repetitionType,
        selectedDays,
        customDays,
        customMonths,
        t
      );
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

      markDraftClean();
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

      markDraftClean();
      exitWithoutPrompt();
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteHabit, exitWithoutPrompt, habitId, isSubmitting, markDraftClean]);

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
          paddingTop: 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <Stack.Screen
        options={{
          title: addScreenTitle,
          headerBackVisible: false,
          headerTitle: addScreenTitle,
          headerStyle: {
            backgroundColor: colors.bgApp,
          },
          headerTitleStyle: {
            color: colors.textPrimary,
          },
          headerTintColor: colors.accent,
          headerShadowVisible: true,
        }}
      />

      <KeyboardAvoidingView behavior="padding" enabled={isKeyboardVisible} style={styles.keyboardContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BasicInfoSection title={title} setTitle={setTitle} icon={icon} setIcon={setIcon} errorMessage={titleError} />

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
              onPress={openCompletionRoute}
              errorMessage={completionError}
            />

            <SheetTriggerCard
              label={t("addHabit.sections.repeatability")}
              value={repetitionSummary}
              helperText={repetitionHelperText}
              icon={<CalendarDays size={18} color={colors.accent} />}
              onPress={openRepetitionRoute}
              errorMessage={scheduleError}
            />

            <SheetTriggerCard
              label={t("addHabit.sections.reminders")}
              value={reminderSummary}
              helperText={reminderHelperText}
              icon={<Bell size={18} color={colors.accent} />}
              onPress={openReminderRoute}
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
});
