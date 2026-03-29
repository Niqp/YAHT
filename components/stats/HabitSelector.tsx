import { AppText, PressableCard } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
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

  if (!selectedHabit) return null;

  return (
    <View style={styles.section}>
      <AppText variant="label" color={colors.textSecondary}>
        Viewing detailed stats for
      </AppText>

      <PressableCard
        onPress={onPress}
        backgroundColor={colors.cardBackground}
        bordered
        style={styles.selectorButton}
        accessibilityLabel={`Choose habit. Currently selected: ${selectedHabit.title}`}
        accessibilityHint="Opens the habit list"
      >
        <View style={styles.selectorRow}>
          <View style={styles.selectedHabitContainer}>
            <View style={[styles.selectedHabitIconContainer, { backgroundColor: colors.primarySubtle }]}>
              <AppText style={styles.selectedHabitIcon}>{selectedHabit.icon}</AppText>
            </View>

            <View style={styles.selectedHabitTextBlock}>
              <AppText variant="body">{selectedHabit.title}</AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                Switch habit to update all cards below.
              </AppText>
            </View>
          </View>

          <ChevronDown size={20} color={colors.icon} />
        </View>
      </PressableCard>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  selectorButton: {
    minHeight: 72,
  },
  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  selectedHabitContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  selectedHabitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedHabitIcon: {
    fontSize: 22,
    lineHeight: 24,
  },
  selectedHabitTextBlock: {
    flex: 1,
    gap: Spacing.xxs,
  },
});

export default HabitSelector;
