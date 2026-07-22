import { create } from "zustand";

interface TimerClockState {
  nowMs: number;
  setNowMs: (nowMs: number) => void;
}

export const useTimerClockStore = create<TimerClockState>()((set) => ({
  nowMs: Date.now(),
  setNowMs: (nowMs) => set({ nowMs }),
}));
