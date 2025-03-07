import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { CheckCircle, Circle, MoreVertical, Timer, RotateCcw, Plus, Minus } from 'lucide-react-native';
import { useHabitStore } from '../store/habitStore';
import { Habit } from '../types/habit';
import { formatTime } from '../utils/date';
import { useTheme } from '../hooks/useTheme';

interface HabitItemProps {
  habit: Habit;
  onLongPress: (habit: Habit) => void;
}

export default function HabitItem({ habit, onLongPress }: HabitItemProps) {
  const { colors } = useTheme();
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

  // Modified to handle toggling completion status
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

    if (habit.completionType === 'simple') {
      // For simple habits, toggle completion
      completeHabit(habit.id, undefined, !isCompleted);
    } else if (habit.completionType === 'timed') {
      if (isCompleted) {
        // Reset timer when clicking on a completed timed habit
        setTimerValue(0);
        setTimerActive(false);
        completeHabit(habit.id, 0, false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (!timerActive) {
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
    }
    // Repetition habits now use separate + and - buttons
  };

  // Handle increment for repetition habits
  const handleIncrement = () => {
    const newValue = (completionValue || 0) + 1;
    const shouldComplete = newValue >= (habit.completionGoal || 0);
    completeHabit(habit.id, newValue, shouldComplete);
  };

  // Handle decrement for repetition habits
  const handleDecrement = () => {
    if (completionValue <= 0) return;
    
    const newValue = Math.max(0, (completionValue || 0) - 1);
    const shouldComplete = newValue >= (habit.completionGoal || 0);
    completeHabit(habit.id, newValue, shouldComplete);
  };

  // Apply theme colors to styles
  const containerStyle = useMemo(() => [
    styles.container,
    { 
      backgroundColor: colors.habitBackground,
      shadowColor: colors.shadow,
      borderColor: colors.border,
    },
    isCompleted && { 
      backgroundColor: colors.habitCompleted 
    },
    { transform: [{ scale: scaleAnim }] }
  ], [colors, isCompleted, scaleAnim]);

  const iconContainerStyle = useMemo(() => [
    styles.iconContainer,
    { backgroundColor: colors.input }
  ], [colors]);

  const titleStyle = useMemo(() => [
    styles.title,
    { color: colors.text }
  ], [colors]);

  // Render the completion indicator
  const renderCompletionIndicator = () => {
    // Always show the circle indicator
    const circleIndicator = isCompleted ? (
      <CheckCircle size={24} color={colors.success} />
    ) : (
      <Circle size={24} color={colors.textSecondary} />
    );

    // Additional info based on habit type
    let additionalInfo = null;
    
    if (habit.completionType === 'repetitions') {
      const isReachedGoal = completionValue >= (habit.completionGoal || 0) && completionValue > 0;
      
      additionalInfo = (
        <View style={styles.repetitionContainer}>
          <TouchableOpacity 
            style={[styles.repButton, { backgroundColor: colors.input }]} 
            onPress={handleDecrement}
          >
            <Minus size={16} color={colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.repCountContainer}>
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {completionValue}/{habit.completionGoal}
            </Text>
            <RotateCcw size={14} color={isReachedGoal ? colors.success : colors.textSecondary} style={styles.repIcon} />
          </View>
          
          <TouchableOpacity 
            style={[styles.repButton, { backgroundColor: colors.input }]} 
            onPress={handleIncrement}
          >
            <Plus size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      );
    } else if (habit.completionType === 'timed') {
      const isReachedGoal = timerValue >= (habit.completionGoal || 0) && timerValue > 0;
      
      additionalInfo = (
        <View style={styles.detailContainer}>
          <Timer size={16} color={timerActive ? colors.accent : isReachedGoal ? colors.success : colors.textSecondary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {formatTime(timerValue)}/{formatTime(habit.completionGoal || 0)}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statusContainer}>
        {additionalInfo && (
          <View style={styles.detailWrapper}>
            {additionalInfo}
          </View>
        )}
        {habit.completionType !== 'repetitions' && circleIndicator}
      </View>
    );
  };

  return (
    <Animated.View style={containerStyle}>
      <TouchableOpacity
        style={styles.contentTouchable}
        onPress={handlePress}
        onLongPress={() => onLongPress(habit)}
        activeOpacity={0.7}
        disabled={habit.completionType === 'repetitions'} // Disable press for repetition habits
      >
        <View style={iconContainerStyle}>
          <Text style={styles.iconText}>{habit.icon}</Text>
        </View>
        <View style={styles.contentContainer}>
          <Text style={titleStyle}>{habit.title}</Text>
        </View>
        {renderCompletionIndicator()}
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={() => onLongPress(habit)}
      >
        <MoreVertical size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Larger habit items with adjusted styling
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 0, 
    marginTop: 0,
    marginBottom: 0,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    // Increased height for larger items
    height: 68, 
    borderWidth: 0,
  },
  contentTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: '100%',
  },
  iconContainer: {
    width: 42, // Larger icon container
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 20, // Larger icon
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16, // Larger title
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailWrapper: {
    marginRight: 10,
  },
  detailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repetitionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 110, // Fixed width to ensure alignment
  },
  repCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  repIcon: {
    marginLeft: 4,
  },
  repButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 14, // Larger text
    marginLeft: 4,
  },
  menuButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
});