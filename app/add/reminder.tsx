import { ReminderSection } from "@/components/habitForm";
import { ScaleButton } from "@/components/ui";
import { getElevation } from "@/constants/Elevation";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { useAddHabitDraftStore } from "@/store/addHabitDraftStore";
import { prepareReminderNotifications } from "@/utils/notifications";
import { Stack, router } from "expo-router";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ReminderRoute() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const draftEnabled = useAddHabitDraftStore((state) => state.reminderEnabled);
  const draftHour = useAddHabitDraftStore((state) => state.reminderHour);
  const draftMinute = useAddHabitDraftStore((state) => state.reminderMinute);
  const draftRepeatIfNotCompleted = useAddHabitDraftStore((state) => state.reminderRepeat);
  const draftRepeatIntervalMs = useAddHabitDraftStore((state) => state.reminderRepeatIntervalMs);
  const setEnabled = useAddHabitDraftStore((state) => state.setReminderEnabled);
  const setHour = useAddHabitDraftStore((state) => state.setReminderHour);
  const setMinute = useAddHabitDraftStore((state) => state.setReminderMinute);
  const setRepeatIfNotCompleted = useAddHabitDraftStore((state) => state.setReminderRepeat);
  const setRepeatIntervalMs = useAddHabitDraftStore((state) => state.setReminderRepeatIntervalMs);
  const [enabled, setLocalEnabled] = useState(draftEnabled);
  const [hour, setLocalHour] = useState(draftHour);
  const [minute, setLocalMinute] = useState(draftMinute);
  const [repeatIfNotCompleted, setLocalRepeatIfNotCompleted] = useState(draftRepeatIfNotCompleted);
  const [repeatIntervalMs, setLocalRepeatIntervalMs] = useState(draftRepeatIntervalMs);

  const handleEnabledChange = useCallback((value: boolean) => {
    if (!value) {
      setLocalEnabled(false);
      return;
    }

    void (async () => {
      const canEnableReminder = await prepareReminderNotifications();
      if (!canEnableReminder) {
        setLocalEnabled(false);
        return;
      }

      setLocalEnabled(true);
    })();
  }, []);

  const handleSave = useCallback(() => {
    setEnabled(enabled);
    setHour(hour);
    setMinute(minute);
    setRepeatIfNotCompleted(repeatIfNotCompleted);
    setRepeatIntervalMs(repeatIntervalMs);
    router.back();
  }, [
    enabled,
    hour,
    minute,
    repeatIfNotCompleted,
    repeatIntervalMs,
    setEnabled,
    setHour,
    setMinute,
    setRepeatIfNotCompleted,
    setRepeatIntervalMs,
  ]);

  return (
    <>
      <Stack.Screen options={{ title: t("form.reminders") }} />
      <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ReminderSection
            enabled={enabled}
            setEnabled={handleEnabledChange}
            hour={hour}
            setHour={setLocalHour}
            minute={minute}
            setMinute={setLocalMinute}
            repeatIfNotCompleted={repeatIfNotCompleted}
            setRepeatIfNotCompleted={setLocalRepeatIfNotCompleted}
            repeatIntervalMs={repeatIntervalMs}
            setRepeatIntervalMs={setLocalRepeatIntervalMs}
            presentation="sheet"
            showHeading={false}
          />
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
          <ScaleButton label={t("common.save")} onPress={handleSave} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxxl + 72,
  },
  actionBar: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
  },
});
