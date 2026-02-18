/**
 * Tests for store/themeStore.ts
 *
 * Covers: mode switching, weekStartDay, system theme detection,
 * setupSystemThemeListener, and updateSystemTheme.
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

// ── Mock react-native Appearance and AppState ─────────────────────────────────

const mockGetColorScheme = jest.fn().mockReturnValue("light");
const mockAddEventListener = jest.fn();

jest.mock("react-native", () => ({
    Appearance: {
        getColorScheme: (...args: unknown[]) => mockGetColorScheme(...args),
    },
    AppState: {
        addEventListener: (...args: unknown[]) => mockAddEventListener(...args),
    },
}));

import { useThemeStore } from "@/store/themeStore";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Reset the store to its initial state before each test. */
function resetStore() {
    useThemeStore.setState({
        mode: "system",
        colorScheme: "light",
        weekStartDay: 1,
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("themeStore", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetColorScheme.mockReturnValue("light");
        resetStore();
    });

    describe("initial state", () => {
        it("defaults to system mode", () => {
            expect(useThemeStore.getState().mode).toBe("system");
        });

        it("defaults weekStartDay to 1 (Monday)", () => {
            expect(useThemeStore.getState().weekStartDay).toBe(1);
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

        it("is a no-op when setting the same mode", () => {
            const before = useThemeStore.getState().colors;
            useThemeStore.getState().setMode("system");
            expect(useThemeStore.getState().colors).toBe(before);
        });

        it("resolves system mode against the current OS scheme", () => {
            mockGetColorScheme.mockReturnValue("dark");
            useThemeStore.getState().setMode("dark");
            useThemeStore.getState().setMode("system");
            // After switching back to system with OS=dark, colorScheme should be dark
            expect(useThemeStore.getState().colorScheme).toBe("dark");
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

    describe("updateSystemTheme", () => {
        it("does nothing when mode is not 'system'", () => {
            useThemeStore.getState().setMode("dark");
            mockGetColorScheme.mockReturnValue("light");
            useThemeStore.getState().updateSystemTheme();
            // mode is dark, so colorScheme should stay as dark
            expect(useThemeStore.getState().mode).toBe("dark");
        });

        it("updates colorScheme when OS theme changes while in system mode", () => {
            // Start in system/light
            expect(useThemeStore.getState().colorScheme).toBe("light");
            // OS switches to dark
            mockGetColorScheme.mockReturnValue("dark");
            useThemeStore.getState().updateSystemTheme();
            expect(useThemeStore.getState().colorScheme).toBe("dark");
        });

        it("does not update when OS theme has not changed", () => {
            // colorScheme is already 'light', OS returns 'light'
            const before = useThemeStore.getState().colors;
            useThemeStore.getState().updateSystemTheme();
            expect(useThemeStore.getState().colors).toBe(before);
        });
    });

    describe("setupSystemThemeListener", () => {
        it("registers an AppState event listener", () => {
            const mockRemove = jest.fn();
            mockAddEventListener.mockReturnValue({ remove: mockRemove });

            const cleanup = useThemeStore.getState().setupSystemThemeListener();
            expect(mockAddEventListener).toHaveBeenCalledWith("change", expect.any(Function));

            cleanup();
            expect(mockRemove).toHaveBeenCalled();
        });

        it("calls onThemeSync callback when app becomes active", () => {
            const onThemeSync = jest.fn();
            let capturedHandler: ((state: string) => void) | null = null;

            mockAddEventListener.mockImplementation((_event: string, handler: (state: string) => void) => {
                capturedHandler = handler;
                return { remove: jest.fn() };
            });

            useThemeStore.getState().setupSystemThemeListener(onThemeSync);
            capturedHandler?.("active");
            expect(onThemeSync).toHaveBeenCalledTimes(1);
        });

        it("does not call onThemeSync when app goes to background", () => {
            const onThemeSync = jest.fn();
            let capturedHandler: ((state: string) => void) | null = null;

            mockAddEventListener.mockImplementation((_event: string, handler: (state: string) => void) => {
                capturedHandler = handler;
                return { remove: jest.fn() };
            });

            useThemeStore.getState().setupSystemThemeListener(onThemeSync);
            capturedHandler?.("background");
            expect(onThemeSync).not.toHaveBeenCalled();
        });
    });
});
