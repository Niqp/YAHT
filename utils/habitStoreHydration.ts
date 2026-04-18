import { useHabitStore } from "@/store/habitStore";

export const waitForHabitStoreHydration = async (timeoutMs = 2_000): Promise<boolean> => {
  if (useHabitStore.getState()._hasHydrated) {
    return true;
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      resolve(useHabitStore.getState()._hasHydrated);
    }, timeoutMs);

    const unsubscribe = useHabitStore.subscribe((state) => {
      if (!state._hasHydrated) {
        return;
      }

      clearTimeout(timeout);
      unsubscribe();
      resolve(true);
    });
  });
};
