import { useMemo } from "react";

import { useTranslation } from "@/i18n";

export type UnitKey = "day" | "month" | "rep" | "hr" | "min" | "sec";

// Unit labels are formatted lazily per visible wheel-picker row; the cache keeps
// repeated rows (scrolling, re-opens) at one Map lookup instead of an ICU t() call.
const unitLabelCache = new Map<string, string>();

/**
 * Returns a `(count) => label` formatter for a pluralized unit label
 * (e.g. "3 days" / "3 дня"). Results are cached per language+unit+count.
 * The formatter identity changes with the active language, so memoized
 * consumers re-render on language switch.
 */
export const useUnitLabelFormatter = (unit: UnitKey): ((count: number) => string) => {
  const { i18n, t } = useTranslation();
  const language = i18n.language;

  return useMemo(
    () => (count: number) => {
      const cacheKey = `${language}|${unit}|${count}`;
      let label = unitLabelCache.get(cacheKey);

      if (label === undefined) {
        label = t(`addHabit.units.${unit}`, { count });
        unitLabelCache.set(cacheKey, label);
      }

      return label;
    },
    [language, t, unit]
  );
};
