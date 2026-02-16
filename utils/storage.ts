import { MMKV } from "react-native-mmkv";
import { createJSONStorage } from "zustand/middleware";

// Initialize MMKV instance
const storage = new MMKV();

export const mmkvStorage = createJSONStorage(() => ({
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
}));
