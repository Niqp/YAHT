import React, { memo, useCallback, useMemo } from "react";
import { CalendarDays, CalendarCheck, RotateCcw } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { RepetitionType } from "@/types/habit";
import { addDays, getLocalizedShortDayName, getOrderedWeekDays } from "@/utils/date";
import { haptic } from "@/utils/haptics";
import { useTranslation } from "@/i18n";
import { isSupportedLocale } from "@/i18n/locale";
import { Pressable, StyleSheet, View } from "react-native";

import { AppSegmentedControl, AppText } from "@/components/ui";
import { FormSection, PresetPills, WheelPicker } from "@/components/ui/form";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import {
  WHEEL_PICKER_CARD_HEIGHT,
  WHEEL_PICKER_HEIGHT,
  WHEEL_PICKER_PANEL_HEIGHT,
} from "@/components/ui/form/WheelPicker.shared";

interface RepetitionPatternSectionProps {
  repetitionType: RepetitionType;
  setRepetitionType: (type: RepetitionType) => void;
  selectedDays: number[];
  setSelectedDays: (days: number[]) => void;
  customDays: number;
  setCustomDays: (days: number) => void;
  customMonths: number;
  setCustomMonths: (months: number) => void;
  weekStartDay: number;
  errorMessage?: string | null;
  presentation?: "card" | "sheet";
}

const chunkIntoRows = <T,>(items: ReadonlyArray<T>, size: number) => {
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
};

const WEEK_START_REFERENCE_DATE = "2026-02-15";

const SEGMENT_VALUES = [
  RepetitionType.DAILY,
  RepetitionType.WEEKDAYS,
  RepetitionType.INTERVAL,
  RepetitionType.MONTHLY,
] as const;

const RepetitionPatternSection: React.FC<RepetitionPatternSectionProps> = ({
  repetitionType,
  setRepetitionType,
  selectedDays,
  setSelectedDays,
  customDays,
  setCustomDays,
  customMonths,
  setCustomMonths,
  weekStartDay,
  errorMessage,
  presentation = "card",
}) => {
  const { colors } = useTheme();
  const { i18n, t } = useTranslation();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : "en";
  const intervalOptions = useMemo(
    () =>
      Array.from({ length: 365 }, (_, index) => ({
        value: index + 1,
        label: t("addHabit.units.day", { count: index + 1 }),
      })),
    [t]
  );
  const intervalPresets = useMemo(
    () =>
      [1, 2, 3, 7].map((value) => ({
        label: t("addHabit.units.day", { count: value }),
        value,
      })),
    [t]
  );
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 24 }, (_, index) => ({
        value: index + 1,
        label: t("addHabit.units.month", { count: index + 1 }),
      })),
    [t]
  );
  const monthPresets = useMemo(
    () =>
      [1, 2, 3, 6].map((value) => ({
        label: t("addHabit.units.month", { count: value }),
        value,
      })),
    [t]
  );

  const orderedWeekdays = useMemo(() => getOrderedWeekDays(weekStartDay, locale), [locale, weekStartDay]);
  const weekdayOptions = useMemo(
    () =>
      orderedWeekdays.map((day) => ({
        value: day.dayIndex,
        label: getLocalizedShortDayName(addDays(WEEK_START_REFERENCE_DATE, day.dayIndex), locale),
      })),
    [locale, orderedWeekdays]
  );
  const segmentedIndex = useMemo(() => SEGMENT_VALUES.indexOf(repetitionType), [repetitionType]);
  const weekdayRows = useMemo(() => chunkIntoRows(weekdayOptions, 3), [weekdayOptions]);

  const handleDayToggle = useCallback(
    (day: number) => {
      if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      } else {
        setSelectedDays([...selectedDays, day]);
      }
    },
    [selectedDays, setSelectedDays]
  );

  const activePanel =
    repetitionType === RepetitionType.DAILY ? (
      <View style={[styles.panel, styles.centeredPanel]}>
        <View style={styles.infoBlockCentered}>
          <View style={[styles.placeholderBadge, { backgroundColor: colors.accentSoftBg }]}>
            <CalendarDays size={34} color={colors.accent} />
          </View>
          <AppText variant="title" color={colors.textPrimary} style={styles.placeholderTitle}>
            {t("form.dueEveryDay")}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.placeholderCaption}>
            {t("form.dailyCaption")}
          </AppText>
        </View>
      </View>
    ) : repetitionType === RepetitionType.WEEKDAYS ? (
      <View style={styles.panel}>
        <View style={styles.scheduleControlBlock}>
          <View style={styles.completionTypeDescription}>
            <CalendarDays size={24} color={colors.accent} />
            <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription} numberOfLines={2}>
              {t("form.pickWeekdays")}
            </AppText>
          </View>
          <View style={[styles.weekdaySurface, { backgroundColor: colors.bgInset }]}>
            <View style={styles.weekdayGrid}>
              {weekdayRows.map((row, rowIndex) => (
                <View key={`weekday-row-${rowIndex}`} style={styles.weekdayRow}>
                  {row.map((option) => {
                    const isActive = selectedDays.includes(option.value);

                    return (
                      <Pressable
                        key={String(option.value)}
                        onPress={() => handleDayToggle(option.value)}
                        android_ripple={{ color: colors.ripple, borderless: false }}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                        style={({ pressed }) => [
                          styles.weekdayPill,
                          {
                            backgroundColor: isActive ? colors.chipSelectedBg : colors.chipBg,
                            borderColor: isActive ? colors.chipSelectedBorder : colors.chipBorder,
                          },
                          pressed ? styles.weekdayPillPressed : null,
                        ]}
                      >
                        <AppText variant="bodyMedium" color={isActive ? colors.chipSelectedText : colors.chipText}>
                          {option.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    ) : repetitionType === RepetitionType.INTERVAL ? (
      <View style={styles.panel}>
        <View style={styles.scheduleControlBlock}>
          <View style={styles.completionTypeDescription}>
            <RotateCcw size={24} color={colors.accent} />
            <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription} numberOfLines={2}>
              {t("form.dueEveryDays", { count: customDays })}
            </AppText>
          </View>
          <View style={[styles.pickerSurface, { backgroundColor: colors.bgInset }]}>
            <WheelPicker
              data={intervalOptions}
              value={customDays}
              onChange={setCustomDays}
              style={styles.picker}
              virtualized
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              animateMount={presentation === "sheet"}
            />
          </View>
          <PresetPills options={intervalPresets} selectedValue={customDays} onSelect={setCustomDays} />
        </View>
      </View>
    ) : (
      <View style={styles.panel}>
        <View style={styles.scheduleControlBlock}>
          <View style={styles.completionTypeDescription}>
            <CalendarCheck size={24} color={colors.accent} />
            <AppText variant="body" color={colors.textSecondary} style={styles.completionDescription} numberOfLines={2}>
              {t("form.dueEveryMonths", { count: customMonths })}
            </AppText>
          </View>
          <View style={[styles.pickerSurface, { backgroundColor: colors.bgInset }]}>
            <WheelPicker
              data={monthOptions}
              value={customMonths}
              onChange={setCustomMonths}
              style={styles.picker}
              virtualized
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              animateMount={presentation === "sheet"}
            />
          </View>
          <PresetPills options={monthPresets} selectedValue={customMonths} onSelect={setCustomMonths} />
        </View>
      </View>
    );

  const content = (
    <>
      <AppSegmentedControl
        values={[t("form.daily"), t("form.weekly"), t("form.interval"), t("form.monthly")]}
        selectedIndex={segmentedIndex}
        onChange={(index) => {
          const next = SEGMENT_VALUES[index] ?? RepetitionType.DAILY;

          if (next !== repetitionType) {
            void haptic.medium();
          }
          setRepetitionType(next);
        }}
        style={styles.segmentedControl}
      />

      <View style={[styles.optionsWrapper, { borderTopColor: colors.borderSubtle }]}>
        <View style={[styles.fixedPanelFrame, { backgroundColor: colors.bgInset, borderColor: colors.inputBorder }]}>
          {activePanel}
        </View>

        {errorMessage ? (
          <AppText variant="small" color={colors.danger} style={styles.feedbackText}>
            {errorMessage}
          </AppText>
        ) : null}
      </View>
    </>
  );

  if (presentation === "sheet") {
    return (
      <View>
        <AppText variant="title" color={colors.textPrimary} style={styles.sheetTitle}>
          {t("form.repeatability")}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.sheetDescription}>
          {t("form.scheduleDescription")}
        </AppText>
        {content}
      </View>
    );
  }

  return (
    <FormSection label={t("form.schedule")} description={t("form.scheduleDescription")}>
      {content}
    </FormSection>
  );
};

export default memo(RepetitionPatternSection);

const styles = StyleSheet.create({
  optionsWrapper: {
    borderTopWidth: 1,
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
  },
  segmentedControl: {
    marginBottom: Spacing.base,
  },
  sheetTitle: {
    marginBottom: Spacing.xs,
  },
  sheetDescription: {
    marginBottom: Spacing.base,
  },
  infoBlockCentered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  placeholderBadge: {
    width: 84,
    height: 84,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  placeholderTitle: {
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  placeholderCaption: {
    textAlign: "center",
    maxWidth: 228,
    lineHeight: 20,
  },
  fixedPanelFrame: {
    width: "100%",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    minHeight: WHEEL_PICKER_PANEL_HEIGHT,
    height: WHEEL_PICKER_PANEL_HEIGHT,
    overflow: "hidden",
  },
  panel: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  centeredPanel: {
    justifyContent: "center",
  },
  scheduleControlBlock: {
    flex: 1,
    gap: Spacing.md,
  },
  weekdaySurface: {
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  weekdayGrid: {
    gap: Spacing.sm,
    alignItems: "center",
  },
  weekdayRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  weekdayPill: {
    width: 86,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  weekdayPillPressed: {
    opacity: 0.82,
  },
  picker: {
    height: WHEEL_PICKER_HEIGHT,
    width: "100%",
  },
  pickerSurface: {
    height: WHEEL_PICKER_CARD_HEIGHT,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    overflow: "hidden",
    justifyContent: "center",
  },
  completionTypeDescription: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
  },
  completionDescription: {
    marginLeft: Spacing.md,
    flex: 1,
    lineHeight: 22,
  },
  feedbackText: {
    marginTop: Spacing.sm,
  },
});
