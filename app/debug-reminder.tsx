import dayjs from "dayjs";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import { CompletionType, RepetitionType, type Habit } from "@/types/habit";
import { getDateStamp, getIsoString } from "@/utils/date";
import { getReminderNotificationIdentifier, getReminderNotificationSeriesId } from "@/utils/notifications";
import {
  appendReminderActionDebugRecord,
  getCombinedReminderActionDebugRecords,
  type ReminderActionDebugRecord,
} from "@/utils/reminderActionDebugLog";
import { getReminderScheduleLedger } from "@/utils/reminderScheduleLedger";
import { reconcileReminderNotifications } from "@/utils/reminderScheduler";

const DEBUG_HABIT_ID = "debug-notification-habit";
const DEBUG_HABIT_TITLE = "Debug Native Done";
const DEFAULT_DELAY_MINUTES = 2;

type DebugReminderStatus = {
  state: "idle" | "waiting" | "scheduled" | "error";
  message: string;
  habitId?: string;
  reminderDate?: string;
  scheduledFor?: string;
  expectedNotificationId?: string;
  ledgerNotificationId?: string;
};

const getDelayMinutes = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsedValue = rawValue ? Number(rawValue) : DEFAULT_DELAY_MINUTES;

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return DEFAULT_DELAY_MINUTES;
  }

  return parsedValue;
};

const getBooleanParam = (value: string | string[] | undefined) => {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue === "1" || rawValue === "true";
};

const formatRecordLine = (record: ReminderActionDebugRecord) => {
  const parts = [
    new Date(record.handledAtMs).toLocaleString(),
    record.event,
    record.source ? `source=${record.source}` : undefined,
    record.actionId ? `action=${record.actionId}` : undefined,
    record.habitTitle || record.habitId ? `habit=${record.habitTitle ?? record.habitId}` : undefined,
    record.reminderDate ? `date=${record.reminderDate}` : undefined,
    record.notificationId ? `notification=${record.notificationId}` : undefined,
    record.detail ? `detail=${record.detail}` : undefined,
  ];

  return parts.filter(Boolean).join(" | ");
};

const getDebugLogText = (status: DebugReminderStatus, records: ReminderActionDebugRecord[]) => {
  const statusLines = [
    "YAHT reminder action debug",
    `state=${status.state}`,
    `message=${status.message}`,
    `habitId=${status.habitId ?? DEBUG_HABIT_ID}`,
    `reminderDate=${status.reminderDate ?? "n/a"}`,
    `scheduledFor=${status.scheduledFor ?? "n/a"}`,
    `expectedNotificationId=${status.expectedNotificationId ?? "n/a"}`,
    `ledgerNotificationId=${status.ledgerNotificationId ?? "n/a"}`,
  ];

  const recordLines = records.length > 0 ? records.map(formatRecordLine) : ["No reminder action records found."];

  return [...statusLines, "", "Reminder action records", ...recordLines].join("\n");
};

export default function DebugReminderScreen() {
  const { colors } = useTheme();
  const {
    create: createParam,
    delayMinutes: delayMinutesParam,
    inspect: inspectParam,
  } = useLocalSearchParams<{
    create?: string;
    delayMinutes?: string;
    inspect?: string;
  }>();
  const delayMinutes = useMemo(() => getDelayMinutes(delayMinutesParam), [delayMinutesParam]);
  const shouldCreateDebugReminder = useMemo(
    () => !getBooleanParam(inspectParam) && (getBooleanParam(createParam) || delayMinutesParam !== undefined),
    [createParam, delayMinutesParam, inspectParam]
  );
  const isHydrated = useHabitStore((state) => state._hasHydrated);
  const [status, setStatus] = useState<DebugReminderStatus>({
    state: "idle",
    message: "Inspecting reminder action records.",
  });
  const [nativeActionRecords, setNativeActionRecords] = useState<ReminderActionDebugRecord[]>([]);
  const [copyMessage, setCopyMessage] = useState("");

  const refreshNativeActionRecords = useCallback(() => {
    void getCombinedReminderActionDebugRecords().then(setNativeActionRecords);
  }, []);

  const debugLogText = useMemo(() => getDebugLogText(status, nativeActionRecords), [nativeActionRecords, status]);

  const copyDebugLogs = useCallback(async () => {
    await Clipboard.setStringAsync(debugLogText);
    setCopyMessage("Copied");
  }, [debugLogText]);

  useEffect(() => {
    refreshNativeActionRecords();
  }, [refreshNativeActionRecords]);

  useEffect(() => {
    refreshNativeActionRecords();

    if (!shouldCreateDebugReminder) {
      setStatus({
        state: "idle",
        message: "Inspecting native action records only.",
      });
      return;
    }

    if (!isHydrated) {
      setStatus({
        state: "waiting",
        message: "Waiting for habit store hydration...",
      });
      return;
    }

    let isCancelled = false;

    const createDebugReminder = async () => {
      const now = dayjs();
      const reminderTime = now.add(delayMinutes, "minute").second(0).millisecond(0);
      const reminderDate = getDateStamp(reminderTime);
      const reminderSeriesId = getReminderNotificationSeriesId(DEBUG_HABIT_ID, reminderDate);
      const expectedNotificationId = getReminderNotificationIdentifier(reminderSeriesId, reminderTime.valueOf());
      const debugHabit: Habit = {
        id: DEBUG_HABIT_ID,
        title: DEBUG_HABIT_TITLE,
        icon: "!",
        repetition: { type: RepetitionType.DAILY },
        completion: { type: CompletionType.SIMPLE },
        completionHistory: {},
        createdAt: getIsoString(now),
        reminder: {
          enabled: true,
          hour: reminderTime.hour(),
          minute: reminderTime.minute(),
          repeatIfNotCompleted: false,
        },
      };

      try {
        useHabitStore.setState((state) => ({
          habits: {
            ...state.habits,
            [DEBUG_HABIT_ID]: debugHabit,
          },
          selectedDate: reminderDate,
          error: null,
        }));

        appendReminderActionDebugRecord({
          event: "js-debug-route-upserted",
          habitId: DEBUG_HABIT_ID,
          habitTitle: DEBUG_HABIT_TITLE,
          reminderDate,
          reminderSeriesId,
          scheduledFor: reminderTime.valueOf(),
          notificationId: expectedNotificationId,
        });

        await reconcileReminderNotifications({
          reason: "manual",
          habits: useHabitStore.getState().habits,
          nowMs: Date.now(),
        });

        const ledgerEntry = getReminderScheduleLedger().normalNotifications.find(
          (entry) => entry.habitId === DEBUG_HABIT_ID && entry.reminderDate === reminderDate
        );

        appendReminderActionDebugRecord({
          event: "js-debug-route-scheduled",
          habitId: DEBUG_HABIT_ID,
          habitTitle: DEBUG_HABIT_TITLE,
          reminderDate,
          reminderSeriesId,
          scheduledFor: reminderTime.valueOf(),
          notificationId: ledgerEntry?.notificationId ?? expectedNotificationId,
        });

        if (!isCancelled) {
          refreshNativeActionRecords();
          setStatus({
            state: "scheduled",
            message: "Debug reminder scheduled.",
            habitId: DEBUG_HABIT_ID,
            reminderDate,
            scheduledFor: reminderTime.toISOString(),
            expectedNotificationId,
            ledgerNotificationId: ledgerEntry?.notificationId,
          });
        }
      } catch (error) {
        appendReminderActionDebugRecord({
          event: "js-debug-route-error",
          habitId: DEBUG_HABIT_ID,
          detail: error instanceof Error ? error.message : "Failed to create debug reminder.",
        });
        if (!isCancelled) {
          setStatus({
            state: "error",
            message: error instanceof Error ? error.message : "Failed to create debug reminder.",
          });
        }
      }
    };

    void createDebugReminder();

    return () => {
      isCancelled = true;
    };
  }, [delayMinutes, isHydrated, refreshNativeActionRecords, shouldCreateDebugReminder]);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.bgApp }]}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.textPrimary }]}>Reminder Debug Logs</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{status.message}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refresh debug logs"
          onPress={refreshNativeActionRecords}
          style={[styles.button, { borderColor: colors.borderDefault, backgroundColor: colors.bgSurface }]}
        >
          <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Refresh</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy debug logs"
          onPress={copyDebugLogs}
          style={[styles.button, { borderColor: colors.borderDefault, backgroundColor: colors.bgSurface }]}
        >
          <Text style={[styles.buttonText, { color: colors.textPrimary }]}>Copy logs</Text>
        </Pressable>
        {copyMessage ? <Text style={[styles.copyMessage, { color: colors.textSecondary }]}>{copyMessage}</Text> : null}
      </View>
      <View style={[styles.panel, { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault }]}>
        <Text style={[styles.line, { color: colors.textPrimary }]}>State: {status.state}</Text>
        <Text style={[styles.line, { color: colors.textPrimary }]}>Habit ID: {status.habitId ?? DEBUG_HABIT_ID}</Text>
        <Text style={[styles.line, { color: colors.textPrimary }]}>Title: {DEBUG_HABIT_TITLE}</Text>
        <Text style={[styles.line, { color: colors.textPrimary }]}>Delay minutes: {delayMinutes}</Text>
        <Text style={[styles.line, { color: colors.textPrimary }]}>
          Reminder date: {status.reminderDate ?? "pending"}
        </Text>
        <Text style={[styles.line, { color: colors.textPrimary }]}>
          Scheduled for: {status.scheduledFor ?? "pending"}
        </Text>
        <Text style={[styles.line, { color: colors.textPrimary }]}>
          Expected notification ID: {status.expectedNotificationId ?? "pending"}
        </Text>
        <Text style={[styles.line, { color: colors.textPrimary }]}>
          Ledger notification ID: {status.ledgerNotificationId ?? "not found"}
        </Text>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Reminder action records</Text>
        <ScrollView
          horizontal
          style={[styles.logWindow, { backgroundColor: colors.bgInset, borderColor: colors.borderSubtle }]}
        >
          <Text selectable style={[styles.logText, { color: colors.textPrimary }]}>
            {debugLogText}
          </Text>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    gap: 16,
    padding: 24,
    paddingTop: 72,
    paddingBottom: 72,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  message: {
    fontSize: 16,
  },
  panel: {
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  line: {
    fontSize: 14,
  },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  button: {
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  copyMessage: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  logWindow: {
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 360,
    minHeight: 220,
  },
  logText: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
    padding: 12,
  },
});
