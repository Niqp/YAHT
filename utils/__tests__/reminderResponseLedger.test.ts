import {
  claimReminderResponse,
  REMINDER_RESPONSE_LEDGER_TTL_MS,
  setReminderResponseLedgerStorageForTests,
} from "@/utils/reminderResponseLedger";

const LEDGER_KEY = "reminder-response-ledger";

const createStorage = (initialValue?: string) => {
  const values = new Map<string, string>();
  if (initialValue !== undefined) {
    values.set(LEDGER_KEY, initialValue);
  }

  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      },
    },
  };
};

describe("reminder response ledger", () => {
  afterEach(() => {
    setReminderResponseLedgerStorageForTests(undefined);
  });

  it("claims each response key once", () => {
    const { storage } = createStorage();
    setReminderResponseLedgerStorageForTests(storage);

    expect(claimReminderResponse("reminder-1:done", 1_000)).toBe(true);
    expect(claimReminderResponse("reminder-1:done", 2_000)).toBe(false);
  });

  it("trims expired entries and allows them to be claimed again", () => {
    const expiredAt = 1_000;
    const nowMs = expiredAt + REMINDER_RESPONSE_LEDGER_TTL_MS + 1;
    const { storage, values } = createStorage(
      JSON.stringify([
        { responseKey: "old:done", handledAtMs: expiredAt },
        { responseKey: "fresh:done", handledAtMs: nowMs },
      ])
    );
    setReminderResponseLedgerStorageForTests(storage);

    expect(claimReminderResponse("old:done", nowMs)).toBe(true);

    const entries = JSON.parse(values.get(LEDGER_KEY) ?? "[]");
    expect(entries).toEqual([
      { responseKey: "fresh:done", handledAtMs: nowMs },
      { responseKey: "old:done", handledAtMs: nowMs },
    ]);
  });

  it("recovers from invalid stored JSON", () => {
    const { storage } = createStorage("{not-json");
    setReminderResponseLedgerStorageForTests(storage);

    expect(claimReminderResponse("reminder-1:snooze", 1_000)).toBe(true);
    expect(claimReminderResponse("reminder-1:snooze", 2_000)).toBe(false);
  });
});
