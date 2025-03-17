
// create a dud for testing purposes
export const useHabitTimer = (habitId: string, goalTimeMs: number, selectedDate: string) => {
  return {
    timerActive: false,
    getTotalElapsedTime: () => 0,
    startTimer: () => {},
    pauseTimer: () => {},
    resetTimer: () => {},
  }
}