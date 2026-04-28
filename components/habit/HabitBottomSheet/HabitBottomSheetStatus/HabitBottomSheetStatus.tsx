import { useTheme } from "@/hooks/useTheme";
import { useStats } from "@/hooks/useStats";
import type { Habit } from "@/types/habit";
import { View } from "react-native";
import { useEffect } from "react";
import { AppText } from "@/components/ui";
import styles from "./HabitBottomSheetStatus.styles";
import { useTranslation } from "@/i18n";

interface HabitBottomSheetStatusProps {
  habit: Habit;
  isCompleted: boolean;
  selectedDate: string;
}

const HabitBottomSheetStatus = ({
  habit,
  isCompleted: _isCompleted,
  selectedDate: _selectedDate,
}: HabitBottomSheetStatusProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { habitStats, handleSelectHabit } = useStats();

  useEffect(() => {
    if (habit) {
      handleSelectHabit(habit);
    }
  }, [habit, handleSelectHabit]);

  if (!habit) return null;

  const { totalCompletions, adherenceSinceCreation, currentStreak } = habitStats;

  return (
    <View style={[styles.statusSection, { borderBottomColor: colors.borderSubtle }]}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <AppText variant="title" color={colors.textPrimary} tabularNums>
            {totalCompletions}
          </AppText>
          <AppText variant="small" color={colors.textSecondary} style={styles.statLabel}>
            {t("habits.details.total")}
          </AppText>
        </View>

        <View style={styles.statItem}>
          <AppText variant="title" color={colors.textPrimary} tabularNums>
            {adherenceSinceCreation}%
          </AppText>
          <AppText variant="small" color={colors.textSecondary} style={styles.statLabel}>
            {t("habits.details.adherence")}
          </AppText>
        </View>

        <View style={styles.statItem}>
          <AppText variant="title" color={colors.textPrimary} tabularNums>
            {currentStreak}
          </AppText>
          <AppText variant="small" color={colors.textSecondary} style={styles.statLabel}>
            {t("habits.details.streak")}
          </AppText>
        </View>
      </View>
    </View>
  );
};

export default HabitBottomSheetStatus;
