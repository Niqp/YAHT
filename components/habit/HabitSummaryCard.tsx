import { AppText, PressableCard } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import type { Habit } from "@/types/habit";
import React from "react";
import { StyleSheet, View, type PressableProps, type ViewStyle } from "react-native";

import HabitTypeIndicator from "./HabitTypeIndicator";

interface HabitSummaryCardProps extends Omit<PressableProps, "children" | "style"> {
  habit: Habit;
  trailing?: React.ReactNode;
  selected?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export default function HabitSummaryCard({
  habit,
  trailing,
  selected = false,
  style,
  ...pressableProps
}: HabitSummaryCardProps) {
  const { colors } = useTheme();

  const cardStyles = [
    styles.card,
    selected ? { borderColor: colors.accent } : null,
    ...(Array.isArray(style) ? style : style ? [style] : []),
  ].filter(Boolean) as ViewStyle[];

  return (
    <PressableCard {...pressableProps} backgroundColor={colors.bgSurface} bordered style={cardStyles}>
      <View style={styles.row}>
        <View style={styles.leading}>
          <View style={[styles.iconContainer, { backgroundColor: colors.bgInset, borderColor: colors.borderSubtle }]}>
            <AppText style={styles.icon}>{habit.icon}</AppText>
          </View>

          <View style={styles.textBlock}>
            <AppText variant="body" style={styles.title} numberOfLines={1}>
              {habit.title}
            </AppText>
            <HabitTypeIndicator completionType={habit.completion.type} />
          </View>
        </View>

        <View style={styles.trailing}>{trailing}</View>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 70,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 68,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    gap: Spacing.md,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 22,
    lineHeight: 24,
  },
  textBlock: {
    flex: 1,
    gap: Spacing.xxs,
  },
  title: {
    fontWeight: "600",
  },
  trailing: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
