import HabitSummaryCard from "@/components/habit/HabitSummaryCard";
import HabitDetailView from "@/components/stats/HabitDetailView";
import HabitSelector from "@/components/stats/HabitSelector";
import OverallStats from "@/components/stats/OverallStats";
import { AppBottomSheet, AppText, ScaleButton } from "@/components/ui";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useStats } from "@/hooks/useStats";
import type { Habit } from "@/types/habit";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import type BottomSheet from "@gorhom/bottom-sheet";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { BarChart2, CheckCircle } from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function StatsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
      <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
        <View
          style={[
            styles.safeAreaContent,
            styles.loadingContainer,
            { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
          ]}
        >
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  if (habitArray.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
        <View
          style={[
            styles.safeAreaContent,
            { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
          ]}
        >
          <View style={styles.emptyContainer}>
            <View
              style={[styles.emptyIconContainer, { backgroundColor: colors.bgInset, borderColor: colors.borderDefault }]}
            >
              <BarChart2 size={24} color={colors.iconPrimary} strokeWidth={2} />
            </View>
            <AppText variant="heading" style={styles.emptyTitle}>
              {t("stats.emptyTitle")}
            </AppText>
            <AppText variant="body" color={colors.textSecondary} style={styles.emptyText}>
              {t("stats.emptyBody")}
            </AppText>
            <View style={styles.emptyAction}>
              <ScaleButton
                label={t("stats.createHabit")}
                onPress={() => router.push("/add")}
                accessibilityHint={t("stats.createHabitHint")}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <View
        style={[
          styles.safeAreaContent,
          { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          stickyHeaderIndices={selectedHabit ? [3] : undefined}
        >
          <View style={styles.header}>
            <AppText variant="heading">{t("stats.screenTitle")}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {t("stats.activeHabits", { count: overallStats.activeHabits })}
            </AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
              {t("stats.overview")}
            </AppText>
            <OverallStats stats={overallStats} />
          </View>

          {selectedHabit ? (
            <View style={styles.habitIntro}>
              <AppText variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
                {t("stats.habit")}
              </AppText>
            </View>
          ) : null}

          {selectedHabit ? (
            <View style={[styles.stickySelector, { backgroundColor: colors.bgApp }]}>
              <HabitSelector selectedHabit={selectedHabit} onPress={handleOpenHabitSheet} />
            </View>
          ) : null}

          {selectedHabit ? (
            <View style={styles.detailSection}>
              <HabitDetailView habit={selectedHabit} chartData={chartData} habitStats={habitStats} />
            </View>
          ) : null}
        </ScrollView>
      </View>

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
            <View style={[styles.sheetHeader, { borderBottomColor: colors.borderDefault }]}>
              <AppText variant="title">{t("stats.selectHabit")}</AppText>
            </View>
          }
          renderItem={({ item: habit }: { item: Habit }) => {
            const isSelected = selectedHabit?.id === habit.id;

            return (
              <HabitSummaryCard
                habit={habit}
                onPress={() => handleHabitSheetSelect(habit)}
                selected={isSelected}
                accessibilityLabel={t("stats.selectHabitAccessibility", { title: habit.title })}
                accessibilityState={{ selected: isSelected }}
                trailing={
                  <View style={styles.sheetSelectionMarker}>
                    {isSelected ? <CheckCircle size={20} color={colors.accent} strokeWidth={2} /> : null}
                  </View>
                }
              />
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
  safeAreaContent: {
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
  sheetSelectionMarker: {
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
