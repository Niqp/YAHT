import { Platform } from "react-native";

import { syncNativeReminderActionState } from "@/utils/nativeReminderActions";

const mockDrainIosNativeReminderActions = jest.fn(() => Promise.resolve());
const mockDrainAndroidNativeReminderActions = jest.fn(() => Promise.resolve());
const mockRehydrate = jest.fn(() => Promise.resolve());

jest.mock("@/utils/iosNativeReminderActions", () => ({
  drainIosNativeReminderActions: () => mockDrainIosNativeReminderActions(),
}));

jest.mock("@/utils/androidNativeReminderActions", () => ({
  drainAndroidNativeReminderActions: () => mockDrainAndroidNativeReminderActions(),
}));

jest.mock("@/store/habitStore", () => {
  const useHabitStore = jest.fn();
  (useHabitStore as unknown as { persist: { rehydrate: () => Promise<void> } }).persist = {
    rehydrate: () => mockRehydrate(),
  };
  return { useHabitStore };
});

describe("syncNativeReminderActionState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("drains iOS records and rehydrates the main habit store on Android", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });

    await syncNativeReminderActionState();

    expect(mockDrainIosNativeReminderActions).toHaveBeenCalledTimes(1);
    expect(mockRehydrate).toHaveBeenCalledTimes(1);
    expect(mockDrainAndroidNativeReminderActions).toHaveBeenCalledTimes(1);
  });

  it("does not rehydrate the main habit store on non-Android platforms", async () => {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });

    await syncNativeReminderActionState();

    expect(mockDrainIosNativeReminderActions).toHaveBeenCalledTimes(1);
    expect(mockRehydrate).not.toHaveBeenCalled();
    expect(mockDrainAndroidNativeReminderActions).toHaveBeenCalledTimes(1);
  });
});
