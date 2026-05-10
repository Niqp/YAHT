import HabitSummaryCard from "@/components/habit/HabitSummaryCard";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import type { Habit } from "@/types/habit";
import { ChevronDown } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface HabitSelectorProps {
  selectedHabit: Habit | null;
  onPress: () => void;
}

const HabitSelector: React.FC<HabitSelectorProps> = ({ selectedHabit, onPress }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!selectedHabit) return null;

  return (
    <HabitSummaryCard
      habit={selectedHabit}
      onPress={onPress}
      accessibilityLabel={t("stats.chooseHabitAccessibility", { title: selectedHabit.title })}
      accessibilityHint={t("stats.openHabitListHint")}
      trailing={
        <View style={styles.chevronContainer}>
          <ChevronDown size={18} color={colors.iconPrimary} strokeWidth={2} />
        </View>
      }
    />
  );
};

const styles = StyleSheet.create({
  chevronContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default HabitSelector;
