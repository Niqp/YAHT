import { RepetitionPatternSection } from "@/components/habitForm";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { useAddHabitDraftStore } from "@/store/addHabitDraftStore";
import { Stack, router } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScaleButton } from "@/components/ui";
import { getElevation } from "@/constants/Elevation";

export default function RepetitionRoute() {
  const { colors, weekStartDay } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const draftRepetitionType = useAddHabitDraftStore((state) => state.repetitionType);
  const draftSelectedDays = useAddHabitDraftStore((state) => state.selectedDays);
  const draftCustomDays = useAddHabitDraftStore((state) => state.customDays);
  const draftCustomMonths = useAddHabitDraftStore((state) => state.customMonths);
  const scheduleError = useAddHabitDraftStore((state) => state.scheduleError);
  const setRepetitionType = useAddHabitDraftStore((state) => state.setRepetitionType);
  const setSelectedDays = useAddHabitDraftStore((state) => state.setSelectedDays);
  const setCustomDays = useAddHabitDraftStore((state) => state.setCustomDays);
  const setCustomMonths = useAddHabitDraftStore((state) => state.setCustomMonths);
  const [repetitionType, setLocalRepetitionType] = useState(draftRepetitionType);
  const [selectedDays, setLocalSelectedDays] = useState(draftSelectedDays);
  const [customDays, setLocalCustomDays] = useState(draftCustomDays);
  const [customMonths, setLocalCustomMonths] = useState(draftCustomMonths);

  const handleSave = useCallback(() => {
    setRepetitionType(repetitionType);
    setSelectedDays(selectedDays);
    setCustomDays(customDays);
    setCustomMonths(customMonths);
    router.back();
  }, [
    customDays,
    customMonths,
    repetitionType,
    selectedDays,
    setCustomDays,
    setCustomMonths,
    setRepetitionType,
    setSelectedDays,
  ]);

  return (
    <>
      <Stack.Screen options={{ title: t("addHabit.sections.repeatability") }} />
      <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
        <View style={styles.content}>
          <RepetitionPatternSection
            repetitionType={repetitionType}
            setRepetitionType={setLocalRepetitionType}
            selectedDays={selectedDays}
            setSelectedDays={setLocalSelectedDays}
            customDays={customDays}
            setCustomDays={setLocalCustomDays}
            customMonths={customMonths}
            setCustomMonths={setLocalCustomMonths}
            weekStartDay={weekStartDay}
            errorMessage={scheduleError}
            presentation="sheet"
            showHeading={false}
          />
        </View>
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: colors.bgSurface,
              borderTopColor: colors.borderSubtle,
              paddingBottom: insets.bottom + Spacing.base,
            },
            getElevation(2, colors.shadow),
          ]}
        >
          <ScaleButton label={t("common.save")} onPress={handleSave} />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.base,
  },
  actionBar: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.base,
  },
});
