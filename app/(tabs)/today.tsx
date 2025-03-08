import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { router } from 'expo-router';
import DateSlider from '../../components/DateSlider';
import HabitItem from '../../components/HabitItem';
import HabitBottomSheet from '../../components/HabitBottomSheet';
import { useHabitStore } from '../../store/habitStore';
import { shouldCompleteHabitOnDate } from '../../utils/date';
import { Habit } from '../../types/habit';
import { Plus, CheckCircle, Circle } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

// Custom separator component for task groups
const TaskGroupSeparator = React.memo(({ title, completed, count, colors }: { 
  title: string;
  completed: boolean;
  count: number;
  colors: any;
}) => {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <View style={[styles.sectionIconContainer, { backgroundColor: completed ? colors.success : colors.divider }]}>
        {completed ? (
          <CheckCircle size={16} color="#fff" />
        ) : (
          <Circle size={16} color={colors.textSecondary} />
        )}
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {title} • {count}
      </Text>
    </View>
  );
});

export default function TodayScreen() {
  const { colors } = useTheme();
  const {
    habits,
    selectedDate,
    isLoading,
    loadHabitsFromStorage,
  } = useHabitStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  // Get all valid habits for the selected date
  // This is now memoized with dependencies only on the essential data
  const filteredHabits = useMemo(() => {
    return habits.filter(habit => 
      shouldCompleteHabitOnDate(habit, selectedDate)
    );
  }, [habits, selectedDate]);

  // Group habits by completion status - swapped To Do and Completed order
  const groupedHabits = useMemo(() => {
    // Get incomplete habits
    const incompleteHabits = filteredHabits.filter(habit => 
      !habit.completionHistory[selectedDate]?.completed
    );

    // Get completed habits
    const completedHabits = filteredHabits.filter(habit => 
      habit.completionHistory[selectedDate]?.completed
    );

    // Create sections for SectionList - To Do first, then Completed
    const sections = [];

    // Add incomplete section if there are incomplete habits
    if (incompleteHabits.length > 0) {
      sections.push({
        title: 'To Do',
        data: incompleteHabits,
        completed: false,
      });
    }

    // Add completed section if there are completed habits
    if (completedHabits.length > 0) {
      sections.push({
        title: 'Completed',
        data: completedHabits,
        completed: true,
      });
    }

    return sections;
  }, [filteredHabits, selectedDate]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabitsFromStorage();
    setRefreshing(false);
  }, [loadHabitsFromStorage]);

  const handleHabitAction = useCallback((habit: Habit) => {
    setSelectedHabit(habit);
    setBottomSheetVisible(true);
  }, []);

  const closeBottomSheet = useCallback(() => {
    setBottomSheetVisible(false);
    setSelectedHabit(null);
  }, []);

  const navigateToAddHabit = useCallback(() => {
    router.push('/add');
  }, []);

  const renderHabitItem = useCallback(({ item }: { item: Habit }) => (
    <HabitItem
      habit={item}
      onLongPress={handleHabitAction}
    />
  ), [handleHabitAction]);

  const renderSectionHeader = useCallback(({ section }) => (
    <TaskGroupSeparator
      title={section.title}
      completed={section.completed}
      count={section.data.length}
      colors={colors}
    />
  ), [colors]);

  const keyExtractor = useCallback((item: Habit) => item.id, []);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DateSlider />
      
      {filteredHabits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
            No habits for this day
          </Text>
          <TouchableOpacity 
            style={[styles.addHabitButton, { backgroundColor: colors.primary }]}
            onPress={navigateToAddHabit}
          >
            <Text style={[styles.addHabitButtonText, { color: colors.textInverse }]}>
              Add a habit
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          <SectionList
            sections={groupedHabits}
            keyExtractor={keyExtractor}
            renderItem={renderHabitItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 7 }} />}
            contentContainerStyle={styles.habitList}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                tintColor={colors.primary} 
              />
            }
            SectionSeparatorComponent={() => <View style={{ height: 20 }} />}
            ListHeaderComponent={() => <View style={{ height: 10 }} />}
            ListFooterComponent={() => <View style={{ height: 80 }} />}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        </View>
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.floatingButton, { backgroundColor: colors.primary }]}
        onPress={navigateToAddHabit}
        activeOpacity={0.8}
      >
        <Plus size={24} color={colors.textInverse} />
      </TouchableOpacity>
      
      {bottomSheetVisible && selectedHabit && (
        <HabitBottomSheet
          habit={selectedHabit}
          onClose={closeBottomSheet}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listWrapper: {
    flex: 1,
  },
  habitList: {
    padding: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
  },
  addHabitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  addHabitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 7,
  },
  sectionIconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
});