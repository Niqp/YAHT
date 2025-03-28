import { MMKV } from "react-native-mmkv";
import { createJSONStorage } from "zustand/middleware";

type DeserializedMap = {
  __isMap: true;
  entries: [string, object | string][];
};

// Initialize MMKV instance
const storage = new MMKV();

export const mmkvStorage = createJSONStorage(
  () => ({
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
  }),
  {
    reviver: (key, value) => {
      // Check if the value is our special Map representation
      if (
        value &&
        typeof value === "object" &&
        "__isMap" in value &&
        (value as DeserializedMap).__isMap === true &&
        "entries" in value &&
        Array.isArray((value as DeserializedMap).entries)
      ) {
        // Convert back to a Map, preserving order
        return new Map((value as DeserializedMap).entries);
      }
      return value;
    },
    replacer: (key, value) => {
      // Check if the value is a Map
      if (value instanceof Map) {
        // Convert to a special format that preserves the entries order
        return {
          __isMap: true,
          entries: Array.from(value.entries()),
        };
      }
      return value;
    },
  }
);
