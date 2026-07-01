import { create } from "zustand";

import { CompletionType, Habit, RepetitionType } from "@/types/habit";

export const DEFAULT_HABIT_ICON = "🌟";
export const DEFAULT_REPETITION_GOAL = 1;
export const DEFAULT_TIMED_GOAL_MS = 1 * 60 * 1000;

interface AddHabitDraftState {
  title: string;
  icon: string;
  repetitionType: RepetitionType;
  selectedDays: number[];
  customDays: number;
  customMonths: number;
  completionType: CompletionType;
  repetitionGoal: number;
  timedGoalMs: number;
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  reminderRepeat: boolean;
  reminderRepeatIntervalMs: number;
  isDirty: boolean;
  titleError: string | null;
  scheduleError: string | null;
  completionError: string | null;
  isEditMode: boolean;
  resetForCreate: () => void;
  loadHabit: (habit: Habit) => void;
  setTitle: (title: string) => void;
  setIcon: (icon: string) => void;
  setRepetitionType: (repetitionType: RepetitionType) => void;
  setSelectedDays: (selectedDays: number[]) => void;
  setCustomDays: (customDays: number) => void;
  setCustomMonths: (customMonths: number) => void;
  setCompletionType: (completionType: CompletionType) => void;
  setCompletionGoal: (completionGoal: number) => void;
  setReminderEnabled: (reminderEnabled: boolean) => void;
  setReminderHour: (reminderHour: number) => void;
  setReminderMinute: (reminderMinute: number) => void;
  setReminderRepeat: (reminderRepeat: boolean) => void;
  setReminderRepeatIntervalMs: (reminderRepeatIntervalMs: number) => void;
  setTitleError: (titleError: string | null) => void;
  setScheduleError: (scheduleError: string | null) => void;
  setCompletionError: (completionError: string | null) => void;
  markClean: () => void;
}

const createDefaultDraft = () => ({
  title: "",
  icon: DEFAULT_HABIT_ICON,
  repetitionType: RepetitionType.DAILY,
  selectedDays: [],
  customDays: 1,
  customMonths: 1,
  completionType: CompletionType.SIMPLE,
  repetitionGoal: DEFAULT_REPETITION_GOAL,
  timedGoalMs: DEFAULT_TIMED_GOAL_MS,
  reminderEnabled: false,
  reminderHour: 9,
  reminderMinute: 0,
  reminderRepeat: false,
  reminderRepeatIntervalMs: 15 * 60000,
  isDirty: false,
  titleError: null,
  scheduleError: null,
  completionError: null,
  isEditMode: false,
});

export const useAddHabitDraftStore = create<AddHabitDraftState>()((set, get) => ({
  ...createDefaultDraft(),
  resetForCreate: () => set(createDefaultDraft()),
  loadHabit: (habit) => {
    const nextSelectedDays = habit.repetition.type === RepetitionType.WEEKDAYS ? habit.repetition.days : [];
    const nextCustomDays = habit.repetition.type === RepetitionType.INTERVAL ? habit.repetition.days : 1;
    const nextCustomMonths = habit.repetition.type === RepetitionType.MONTHLY ? habit.repetition.months : 1;
    const nextRepetitionGoal =
      habit.completion.type === CompletionType.REPETITIONS && typeof habit.completion.goal === "number"
        ? habit.completion.goal
        : DEFAULT_REPETITION_GOAL;
    const nextTimedGoalMs =
      habit.completion.type === CompletionType.TIMED && typeof habit.completion.goal === "number"
        ? habit.completion.goal
        : DEFAULT_TIMED_GOAL_MS;

    set({
      title: habit.title,
      icon: habit.icon,
      repetitionType: habit.repetition.type,
      selectedDays: nextSelectedDays,
      customDays: nextCustomDays,
      customMonths: nextCustomMonths,
      completionType: habit.completion.type,
      repetitionGoal: nextRepetitionGoal,
      timedGoalMs: nextTimedGoalMs,
      reminderEnabled: habit.reminder?.enabled ?? false,
      reminderHour: habit.reminder?.hour ?? 9,
      reminderMinute: habit.reminder?.minute ?? 0,
      reminderRepeat: habit.reminder?.repeatIfNotCompleted ?? false,
      reminderRepeatIntervalMs: habit.reminder?.repeatIntervalMs ?? 15 * 60000,
      isDirty: false,
      titleError: null,
      scheduleError: null,
      completionError: null,
      isEditMode: true,
    });
  },
  setTitle: (title) => set({ title, titleError: title.trim() ? null : get().titleError, isDirty: true }),
  setIcon: (icon) => set({ icon, isDirty: true }),
  setRepetitionType: (repetitionType) => set({ repetitionType, scheduleError: null, isDirty: true }),
  setSelectedDays: (selectedDays) =>
    set({ selectedDays, scheduleError: selectedDays.length > 0 ? null : get().scheduleError, isDirty: true }),
  setCustomDays: (customDays) =>
    set({ customDays, scheduleError: customDays >= 1 ? null : get().scheduleError, isDirty: true }),
  setCustomMonths: (customMonths) =>
    set({ customMonths, scheduleError: customMonths >= 1 ? null : get().scheduleError, isDirty: true }),
  setCompletionType: (completionType) => set({ completionType, completionError: null, isDirty: true }),
  setCompletionGoal: (completionGoal) => {
    const completionType = get().completionType;

    if (completionType === CompletionType.TIMED) {
      set({ timedGoalMs: completionGoal, completionError: null, isDirty: true });
      return;
    }

    if (completionType === CompletionType.REPETITIONS) {
      set({ repetitionGoal: completionGoal, completionError: null, isDirty: true });
      return;
    }

    set({ completionError: null, isDirty: true });
  },
  setReminderEnabled: (reminderEnabled) => set({ reminderEnabled, isDirty: true }),
  setReminderHour: (reminderHour) => set({ reminderHour, isDirty: true }),
  setReminderMinute: (reminderMinute) => set({ reminderMinute, isDirty: true }),
  setReminderRepeat: (reminderRepeat) => set({ reminderRepeat, isDirty: true }),
  setReminderRepeatIntervalMs: (reminderRepeatIntervalMs) => set({ reminderRepeatIntervalMs, isDirty: true }),
  setTitleError: (titleError) => set({ titleError }),
  setScheduleError: (scheduleError) => set({ scheduleError }),
  setCompletionError: (completionError) => set({ completionError }),
  markClean: () => set({ isDirty: false }),
}));
