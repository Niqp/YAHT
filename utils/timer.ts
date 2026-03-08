import type { ConfigType } from "dayjs";

import { CompletionType, type Habit } from "@/types/habit";
import type { DateStamp } from "@/types/date";
import type { Timer } from "@/types/timer";
import { getDayjs } from "@/utils/date";

export const getElapsedTimerMs = (lastResumedAt: string | null, now: ConfigType): number => {
  if (!lastResumedAt) return 0;

  const elapsed = getDayjs(now).diff(getDayjs(lastResumedAt), "milliseconds");
  return Math.max(0, elapsed);
};

export const getTimerRemainingMs = (
  habit: Habit | undefined,
  date: DateStamp,
  timer: Timer | undefined,
  now: ConfigType
): number | null => {
  if (!habit || !timer || habit.completion.type !== CompletionType.TIMED) {
    return null;
  }

  const storedTime = habit.completionHistory[date]?.value || 0;
  const elapsedTime = getElapsedTimerMs(timer.lastResumedAt, now);
  const totalTime = storedTime + elapsedTime;

  return Math.max(habit.completion.goal - totalTime, 0);
};
