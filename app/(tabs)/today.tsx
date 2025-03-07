import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import DateSlider from '../../components/DateSlider';
import HabitItem from '../../components/HabitItem';
import HabitBottomSheet from '../../components/HabitBottomSheet';
import { useHabitStore } from '../../store/habitStore';
import { shouldCompleteHabitOnDate } from '../../utils/date';
import { Habit } from '../../types/habit';
import { Plus } from 'lucide-react-native';

export default function TodayScreen() {
  const {
    habits,
    selectedDate,
    isLoading,
    loadHabitsFromStorage,
  } = useHabitStore();
  const [filteredHabits, setFilteredHabits] = useState<Habit[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);

  useEffect(() => {
    // Filter habits based on the selected date
    const filtered = habits.filter(habit =>
      shouldCompleteHabitOnDate(habit, selectedDate)
    );
    setFilteredHabits(filtered);
  }, [habits, selectedDate]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHabitsFromStorage();
    setRefreshing(false);
  };

  const handleHabitLongPress = (habit: Habit) => {
    setSelectedHabit(habit);
    setBottomSheetVisible(true);
  };

  const closeBottomSheet = () => {
    setBottomSheetVisible(false);
    setSelectedHabit(null);
  };

  const navigateToAddHabit = () => {
    router.push('/add');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6572" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DateSlider />
      
      {filteredHabits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No habits for this day</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHabits}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HabitItem
              habit={item}
              onLongPress={handleHabitLongPress}
            />
          )}
          contentContainerStyle={styles.habitList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={navigateToAddHabit}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitList: {
    paddingVertical: 10,
    paddingBottom: 80, // Add padding at the bottom for the floating button
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginBottom: 20,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A6572',
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
});