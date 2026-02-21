import { Platform } from "react-native";
import { createJSONStorage } from "zustand/middleware";

// ── Web: localStorage adapter ──────────────────────────────────────────────────
const webStorage = {
  getItem: (name: string) => {
    try {
      return window.localStorage.getItem(name) ?? null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // silently ignore — quota exceeded, private browsing, etc.
    }
  },
  removeItem: (name: string) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // silently ignore
    }
  },
};

// ── Native: MMKV adapter ───────────────────────────────────────────────────────
function createNativeStorage() {
  // Dynamic require so web bundles never touch MMKV
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MMKV } = require("react-native-mmkv");
  const storage = new MMKV();
  return {
    getItem: (name: string) => {
      const value = storage.getString(name);
      return value ?? null;
    },
    setItem: (name: string, value: string) => {
      storage.set(name, value);
    },
    removeItem: (name: string) => {
      storage.delete(name);
    },
  };
}

export const mmkvStorage = createJSONStorage(() =>
  Platform.OS === "web" ? webStorage : createNativeStorage()
);
