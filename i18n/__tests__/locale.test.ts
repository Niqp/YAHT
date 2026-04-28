import { resolveSupportedLocale } from "@/i18n/locale";

describe("resolveSupportedLocale", () => {
  it("uses Russian for ru-RU device locales", () => {
    expect(resolveSupportedLocale([{ languageTag: "ru-RU", languageCode: "ru" }])).toBe("ru");
  });

  it("falls back to English for unsupported locales", () => {
    expect(resolveSupportedLocale([{ languageTag: "fr-FR", languageCode: "fr" }])).toBe("en");
  });

  it("falls back to English when no locale is available", () => {
    expect(resolveSupportedLocale([])).toBe("en");
  });
});
