import type { StateCreator } from "zustand";
import type { HabitState } from "../habitStore";
import { TimerMap } from "@/types/timer";
import * as Crypto from "expo-crypto";
import { getCurrentIsoString } from "@/utils/date";
import { cancelTimerNotification, prepareTimerNotifications } from "@/utils/notifications";
import { getElapsedTimerMs } from "@/utils/timer";
import { DateStamp } from "@/types/date";
import { CompletionData } from "./completionSlice";
import { useThemeStore } from "@/store/themeStore";

export interface TimerSlice {
  activeTimers: TimerMap;
  timerRenderTickMs: number;
  tickForeground: (nowMs?: number) => Promise<void>;
  reconcileActiveTimers: (nowIso?: string) => Promise<void>;
  activateTimer: (habitId: string, date: DateStamp) => void;
  removeTimer: (habitId: string, date: DateStamp, nowIso?: string) => Promise<void>;
}

export const createTimerSlice: StateCreator<HabitState, [], [], TimerSlice> = (set, get) => ({
  activeTimers: {},
  timerRenderTickMs: Date.now(),

  tickForeground: async (nowMs) => {
    const resolvedNowMs = nowMs ?? Date.now();
    set({ timerRenderTickMs: resolvedNowMs });
    await processActiveTimers({
      set,
      get,
      nowIso: new Date(resolvedNowMs).toISOString(),
      mode: "foreground",
    });
  },

  reconcileActiveTimers: async (nowIso) => {
    await processActiveTimers({
      set,
      get,
      nowIso: nowIso ?? getCurrentIsoString(),
      mode: "reconcile",
    });
  },

  activateTimer: (habitId, date) => {
    const newLastResumedAt = getCurrentIsoString();
    const timerId = Crypto.randomUUID();
    const habit = get().habits[habitId];

    if (habit?.completion.type === "timed" && !habit.completionHistory[date]?.isCompleted) {
      void prepareTimerNotifications();
    }

    set((state) => {
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

    await cancelTimerNotification(timerToRemove.id);

    const storedTime = state.habits[habitId]?.completionHistory[date]?.value || 0;
    const elapsedTime = getElapsedTimerMs(timerToRemove.lastResumedAt, resolvedNowIso);
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

type TimerProcessMode = "foreground" | "reconcile";

type ProcessActiveTimersParams = {
  set: Parameters<StateCreator<HabitState, [], [], TimerSlice>>[0];
  get: Parameters<StateCreator<HabitState, [], [], TimerSlice>>[1];
  nowIso: string;
  mode: TimerProcessMode;
};

const processActiveTimers = async ({ set, get, nowIso, mode }: ProcessActiveTimersParams) => {
  const { activeTimers, habits } = get();
  const shouldStopAtGoal = useThemeStore.getState().timedHabitGoalBehavior === "stop";
  const completionUpdates: CompletionData[] = [];
  const timerIdsToCancel: string[] = [];
  let nextActiveTimers: TimerMap = { ...activeTimers };

  for (const [habitId, dateTimers] of Object.entries(activeTimers)) {
    for (const [date, timer] of Object.entries(dateTimers)) {
      const habit = habits[habitId];
      if (!habit || habit.completion.type !== "timed") continue;

      const elapsedTime = getElapsedTimerMs(timer.lastResumedAt, nowIso);
      if (!timer.lastResumedAt && mode === "foreground") continue;

      const currentCompletion = habit.completionHistory[date];
      const storedTime = currentCompletion?.value || 0;
      const goal = habit.completion.goal || 0;
      const combinedTime = storedTime + elapsedTime;
      const reachedGoal = goal > 0 && combinedTime >= goal;
      const shouldPersist =
        mode === "reconcile" ||
        (mode === "foreground" && reachedGoal && (!currentCompletion?.isCompleted || shouldStopAtGoal));

      if (!shouldPersist) continue;

      const nextValue = shouldStopAtGoal && reachedGoal ? goal : combinedTime;
      completionUpdates.push({ id: habitId, date, value: nextValue });

      if (shouldStopAtGoal && reachedGoal) {
        timerIdsToCancel.push(timer.id);
        nextActiveTimers = removeTimerFromMap(nextActiveTimers, habitId, date);
      } else {
        nextActiveTimers = {
          ...nextActiveTimers,
          [habitId]: {
            ...nextActiveTimers[habitId],
            [date]: {
              ...timer,
              lastResumedAt: nowIso,
            },
          },
        };
      }
    }
  }

  if (completionUpdates.length > 0) {
    set({ activeTimers: nextActiveTimers });
    await get().updateCompletionMultiple(completionUpdates);
  }

  await Promise.all(timerIdsToCancel.map((timerId) => cancelTimerNotification(timerId)));
};

const removeTimerFromMap = (activeTimers: TimerMap, habitId: string, date: string): TimerMap => {
  const nextActiveTimers = { ...activeTimers };
  const habitTimers = nextActiveTimers[habitId];
  if (!habitTimers) return nextActiveTimers;

  const nextDateTimers = { ...habitTimers };
  delete nextDateTimers[date];

  if (Object.keys(nextDateTimers).length === 0) {
    delete nextActiveTimers[habitId];
  } else {
    nextActiveTimers[habitId] = nextDateTimers;
  }

  return nextActiveTimers;
};
