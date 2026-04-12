import { AppText, PressableCard } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import type { Habit } from "@/types/habit";
import { ChevronDown } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import HabitTypeIndicator from "./HabitTypeIndicator";

interface HabitSelectorProps {
  selectedHabit: Habit | null;
  onPress: () => void;
}

const HabitSelector: React.FC<HabitSelectorProps> = ({ selectedHabit, onPress }) => {
  const { colors } = useTheme();

  if (!selectedHabit) return null;

  return (
    <PressableCard
      onPress={onPress}
      backgroundColor={colors.bgSurface}
      bordered
      style={styles.selectorButton}
      accessibilityLabel={`Choose habit. Currently selected: ${selectedHabit.title}`}
      accessibilityHint="Opens the habit list"
    >
      <View style={styles.selectorRow}>
        <View style={styles.selectedHabitContainer}>
          <View style={[styles.selectedHabitIconContainer, { backgroundColor: colors.accentSoftBg }]}>
            <AppText style={styles.selectedHabitIcon}>{selectedHabit.icon}</AppText>
          </View>

          <View style={styles.selectedHabitTextBlock}>
            <AppText variant="bodyMedium" numberOfLines={1}>
              {selectedHabit.title}
            </AppText>
            <HabitTypeIndicator completionType={selectedHabit.completion.type} />
          </View>
        </View>

        <View style={styles.chevronContainer}>
          <ChevronDown size={18} color={colors.iconPrimary} strokeWidth={2} />
        </View>
      </View>
    </PressableCard>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    minHeight: 60,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  selectedHabitContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  selectedHabitIconContainer: {
    width: Spacing.xxl,
    height: Spacing.xxl,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedHabitIcon: {
    fontSize: 20,
    lineHeight: 22,
  },
  selectedHabitTextBlock: {
    flex: 1,
    gap: Spacing.xxs,
  },
  chevronContainer: {
    width: Spacing.base,
    alignItems: "flex-end",
  },
});

export default HabitSelector;
