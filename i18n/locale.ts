import * as Localization from "expo-localization";

export const SUPPORTED_LOCALES = ["en", "ru"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

type LocaleCandidate = Pick<Localization.Locale, "languageTag" | "languageCode">;

const DEFAULT_LOCALE: SupportedLocale = "en";

export const isSupportedLocale = (locale: string | null | undefined): locale is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
};

export const resolveSupportedLocale = (locales: LocaleCandidate[]): SupportedLocale => {
  for (const locale of locales) {
    const languageCode = locale.languageCode?.toLowerCase();
    if (isSupportedLocale(languageCode)) {
      return languageCode;
    }

    const languageTag = locale.languageTag.split("-")[0]?.toLowerCase();
    if (isSupportedLocale(languageTag)) {
      return languageTag;
    }
  }

  return DEFAULT_LOCALE;
};

export const getDeviceLocale = (): SupportedLocale => {
  return resolveSupportedLocale(Localization.getLocales());
};
