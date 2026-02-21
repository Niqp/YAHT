import React, { useCallback, useMemo } from "react";
import { SectionList, View } from "react-native";
import { BookOpen } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import type { Habit } from "@/types/habit";
import { shouldShowHabitOnDate } from "@/utils/date";
import { AppText } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import HabitItem from "../habit/HabitItem";
import styles from "./HabitList.styles";
import TaskGroupSeparator from "./TaskGroupSeparator/TaskGroupSeparator";

interface HabitListProps {
  handleHabitAction: (habit: Habit) => void;
}

export default function HabitList({ handleHabitAction }: HabitListProps) {
  const { colors } = useTheme();
  const habitsMap = useHabitStore((state) => state.habits);
  const selectedDate = useHabitStore((state) => state.selectedDate);

  const habits = useMemo(() => Object.values(habitsMap), [habitsMap]);

  const filteredHabits = useMemo(() => {
    if (!habits || !selectedDate) return [];
    try {
      return habits.filter((habit: Habit) => shouldShowHabitOnDate(habit, selectedDate));
    } catch (error) {
      console.error("Error filtering habits:", error);
      return [];
    }
  }, [habits, selectedDate]);

  const groupedHabits = useMemo(() => {
    if (!filteredHabits || filteredHabits.length === 0) return [];
    try {
      const incompleteHabits = filteredHabits.filter(
        (habit: Habit) => !habit.completionHistory?.[selectedDate]?.isCompleted
      );
      const completedHabits = filteredHabits.filter(
        (habit: Habit) => habit.completionHistory?.[selectedDate]?.isCompleted
      );

      const sections = [];
      if (incompleteHabits.length > 0) {
        sections.push({ title: "To Do", data: incompleteHabits, completed: false });
      }
      if (completedHabits.length > 0) {
        sections.push({ title: "Completed", data: completedHabits, completed: true });
      }
      return sections;
    } catch (error) {
      console.error("Error grouping habits:", error);
      return [];
    }
  }, [filteredHabits, selectedDate]);

  const renderSectionHeader = useCallback(
    ({ section }: { section: { title: string; completed: boolean; data: Habit[] } }) => (
      <TaskGroupSeparator title={section.title} completed={section.completed} count={section.data.length} />
    ),
    []
  );

  const keyExtractor = useCallback((item: Habit) => item.id, []);

  const renderHabitItem = useCallback(
    ({ item }: { item: Habit }) => {
      if (!item) return null;
      return <HabitItem habitId={item.id} onLongPress={handleHabitAction} />;
    },
    [handleHabitAction]
  );

  const isEmpty = groupedHabits.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface }]}>
          <BookOpen size={32} color={colors.iconMuted} strokeWidth={1.5} />
        </View>
        <View style={styles.emptyTextBlock}>
          <AppText variant="body" color={colors.textSecondary} style={{ textAlign: "center" }}>
            No habits for this day
          </AppText>
          <AppText variant="caption" color={colors.textTertiary} style={{ textAlign: "center" }}>
            Tap the + button to add your first habit
          </AppText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.listWrapper}>
      <SectionList
        sections={groupedHabits}
        keyExtractor={keyExtractor}
        renderItem={renderHabitItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        contentContainerStyle={styles.habitList}
        SectionSeparatorComponent={() => <View style={{ height: Spacing.lg }} />}
        ListHeaderComponent={() => <View style={{ height: Spacing.sm }} />}
        ListFooterComponent={() => <View style={{ height: Spacing.xxxl }} />}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
}
