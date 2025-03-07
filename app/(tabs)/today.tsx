import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateSlider from '../../components/DateSlider';
import HabitItem from '../../components/HabitItem';
import HabitBottomSheet from '../../components/HabitBottomSheet';
import { useHabitStore } from '../../store/habitStore';
import { shouldCompleteHabitOnDate } from '../../utils/date';
import { Habit } from '../../types/habit';
import { Button } from 'react-native-elements';
import { Plus } from 'lucide-react-native';

export default function MainScreen() {
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
    <SafeAreaView style={styles.container}>
      <DateSlider />
      
      {filteredHabits.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No habits for this day</Text>
          <Button
            title="Add a habit"
            buttonStyle={styles.addButton}
            titleStyle={styles.addButtonTitle}
            icon={<Plus size={20} color="#FFFFFF" style={styles.addButtonIcon} />}
            onPress={navigateToAddHabit}
          />
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
      
      {bottomSheetVisible && (
        <HabitBottomSheet
          habit={selectedHabit}
          onClose={closeBottomSheet}
        />
      )}
    </SafeAreaView>
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
  addButton: {
    backgroundColor: '#4A6572',
    borderRadius: 20,
    paddingHorizontal: 20,
  },
  addButtonTitle: {
    fontSize: 16,
  },
  addButtonIcon: {
    marginRight: 8,
  },
});