import HabitDetailView from "@/components/stats/HabitDetailView";
import HabitSelector from "@/components/stats/HabitSelector";
import HabitTypeIndicator from "@/components/stats/HabitTypeIndicator";
import OverallStats from "@/components/stats/OverallStats";
import { AppText, PressableCard, ScaleButton } from "@/components/ui";
import { getElevation } from "@/constants/Elevation";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useStats } from "@/hooks/useStats";
import { useTheme } from "@/hooks/useTheme";
import { router } from "expo-router";
import { BarChart2, Check, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

export default function StatsScreen() {
  const { colors } = useTheme();
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [selectorTop, setSelectorTop] = useState(0);
  const [selectorHeight, setSelectorHeight] = useState(0);
  const [showFloatingSelector, setShowFloatingSelector] = useState(false);
  const { habitArray, isHydrated, selectedHabit, overallStats, chartData, habitStats, handleSelectHabit } = useStats();
  const useNativeStickyHeader = Platform.OS !== "android";
  const stickyHeaderIndices = useMemo(
    () => (useNativeStickyHeader && selectedHabit ? [1] : []),
    [selectedHabit, useNativeStickyHeader]
  );

  const handleOpenHabitSheet = () => {
    setIsHabitModalOpen(true);
  };

  const handleHabitSheetSelect = (habit: (typeof habitArray)[number]) => {
    handleSelectHabit(habit);
    setIsHabitModalOpen(false);
  };

  const handleSelectorLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;

    setSelectorTop((current) => (current === y ? current : y));
    setSelectorHeight((current) => (current === height ? current : height));
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (useNativeStickyHeader || selectorHeight <= 0) {
      return;
    }

    const offsetY = event.nativeEvent.contentOffset.y;
    const enterThreshold = selectorTop;
    const exitThreshold = Math.max(selectorTop - 8, 0);

    setShowFloatingSelector((current) => {
      const nextVisible = current ? offsetY >= exitThreshold : offsetY >= enterThreshold;
      return current === nextVisible ? current : nextVisible;
    });
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
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.primarySubtle }]}>
            <BarChart2 size={28} color={colors.primary} />
          </View>
          <AppText variant="title" style={styles.emptyTitle}>
            No stats yet
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.emptyText}>
            Track a few habits and this dashboard will start showing adherence, streaks and recent momentum.
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
      {!useNativeStickyHeader && showFloatingSelector && selectedHabit ? (
        <View
          style={[
            styles.floatingSelector,
            { backgroundColor: colors.background, borderBottomColor: colors.border, pointerEvents: "box-none" },
            getElevation(3, colors.shadow),
          ]}
        >
          <HabitSelector selectedHabit={selectedHabit} onPress={handleOpenHabitSheet} />
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.topSection}>
          <View style={styles.header}>
            <AppText variant="heading">Stats</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              A calmer view of your current pace, recent consistency and habit-by-habit momentum.
            </AppText>
          </View>

          <OverallStats stats={overallStats} />
        </View>

        {selectedHabit ? (
          <View
            onLayout={handleSelectorLayout}
            style={[
              styles.stickySelector,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
                pointerEvents: !useNativeStickyHeader && showFloatingSelector ? "none" : "auto",
              },
              !useNativeStickyHeader && showFloatingSelector
                ? [styles.stickySelectorPlaceholder, { height: selectorHeight || undefined }]
                : null,
            ]}
          >
            <View style={!useNativeStickyHeader && showFloatingSelector ? styles.hiddenSelectorContent : null}>
              <HabitSelector selectedHabit={selectedHabit} onPress={handleOpenHabitSheet} />
            </View>
          </View>
        ) : null}

        <View style={styles.detailSection}>
          {selectedHabit ? (
            <HabitDetailView habit={selectedHabit} chartData={chartData} habitStats={habitStats} />
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={isHabitModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsHabitModalOpen(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalShell, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.modalHeaderCopy}>
                <AppText variant="title">Choose a habit</AppText>
                <AppText variant="body" color={colors.textSecondary}>
                  The stats below will update immediately.
                </AppText>
              </View>

              <Pressable
                onPress={() => setIsHabitModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close habit picker"
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: colors.surface },
                  pressed ? styles.closeButtonPressed : null,
                ]}
              >
                <X size={18} color={colors.icon} />
              </Pressable>
            </View>

            <FlatList
              data={habitArray}
              keyExtractor={(habit) => habit.id}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: habit }) => {
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
                          <AppText variant="body" numberOfLines={1}>
                            {habit.title}
                          </AppText>
                          <HabitTypeIndicator completionType={habit.completion.type} />
                        </View>
                      </View>

                      {isSelected ? (
                        <View style={[styles.selectedMarker, { backgroundColor: colors.primary }]}>
                          <Check size={14} color={colors.buttonPrimaryText} />
                        </View>
                      ) : null}
                    </View>
                  </PressableCard>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxxl,
  },
  topSection: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.xs,
  },
  stickySelector: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  stickySelectorPlaceholder: {
    overflow: "hidden",
  },
  hiddenSelectorContent: {
    opacity: 0,
  },
  floatingSelector: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,

    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  detailSection: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
  },
  modalOverlay: {
    flex: 1,
  },
  modalShell: {
    flex: 1,
    marginTop: Spacing.xl,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
  },
  modalHeaderCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonPressed: {
    opacity: 0.78,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.base,
  },
  sheetItem: {
    minHeight: 76,
  },
  sheetItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  sheetItemLeading: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
  },
  sheetItemIconContainer: {
    width: 44,
    height: 44,
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
    gap: Spacing.xs,
  },
  selectedMarker: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
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
    borderRadius: BorderRadius.full,
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
