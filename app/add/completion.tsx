import { CompletionTypeSection } from "@/components/habitForm";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { DEFAULT_REPETITION_GOAL, useAddHabitDraftStore } from "@/store/addHabitDraftStore";
import { CompletionType } from "@/types/habit";
import { Stack, router } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScaleButton } from "@/components/ui";
import { getElevation } from "@/constants/Elevation";

export default function CompletionRoute() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const draftCompletionType = useAddHabitDraftStore((state) => state.completionType);
  const draftRepetitionGoal = useAddHabitDraftStore((state) => state.repetitionGoal);
  const draftTimedGoalMs = useAddHabitDraftStore((state) => state.timedGoalMs);
  const isEditMode = useAddHabitDraftStore((state) => state.isEditMode);
  const completionError = useAddHabitDraftStore((state) => state.completionError);
  const setCompletionType = useAddHabitDraftStore((state) => state.setCompletionType);
  const setCompletionGoal = useAddHabitDraftStore((state) => state.setCompletionGoal);
  const [completionType, setLocalCompletionType] = useState(draftCompletionType);
  const [repetitionGoal, setLocalRepetitionGoal] = useState(draftRepetitionGoal);
  const [timedGoalMs, setLocalTimedGoalMs] = useState(draftTimedGoalMs);
  const resolvedCompletionGoal =
    completionType === CompletionType.TIMED
      ? timedGoalMs
      : completionType === CompletionType.REPETITIONS
        ? repetitionGoal
        : DEFAULT_REPETITION_GOAL;

  const handleCompletionGoalChange = useCallback(
    (nextGoal: number) => {
      if (completionType === CompletionType.TIMED) {
        setLocalTimedGoalMs(nextGoal);
        return;
      }

      if (completionType === CompletionType.REPETITIONS) {
        setLocalRepetitionGoal(nextGoal);
      }
    },
    [completionType]
  );

  const handleSave = useCallback(() => {
    setCompletionType(completionType);
    setCompletionGoal(resolvedCompletionGoal);
    router.back();
  }, [completionType, resolvedCompletionGoal, setCompletionGoal, setCompletionType]);

  return (
    <>
      <Stack.Screen options={{ title: t("addHabit.sections.habitType") }} />
      <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
        <View style={styles.content}>
          <CompletionTypeSection
            completionType={completionType}
            setCompletionType={setLocalCompletionType}
            completionGoal={resolvedCompletionGoal}
            setCompletionGoal={handleCompletionGoalChange}
            isEditMode={isEditMode}
            errorMessage={completionError}
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
