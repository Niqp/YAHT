import styles from "./HabitBottomSheetHeader.styles";
import { View, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { X } from "lucide-react-native";
import type { Habit } from "@/types/habit";
import { AppText } from "@/components/ui";
import HabitTypeIndicator from "@/components/stats/HabitTypeIndicator";
import { useTranslation } from "@/i18n";

export default function HabitBottomSheetHeader({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  let formattedTimeGoal = "";
  if (habit.completion.type === "timed") {
    const totalMinutes = Math.floor((habit.completion.goal || 0) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    formattedTimeGoal = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;
  }

  return (
    <View style={[styles.headerContainer, { borderBottomColor: colors.borderSubtle }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.bgInset, borderColor: colors.borderSubtle }]}>
        <AppText style={styles.habitIcon}>{habit.icon}</AppText>
      </View>
      <View style={styles.habitInfoContainer}>
        <AppText variant="title" color={colors.textPrimary} style={styles.habitTitle} numberOfLines={2}>
          {habit.title}
        </AppText>
        <HabitTypeIndicator completionType={habit.completion.type} />
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
          {habit.completion.type === "simple"
            ? t("habits.details.goalOnce")
            : habit.completion.type === "repetitions"
              ? t("habits.details.goalRepetitions", { count: habit.completion.goal || 0 })
              : t("habits.details.goalDuration", { duration: formattedTimeGoal })}
        </AppText>
      </View>
      <Pressable
        style={styles.closeButton}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t("habits.details.close")}
      >
        <X size={18} color={colors.iconSecondary} />
      </Pressable>
    </View>
  );
}
