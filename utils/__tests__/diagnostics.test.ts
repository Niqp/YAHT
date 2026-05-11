jest.mock("react-native", () => ({
  Platform: { OS: "android" },
}));

jest.mock("react-native-mmkv", () => {
  const stores = new Map<string, Map<string, string>>();
  const MockMMKV = jest.fn().mockImplementation(({ id = "default" } = {}) => {
    if (!stores.has(id)) {
      stores.set(id, new Map());
    }
    const store = stores.get(id)!;
    return {
      getString: jest.fn((key: string) => store.get(key)),
      set: jest.fn((key: string, value: string) => {
        store.set(key, value);
      }),
      delete: jest.fn((key: string) => {
        store.delete(key);
      }),
    };
  });
  (MockMMKV as unknown as { _stores: typeof stores })._stores = stores;
  return { MMKV: MockMMKV };
});

jest.mock("expo-file-system", () => {
  const writeMock = jest.fn();
  class MockFile {
    uri: string;
    name: string;

    constructor(directory: { uri: string }, name: string) {
      this.name = name;
      this.uri = `${directory.uri}/${name}`;
    }

    create = jest.fn();
    write = writeMock;
  }

  class MockDirectory {
    uri: string;

    constructor(uri: string) {
      this.uri = uri;
    }

    createFile = jest.fn((name: string) => new MockFile(this, name));

    static pickDirectoryAsync = jest.fn(async () => new MockDirectory("file:///picked"));
  }

  return { Directory: MockDirectory, File: MockFile, __writeMock: writeMock };
});

jest.mock("expo-constants", () => ({
  expoConfig: { version: "9.8.7" },
}));

jest.mock("@/store/themeStore", () => ({
  useThemeStore: {
    getState: () => ({ mode: "dark" }),
  },
}));

import { Directory } from "expo-file-system";
import { clearDiagnosticEvents, getDiagnosticEvents, logEvent } from "@/utils/diagnostics/diagnosticLogger";
import { exportDiagnosticReport, getDiagnosticReport } from "@/utils/diagnostics/diagnosticExport";
import { sanitizeDiagnosticContext } from "@/utils/diagnostics/diagnosticRedaction";

const { __writeMock } = jest.requireMock("expo-file-system") as { __writeMock: jest.Mock };

describe("diagnostics", () => {
  beforeEach(() => {
    clearDiagnosticEvents();
    jest.clearAllMocks();
  });

  it("keeps only diagnostics inside the retention window", () => {
    logEvent("old.event", { source: "test" }, { nowMs: 1_000 });
    logEvent("fresh.event", { source: "test" }, { nowMs: 8 * 24 * 60 * 60 * 1000 });

    expect(getDiagnosticEvents({ nowMs: 8 * 24 * 60 * 60 * 1000 })).toEqual([
      expect.objectContaining({ event: "fresh.event" }),
    ]);
  });

  it("redacts habit titles, icons, raw strings, and raw errors", () => {
    const sanitized = sanitizeDiagnosticContext({
      habitId: "habit-1",
      habitTitle: "Therapy",
      title: "Private habit",
      icon: "x",
      completionType: "timed",
      reminderEnabled: true,
      count: 3,
      error: new Error("Private path /Users/name/file.json"),
      nested: { habitTitle: "Nested private" },
    });

    expect(JSON.stringify(sanitized)).not.toContain("Therapy");
    expect(JSON.stringify(sanitized)).not.toContain("Private habit");
    expect(JSON.stringify(sanitized)).not.toContain("Nested private");
    expect(JSON.stringify(sanitized)).not.toContain("/Users/name");
    expect(sanitized).toEqual(
      expect.objectContaining({
        habitId: "habit-1",
        completionType: "timed",
        reminderEnabled: true,
        count: 3,
        errorName: "Error",
      })
    );
  });

  it("builds a structured report without persisted PII", () => {
    logEvent(
      "habit.created",
      {
        habitId: "habit-1",
        habitTitle: "Private habit",
        completionType: "simple",
      },
      { nowMs: 1_000 }
    );

    const report = getDiagnosticReport({ nowMs: 2_000 });

    expect(report).toEqual(
      expect.objectContaining({
        schemaVersion: 1,
        app: expect.objectContaining({ version: "9.8.7", platform: "android", themeMode: "dark" }),
        storage: expect.objectContaining({ eventCount: 1, jsEventCount: 1 }),
        events: [expect.objectContaining({ event: "habit.created" })],
        jsEvents: [expect.objectContaining({ event: "habit.created" })],
      })
    );
    expect(JSON.stringify(report)).not.toContain("Private habit");
  });

  it("exports the report to a user-selected directory", async () => {
    logEvent("habit.deleted", { habitId: "habit-1" }, { nowMs: 1_000 });

    const result = await exportDiagnosticReport({ nowMs: 2_000 });

    expect(Directory.pickDirectoryAsync).toHaveBeenCalledTimes(1);
    expect(__writeMock).toHaveBeenCalledWith(expect.stringContaining('"schemaVersion": 1'));
    expect(result.fileName).toMatch(/^yaht-diagnostics-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);
    expect(result.fileName).not.toContain("T");
    expect(result.fileName).not.toContain("Z");
    expect(result.uri).toBe(`file:///picked/${result.fileName}`);
  });
});
