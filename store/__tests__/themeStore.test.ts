/**
 * Tests for store/themeStore.ts
 *
 * Covers: mode switching, weekStartDay, timedHabitGoalBehavior.
 */

// ── Mock MMKV ─────────────────────────────────────────────────────────────────

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn().mockReturnValue(undefined),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// ── Mock Zustand persist so it's a no-op in tests ────────────────────────────

jest.mock("zustand/middleware", () => ({
  ...jest.requireActual("zustand/middleware"),
  persist: (fn: unknown) => fn,
}));

import { useThemeStore } from "@/store/themeStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Reset the store to its initial state before each test. */
function resetStore() {
  useThemeStore.setState({
    mode: "system",
    colorTheme: "sepia",
    weekStartDay: 1,
    timedHabitGoalBehavior: "continue",
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("themeStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe("initial state", () => {
    it("defaults to system mode", () => {
      expect(useThemeStore.getState().mode).toBe("system");
    });

    it("defaults weekStartDay to 1 (Monday)", () => {
      expect(useThemeStore.getState().weekStartDay).toBe(1);
    });

    it("defaults timed habit goal behavior to continue", () => {
      expect(useThemeStore.getState().timedHabitGoalBehavior).toBe("continue");
    });
  });

  describe("setMode", () => {
    it("switches to dark mode", () => {
      useThemeStore.getState().setMode("dark");
      expect(useThemeStore.getState().mode).toBe("dark");
    });

    it("switches to light mode", () => {
      useThemeStore.getState().setMode("dark");
      useThemeStore.getState().setMode("light");
      expect(useThemeStore.getState().mode).toBe("light");
    });

    it("switches to system mode", () => {
      useThemeStore.getState().setMode("dark");
      useThemeStore.getState().setMode("system");
      expect(useThemeStore.getState().mode).toBe("system");
    });
  });

  describe("setWeekStartDay", () => {
    it("sets weekStartDay to 0 (Sunday)", () => {
      useThemeStore.getState().setWeekStartDay(0);
      expect(useThemeStore.getState().weekStartDay).toBe(0);
    });

    it("sets weekStartDay to 1 (Monday)", () => {
      useThemeStore.getState().setWeekStartDay(0);
      useThemeStore.getState().setWeekStartDay(1);
      expect(useThemeStore.getState().weekStartDay).toBe(1);
    });
  });

  describe("setTimedHabitGoalBehavior", () => {
    it("switches to stop at goal", () => {
      useThemeStore.getState().setTimedHabitGoalBehavior("stop");
      expect(useThemeStore.getState().timedHabitGoalBehavior).toBe("stop");
    });

    it("switches back to continue beyond goal", () => {
      useThemeStore.getState().setTimedHabitGoalBehavior("stop");
      useThemeStore.getState().setTimedHabitGoalBehavior("continue");
      expect(useThemeStore.getState().timedHabitGoalBehavior).toBe("continue");
    });
  });
});
