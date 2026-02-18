/**
 * Tests for utils/storage.ts — the MMKV adapter for Zustand persist.
 *
 * Note: mmkvStorage is wrapped by Zustand's createJSONStorage, which
 * automatically JSON.parses getItem results and JSON.stringifies setItem values.
 * We test the raw MMKV calls (what actually hits the native layer).
 */

jest.mock("react-native-mmkv", () => {
  const mockInstance = {
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };
  const MockMMKV = jest.fn().mockImplementation(() => mockInstance);
  (MockMMKV as unknown as { _instance: typeof mockInstance })._instance = mockInstance;
  return { MMKV: MockMMKV };
});

import { MMKV } from "react-native-mmkv";
import { mmkvStorage } from "@/utils/storage";

const mockInstance = (MMKV as unknown as { _instance: ReturnType<typeof MMKV> })._instance as {
  getString: jest.Mock;
  set: jest.Mock;
  delete: jest.Mock;
};

describe("mmkvStorage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getItem", () => {
    it("calls getString with the correct key and returns the parsed value", async () => {
      // createJSONStorage wraps the raw string in JSON.parse, so we store a JSON string
      mockInstance.getString.mockReturnValue('"hello"');
      const result = await mmkvStorage.getItem("my-key");
      expect(mockInstance.getString).toHaveBeenCalledWith("my-key");
      // Zustand parses the JSON string, so result is the parsed value
      expect(result).toBe("hello");
    });

    it("returns null when the key does not exist", async () => {
      mockInstance.getString.mockReturnValue(undefined);
      const result = await mmkvStorage.getItem("missing-key");
      expect(result).toBeNull();
    });
  });

  describe("setItem", () => {
    it("calls set with the key and JSON-stringified value", async () => {
      // Zustand calls setItem with the already-serialized string
      await mmkvStorage.setItem("my-key", { state: { x: 1 } } as never);
      expect(mockInstance.set).toHaveBeenCalledWith("my-key", expect.any(String));
      expect(mockInstance.set).toHaveBeenCalledTimes(1);
    });
  });

  describe("removeItem", () => {
    it("calls delete with the correct key", async () => {
      await mmkvStorage.removeItem("my-key");
      expect(mockInstance.delete).toHaveBeenCalledWith("my-key");
    });
  });
});
