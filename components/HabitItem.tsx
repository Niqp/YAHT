import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle, Circle, MoreVertical, Timer } from 'lucide-react-native';
import { useHabitStore } from '../store/habitStore';
import { Habit } from '../types/habit';
import { router } from 'expo-router';
import { formatTime } from '../utils/date';

interface HabitItemProps {
  habit: Habit;
  onLongPress: (habit: Habit) => void;
}

export default function HabitItem({ habit, onLongPress }: HabitItemProps) {
  const { completeHabit, selectedDate } = useHabitStore();
  const [timerActive, setTimerActive] = useState(false);
  const [timerValue, setTimerValue] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isCompleted = habit.completionHistory[selectedDate]?.completed || false;
  const completionValue = habit.completionHistory[selectedDate]?.value || 0;

  // Set initial timer value from history if exists
  useEffect(() => {
    if (habit.completionType === 'timed' && habit.completionHistory[selectedDate]?.value) {
      setTimerValue(habit.completionHistory[selectedDate].value as number);
    } else {
      setTimerValue(0);
    }
  }, [selectedDate, habit.id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handlePress = () => {
    // Animate the press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (habit.completionType === 'timed') {
      if (!timerActive) {
        // Start timer
        const interval = setInterval(() => {
          setTimerValue(prev => prev + 1);
        }, 1000);
        intervalRef.current = interval;
        setTimerActive(true);
      } else {
        // Pause timer
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setTimerActive(false);
        
        // Update completion if the timer value reaches or exceeds the goal
        if (timerValue >= (habit.completionGoal || 0)) {
          completeHabit(habit.id, timerValue);
        }
      }
    } else if (habit.completionType === 'repetitions') {
      // For repetition habits, increment the count
      const newValue = (completionValue || 0) + 1;
      completeHabit(habit.id, newValue);
    } else {
      // For simple habits, toggle completion
      completeHabit(habit.id);
    }
  };

  const renderCompletionIndicator = () => {
    if (habit.completionType === 'simple') {
      return isCompleted ? (
        <CheckCircle size={24} color="#4CAF50" />
      ) : (
        <Circle size={24} color="#757575" />
      );
    } else if (habit.completionType === 'repetitions') {
      return (
        <View style={styles.repetitionContainer}>
          <Text style={styles.repetitionText}>
            {completionValue}/{habit.completionGoal}
          </Text>
          {completionValue >= (habit.completionGoal || 0) && completionValue > 0 ? (
            <CheckCircle size={24} color="#4CAF50" />
          ) : (
            <Circle size={24} color="#757575" />
          )}
        </View>
      );
    } else if (habit.completionType === 'timed') {
      return (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            {formatTime(timerValue)}/{formatTime(habit.completionGoal || 0)}
          </Text>
          <Timer size={24} color={timerActive ? "#FFA000" : "#757575"} />
        </View>
      );
    }
    return null;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isCompleted && styles.completedContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <TouchableOpacity
        style={styles.contentTouchable}
        onPress={handlePress}
        onLongPress={() => onLongPress(habit)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{habit.icon}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{habit.title}</Text>
        </View>
        <View style={styles.statusContainer}>
          {renderCompletionIndicator()}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => {
          router.push({
            pathname: '/add',
            params: { habitId: habit.id }
          });
        }}
      >
        <MoreVertical size={20} color="#757575" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  contentTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  completedContainer: {
    backgroundColor: '#F5F9F7',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repetitionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repetitionText: {
    fontSize: 14,
    marginRight: 5,
    color: '#757575',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    marginRight: 5,
    color: '#757575',
  },
  menuButton: {
    padding: 15,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});