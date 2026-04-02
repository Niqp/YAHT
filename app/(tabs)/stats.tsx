import HabitDetailView from "@/components/stats/HabitDetailView";
import HabitSelector from "@/components/stats/HabitSelector";
import HabitTypeIndicator from "@/components/stats/HabitTypeIndicator";
import OverallStats from "@/components/stats/OverallStats";
import { AppBottomSheet, AppText, PressableCard, ScaleButton } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useStats } from "@/hooks/useStats";
import type { Habit } from "@/types/habit";
import { useTheme } from "@/hooks/useTheme";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { BarChart2, Check } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

export default function StatsScreen() {
  const { colors } = useTheme();
  const [isHabitSheetOpen, setIsHabitSheetOpen] = useState(false);
  const habitSheetRef = useRef<BottomSheet>(null);
  const habitSheetSnapPoints = useMemo(() => ["68%"], []);
  const { habitArray, isHydrated, selectedHabit, overallStats, chartData, habitStats, handleSelectHabit } = useStats();

  useEffect(() => {
    if (isHabitSheetOpen) {
      habitSheetRef.current?.snapToIndex(0);
    } else {
      habitSheetRef.current?.close();
    }
  }, [isHabitSheetOpen]);

  const handleOpenHabitSheet = () => {
    setIsHabitSheetOpen(true);
  };

  const handleHabitSheetSelect = (habit: Habit) => {
    handleSelectHabit(habit);
    setIsHabitSheetOpen(false);
  };

  if (!isHydrated) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (habitArray.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <BarChart2 size={24} color={colors.icon} strokeWidth={2} />
          </View>
          <AppText variant="heading" style={styles.emptyTitle}>
            No habits to analyze
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.emptyText}>
            Create a habit to start tracking daily completion, streaks, and consistency over time.
          </AppText>
          <View style={styles.emptyAction}>
            <ScaleButton
              label="Create a habit"
              onPress={() => router.push("/add")}
              accessibilityHint="Open the add habit screen"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        stickyHeaderIndices={selectedHabit ? [3] : undefined}
      >
        <View style={styles.header}>
          <AppText variant="heading">Stats</AppText>
          <AppText variant="body" color={colors.textSecondary}>
            {`${overallStats.activeHabits} active ${overallStats.activeHabits === 1 ? "habit" : "habits"}`}
          </AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
            Overview
          </AppText>
          <OverallStats stats={overallStats} />
        </View>

        {selectedHabit ? (
          <View style={styles.habitIntro}>
            <AppText variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
              Habit
            </AppText>
          </View>
        ) : null}

        {selectedHabit ? (
          <View style={[styles.stickySelector, { backgroundColor: colors.background }]}>
            <HabitSelector selectedHabit={selectedHabit} onPress={handleOpenHabitSheet} />
          </View>
        ) : null}

        {selectedHabit ? (
          <View style={styles.detailSection}>
            <HabitDetailView habit={selectedHabit} chartData={chartData} habitStats={habitStats} />
          </View>
        ) : null}
      </ScrollView>

      <AppBottomSheet
        ref={habitSheetRef}
        snapPoints={habitSheetSnapPoints}
        onChange={(index) => {
          if (index === -1) {
            setIsHabitSheetOpen(false);
          }
        }}
      >
        <BottomSheetFlatList
          data={habitArray}
          keyExtractor={(habit: Habit) => habit.id}
          contentContainerStyle={styles.sheetListContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <AppText variant="title">Select a habit</AppText>
            </View>
          }
          renderItem={({ item: habit }: { item: Habit }) => {
            const isSelected = selectedHabit?.id === habit.id;

            return (
              <PressableCard
                onPress={() => handleHabitSheetSelect(habit)}
                backgroundColor={isSelected ? colors.surface : colors.cardBackground}
                bordered
                style={isSelected ? [styles.sheetItem, { borderColor: colors.primary }] : styles.sheetItem}
                accessibilityLabel={`Select ${habit.title}`}
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.sheetItemRow}>
                  <View style={styles.sheetItemLeading}>
                    <View style={[styles.sheetItemIconContainer, { backgroundColor: colors.primarySubtle }]}>
                      <AppText style={styles.sheetItemIcon}>{habit.icon}</AppText>
                    </View>

                    <View style={styles.sheetItemTextBlock}>
                      <AppText variant="bodyMedium" numberOfLines={1}>
                        {habit.title}
                      </AppText>
                      <HabitTypeIndicator completionType={habit.completion.type} />
                    </View>
                  </View>

                  {isSelected ? (
                    <View
                      style={[
                        styles.selectedMarker,
                        { backgroundColor: colors.primarySubtle, borderColor: colors.primary },
                      ]}
                    >
                      <Check size={14} color={colors.primary} strokeWidth={2} />
                    </View>
                  ) : null}
                </View>
              </PressableCard>
            );
          }}
        />
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    gap: Spacing.xl,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.base,
  },
  habitIntro: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    paddingHorizontal: Spacing.xs,
  },
  stickySelector: {
    paddingBottom: Spacing.sm,
  },
  detailSection: {
    gap: Spacing.base,
  },
  sheetHeader: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.base,
  },
  sheetListContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  sheetItem: {
    minHeight: 60,
  },
  sheetItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  sheetItemLeading: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  sheetItemIconContainer: {
    width: Spacing.xxl,
    height: Spacing.xxl,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetItemIcon: {
    fontSize: 20,
    lineHeight: 22,
  },
  sheetItemTextBlock: {
    flex: 1,
    gap: Spacing.xxs,
  },
  selectedMarker: {
    width: Spacing.lg,
    height: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  emptyAction: {
    width: "100%",
    marginTop: Spacing.sm,
  },
});
