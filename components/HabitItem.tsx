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

  // Check completion status
  const isCompleted = habit.completionHistory[selectedDate]?.completed || false;
  const completionValue = habit.completionHistory[selectedDate]?.value || 0;
  const completionGoal = habit.completionGoal || 0;

  // Progress calculation for visual indicator
  const progress = useMemo(() => {
    if (habit.completionType === 'simple') {
      return isCompleted ? 1 : 0;
    } else {
      const value = completionValue || 0;
      const goal = completionGoal || 1; // Prevent division by zero
      return Math.min(1, value / goal);
    }
  }, [habit.completionType, isCompleted, completionValue, completionGoal]);

  // Set initial timer value from history if exists
  useEffect(() => {
    if (habit.completionType === 'timed' && habit.completionHistory[selectedDate]?.value) {
      setTimerValue(habit.completionHistory[selectedDate].value as number);
    } else {
      setTimerValue(0);
    }
  }, [selectedDate, habit.id, habit.completionHistory, habit.completionType]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle main press action with animation
  const handlePress = () => {
    // Animate the press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
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
        if (timerValue >= completionGoal) {
          completeHabit(habit.id, timerValue, true);
        } else {
          completeHabit(habit.id, timerValue, false);
        }
      }
    }
  };

  // Handle increment for repetition habits
  const handleIncrement = () => {
    const newValue = (completionValue || 0) + 1;
    const shouldComplete = newValue >= completionGoal;
    completeHabit(habit.id, newValue, shouldComplete);
  };

  // Handle decrement for repetition habits
  const handleDecrement = () => {
    if (completionValue <= 0) return;
    
    const newValue = Math.max(0, (completionValue || 0) - 1);
    const shouldComplete = newValue >= completionGoal;
    completeHabit(habit.id, newValue, shouldComplete);
  };

  // Calculate the width of the progress bar
  const progressBarWidth = `${Math.round(progress * 100)}%`;

  // Generate subtitle text based on habit type
  const getSubtitleText = () => {
    switch (habit.completionType) {
      case 'simple':
        return isCompleted ? 'Completed' : '';
      case 'repetitions':
        return `${completionValue} / ${completionGoal}`;
      case 'timed':
        return `${formatTime(timerValue)} / ${formatTime(completionGoal)}`;
      default:
        return '';
    }
  };

  // Generate subtitle icon based on habit type
  const getSubtitleIcon = () => {
    switch (habit.completionType) {
      case 'simple':
        return isCompleted 
          ? <CheckCircle size={16} color={colors.success} /> 
          : <Circle size={16} color={colors.textSecondary} />;
      case 'repetitions':
        return <RotateCcw size={16} color={isCompleted ? colors.success : colors.textSecondary} />;
      case 'timed':
        return <Timer size={16} color={timerActive ? colors.accent : (isCompleted ? colors.success : colors.textSecondary)} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.habitBackground,
          borderColor: colors.border,
          transform: [{ scale: scaleAnim }] 
        },
        isCompleted && { backgroundColor: colors.habitCompleted }
      ]}
    >
      {/* Progress indicator */}
      <View 
        style={[
          styles.progressBar, 
          { 
            width: progressBarWidth,
            backgroundColor: isCompleted ? colors.success : colors.primary,
            opacity: 0.15
          }
        ]} 
      />

      <TouchableOpacity
        style={styles.mainContent}
        onPress={habit.completionType !== 'repetitions' ? handlePress : undefined}
        onLongPress={() => onLongPress(habit)}
        activeOpacity={0.7}
        disabled={habit.completionType === 'repetitions'}
      >
        {/* Left section - Icon */}
        <View style={[styles.iconContainer, { backgroundColor: colors.input }]}>
          <Text style={styles.iconText}>{habit.icon}</Text>
        </View>
        
        {/* Middle section - Title and Subtitle */}
        <View style={styles.infoContainer}>
          <Text 
            style={[styles.title, { color: colors.text }]} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {habit.title}
          </Text>
          {habit.completionType !== 'simple' && (
            <View style={styles.subtitleContainer}>
              {getSubtitleIcon()}
              <Text 
                style={[styles.subtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {getSubtitleText()}
              </Text>
            </View>
          )}
        </View>
        
        {/* Right section - Action buttons or completion indicator */}
        <View style={styles.actionButtons}>
          {habit.completionType === 'repetitions' ? (
            <>
              {/* For repetition habits, show - and count left of + */}
              <View style={styles.repControlsContainer}>
                <TouchableOpacity 
                  style={[styles.repButton, { backgroundColor: colors.input }]} 
                  onPress={handleDecrement}
                >
                  <Minus size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <Text style={[styles.repCount, { color: colors.text }]}>
                  {completionValue}
                </Text>
                
                <TouchableOpacity 
                  style={[styles.repButton, { backgroundColor: colors.input }]} 
                  onPress={handleIncrement}
                >
                  <Plus size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.statusContainer}>
              {isCompleted ? (
                <CheckCircle size={22} color={colors.success} />
              ) : (
                habit.completionType === 'timed' && timerActive ? (
                  <Timer size={22} color={colors.accent} />
                ) : (
                  <Circle size={22} color={colors.textSecondary} />
                )
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
      
      {/* More options button */}
      <TouchableOpacity 
        style={styles.moreButton}
        onPress={() => onLongPress(habit)}
      >
        <MoreVertical size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    height: 70,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    height: '100%',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 0,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconText: {
    fontSize: 22,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginLeft: 4,
  },
  actionButtons: {
    width: 88,
    height: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  statusContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 88,
  },
  repButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  repCount: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 6,
    width: 16,
    textAlign: 'center',
  },
  moreButton: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
});