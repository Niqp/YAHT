import { changeI18nLanguage, initializeI18n, translate } from "@/i18n";

describe("translations", () => {
  beforeAll(() => {
    initializeI18n("en");
  });

  it("formats English active habit plurals", () => {
    expect(translate("stats.activeHabits", { count: 1 })).toBe("1 active habit");
    expect(translate("stats.activeHabits", { count: 2 })).toBe("2 active habits");
  });

  it("formats Russian active habit plurals", async () => {
    await changeI18nLanguage("ru");

    expect(translate("stats.activeHabits", { count: 1 })).toBe("1 активная привычка");
    expect(translate("stats.activeHabits", { count: 2 })).toBe("2 активные привычки");
    expect(translate("stats.activeHabits", { count: 5 })).toBe("5 активных привычек");
    expect(translate("stats.activeHabits", { count: 21 })).toBe("21 активная привычка");
  });
});
