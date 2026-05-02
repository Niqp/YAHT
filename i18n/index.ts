import "@formatjs/intl-getcanonicallocales/polyfill-force.js";
import "@formatjs/intl-locale/polyfill-force.js";
import "@formatjs/intl-pluralrules/polyfill-force.js";
import "@formatjs/intl-pluralrules/locale-data/en.js";
import "@formatjs/intl-pluralrules/locale-data/ru.js";

import i18n, { type TOptions } from "i18next";
import ICU from "i18next-icu";
import { initReactI18next, useTranslation as useReactTranslation } from "react-i18next";

import { getDeviceLocale, type SupportedLocale } from "@/i18n/locale";
import { en } from "@/i18n/locales/en";
import { ru } from "@/i18n/locales/ru";

const resources = {
  en: { translation: en },
  ru: { translation: ru },
} as const;

let hasInitialized = false;

export const initializeI18n = (locale: SupportedLocale = getDeviceLocale()) => {
  if (hasInitialized) {
    return i18n;
  }

  void i18n
    .use(new ICU())
    .use(initReactI18next)
    .init({
      fallbackLng: "en",
      initAsync: false,
      interpolation: {
        escapeValue: false,
      },
      lng: locale,
      resources,
    });

  hasInitialized = true;
  return i18n;
};

export const changeI18nLanguage = async (locale: SupportedLocale) => {
  initializeI18n(locale);
  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
};

export const syncI18nToDeviceLocale = async () => {
  const locale = getDeviceLocale();
  if (i18n.language !== locale) {
    await i18n.changeLanguage(locale);
  }
};

export const translate = (key: string, options?: TOptions) => {
  initializeI18n();
  return i18n.t(key, options);
};

export const useTranslation = () => {
  initializeI18n();
  return useReactTranslation();
};

export { i18n };
