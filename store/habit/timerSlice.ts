import type { StateCreator } from "zustand";
import type { HabitState } from "../habitStore";
import { TimerMap } from "@/types/timer";
import * as Crypto from "expo-crypto";
import { calculateGoalCompletionDate, getCurrentIsoString, getDayjs } from "@/utils/date";
import { cancelNotification, setNotification } from "@/utils/notifications";
import { DateStamp } from "@/types/date";
import { CompletionData } from "./completionSlice";

export interface TimerSlice {
  activeTimers: TimerMap;
  timerRenderTickMs: number;
  tickForeground: (nowMs?: number) => void;
  reconcileActiveTimers: (nowIso?: string) => Promise<void>;
  activateTimer: (habitId: string, date: DateStamp) => void;
  removeTimer: (habitId: string, date: DateStamp, nowIso?: string) => Promise<void>;
}

const getElapsedSince = (lastResumedAt: string | null, nowIso: string): number => {
  if (!lastResumedAt) return 0;
  const elapsed = getDayjs(nowIso).diff(getDayjs(lastResumedAt), "milliseconds");
  return Math.max(0, elapsed);
};

export const createTimerSlice: StateCreator<HabitState, [], [], TimerSlice> = (set, get) => ({
  activeTimers: {},
  timerRenderTickMs: Date.now(),

  tickForeground: (nowMs) => {
    set({ timerRenderTickMs: nowMs ?? Date.now() });
  },

  reconcileActiveTimers: async (nowIso) => {
    const resolvedNowIso = nowIso ?? getCurrentIsoString();
    const { activeTimers, habits } = get();
    const completionUpdates: CompletionData[] = [];
    const mergedTimers: TimerMap = {};

    for (const [habitId, dateTimers] of Object.entries(activeTimers)) {
      for (const [date, timer] of Object.entries(dateTimers)) {
        const habit = habits[habitId];
        if (!habit) continue;

        const elapsedTime = getElapsedSince(timer.lastResumedAt, resolvedNowIso);
        const storedTime = habit.completionHistory[date]?.value || 0;
        const combinedTime = storedTime + elapsedTime;

        if (!mergedTimers[habitId]) {
          mergedTimers[habitId] = {};
        }
        mergedTimers[habitId][date] = {
          ...timer,
          lastResumedAt: resolvedNowIso,
        };

        if (timer.lastResumedAt) {
          completionUpdates.push({ id: habitId, date, value: combinedTime });
        }
      }
    }

    if (Object.keys(mergedTimers).length > 0) {
      set((state) => ({
        activeTimers: {
          ...state.activeTimers,
          ...mergedTimers,
        },
      }));
    }

    if (completionUpdates.length > 0) {
      await get().updateCompletionMultiple(completionUpdates);
    }
  },

  activateTimer: (habitId, date) => {
    const newLastResumedAt = getCurrentIsoString();
    set((state) => {
      const timerId = Crypto.randomUUID();
      const habit = state.habits[habitId];
      const habitGoal = habit?.completion?.goal || 0;
      const habitTitle = habit?.title || "Habit";
      const storeValue = habit?.completionHistory[date]?.value || 0;
      const completionDate = calculateGoalCompletionDate(habitGoal, storeValue);
      if (!habit?.completionHistory[date]?.isCompleted) {
        setNotification(timerId, habitTitle, completionDate);
      }
      return {
        activeTimers: {
          ...state.activeTimers,
          [habitId]: {
            ...state.activeTimers[habitId],
            [date]: {
              id: timerId,
              lastResumedAt: newLastResumedAt,
            },
          },
        },
      };
    });
    return newLastResumedAt;
  },

  removeTimer: async (habitId, date, nowIso) => {
    const resolvedNowIso = nowIso ?? getCurrentIsoString();
    const state = get();
    const timerToRemove = state.activeTimers[habitId]?.[date];
    if (!timerToRemove) return;

    cancelNotification(timerToRemove.id);

    const storedTime = state.habits[habitId]?.completionHistory[date]?.value || 0;
    const elapsedTime = getElapsedSince(timerToRemove.lastResumedAt, resolvedNowIso);
    const combinedTime = storedTime + elapsedTime;

    await get().updateCompletion({ id: habitId, date, value: combinedTime });

    set((currentState) => {
      const nextActiveTimers = { ...currentState.activeTimers };
      const habitTimers = nextActiveTimers[habitId];
      if (!habitTimers) return { activeTimers: nextActiveTimers };

      const nextDateTimers = { ...habitTimers };
      delete nextDateTimers[date];

      if (Object.keys(nextDateTimers).length === 0) {
        delete nextActiveTimers[habitId];
      } else {
        nextActiveTimers[habitId] = nextDateTimers;
      }

      return { activeTimers: nextActiveTimers };
    });
  },
});
