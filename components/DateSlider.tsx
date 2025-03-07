import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useHabitStore } from '../store/habitStore';
import { formatDate, getDayName, addDays, getMonthName } from '../utils/date';

interface DateItemProps {
  date: string;
  isSelected: boolean;
  isToday: boolean;
  onPress: (date: string) => void;
}

const DateItem = ({ date, isSelected, isToday, onPress }: DateItemProps) => {
  const dateObj = new Date(date);
  const dayName = getDayName(dateObj);
  const dayNumber = dateObj.getDate();

  return (
    <TouchableOpacity
      style={[
        styles.dateItem, 
        isSelected && styles.selectedDateItem,
        isToday && styles.todayDateItem
      ]}
      onPress={() => onPress(date)}
    >
      <Text 
        style={[
          styles.dayName, 
          isSelected && styles.selectedText,
          isToday && !isSelected && styles.todayText
        ]}
      >
        {dayName}
      </Text>
      <Text 
        style={[
          styles.dayNumber, 
          isSelected && styles.selectedText,
          isToday && !isSelected && styles.todayText
        ]}
      >
        {dayNumber}
      </Text>
    </TouchableOpacity>
  );
};

export default function DateSlider() {
  const { selectedDate, setSelectedDate } = useHabitStore();
  const flatListRef = useRef<FlatList>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState('');
  const [today] = useState(formatDate(new Date()));

  // Generate dates (today + 6 days before + 15 days ahead)
  useEffect(() => {
    const today = new Date();
    const datesArray: string[] = [];

    // Add 6 days before today
    for (let i = 6; i > 0; i--) {
      const date = addDays(today, -i);
      datesArray.push(formatDate(date));
    }

    // Add today
    datesArray.push(formatDate(today));

    // Add 15 days after today
    for (let i = 1; i <= 15; i++) {
      const date = addDays(today, i);
      datesArray.push(formatDate(date));
    }

    setDates(datesArray);
    setCurrentMonth(getMonthName(new Date(selectedDate)));
  }, []);

  // Update current month when selected date changes
  useEffect(() => {
    setCurrentMonth(getMonthName(new Date(selectedDate)));
  }, [selectedDate]);

  // Scroll to today initially
  useEffect(() => {
    if (flatListRef.current && dates.length > 0) {
      const todayIndex = dates.findIndex(date => date === formatDate(new Date()));
      if (todayIndex !== -1) {
        flatListRef.current.scrollToIndex({
          index: todayIndex,
          animated: false,
          viewPosition: 0.5,
        });
      }
    }
  }, [dates]);

  return (
    <View style={styles.container}>
      <Text style={styles.monthText}>{currentMonth}</Text>
      <FlatList
        ref={flatListRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={dates}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <DateItem
            date={item}
            isSelected={item === selectedDate}
            isToday={item === today}
            onPress={setSelectedDate}
          />
        )}
        contentContainerStyle={styles.flatListContent}
        onScrollToIndexFailed={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: -1, // Remove gap between header and slider
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A6572',
    marginLeft: 15,
    marginBottom: 10,
  },
  flatListContent: {
    paddingHorizontal: 10,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    width: 45,
    height: 70,
    borderRadius: 22.5,
    backgroundColor: '#F5F5F5',
  },
  selectedDateItem: {
    backgroundColor: '#4A6572',
  },
  todayDateItem: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  dayName: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  todayText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});