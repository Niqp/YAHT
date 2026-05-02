import { getLocalizedMonthYear, getLocalizedShortDayName } from "@/utils/date";

describe("localized date helpers", () => {
  it("formats short weekday labels in English", () => {
    expect(getLocalizedShortDayName("2026-02-16", "en")).toBe("Mon");
  });

  it("formats short weekday labels in Russian", () => {
    expect(getLocalizedShortDayName("2026-02-16", "ru")).toBe("Пн");
  });

  it("formats month and year in Russian", () => {
    expect(getLocalizedMonthYear("2026-02-16", "ru")).toBe("Февр. 2026");
  });
});
