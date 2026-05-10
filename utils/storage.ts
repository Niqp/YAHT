import { Platform } from "react-native";
import { createJSONStorage } from "zustand/middleware";

import { YAHT_PERSISTENCE_STORAGE_ID } from "@/utils/storageIds";

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

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

// ── Native: MMKV adapter ───────────────────────────────────────────────────────
function createNativeStorage() {
  // Dynamic require so web bundles never touch MMKV
  const { MMKV } = require("react-native-mmkv");
  const storage = new MMKV({ id: YAHT_PERSISTENCE_STORAGE_ID });

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

export const mmkvStorage = createJSONStorage(() => {
  try {
    return Platform.OS === "web" ? webStorage : createNativeStorage();
  } catch {
    return noopStorage;
  }
})!;
