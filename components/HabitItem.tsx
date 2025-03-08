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
  const { 
    completeHabit, 
    selectedDate, 
    registerActiveTimer,
    unregisterActiveTimer,
    activeTimers
  } = useHabitStore();
  
  const [timerActive, setTimerActive] = useState(false);
  const [baseTime, setBaseTime] = useState(0); // Time accumulated from previous sessions
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const displayTimeRef = useRef<NodeJS.Timeout | null>(null);

  // Check completion status with safety checks
  const isCompleted = habit?.completionHistory?.[selectedDate]?.completed || false;
  const completionValue = habit?.completionHistory?.[selectedDate]?.value || 0;
  const completionGoal = habit?.completionGoal || 0;

  // Get active timer for this habit
  const activeTimer = habit ? activeTimers[habit.id] : undefined;

  // Progress calculation for visual indicator
  const progress = useMemo(() => {
    if (!habit) return 0;
    
    if (habit.completionType === 'simple') {
      return isCompleted ? 1 : 0;
    } else {
      const value = completionValue || 0;
      const goal = completionGoal || 1; // Prevent division by zero
      return Math.min(1, value / goal);
    }
  }, [habit, isCompleted, completionValue, completionGoal]);

  // Set initial timer value from history if exists or from active timer
  useEffect(() => {
    if (habit?.completionType === 'timed') {
      if (activeTimer && activeTimer.date === selectedDate) {
        // Timer is active (either from the beginning or restored after background)
        console.log(`HabitItem: Initializing active timer for habit ${habit.id} with baseTime: ${activeTimer.baseTime}s`);
        setTimerActive(true);
        setBaseTime(activeTimer.baseTime);
        setStartTimestamp(activeTimer.startTimestamp);
      } else if (habit?.completionHistory?.[selectedDate]?.value !== undefined) {
        // Timer is not active, but we have a stored value
        setBaseTime(habit.completionHistory[selectedDate].value as number);
        setTimerActive(false);
        setStartTimestamp(null);
      } else {
        // Reset timer
        setBaseTime(0);
        setTimerActive(false);
        setStartTimestamp(null);
      }
    }
  }, [selectedDate, habit?.id, habit?.completionHistory, habit?.completionType, activeTimer]);

  // Timer effect: setup display refresh when timer is active
  useEffect(() => {
    if (timerActive && startTimestamp) {
      // Setup regular UI refresh (every 1 second)
      displayTimeRef.current = setInterval(() => {
        // This just forces a re-render to update the displayed time
        // The actual time calculation happens in getDisplayTime()
        forceUpdate(n => n + 1);
      }, 1000);
      
      return () => {
        if (displayTimeRef.current) {
          clearInterval(displayTimeRef.current);
          displayTimeRef.current = null;
        }
      };
    }
  }, [timerActive, startTimestamp]);
  
  // Force re-render for timer display updates
  const [, forceUpdate] = useState(0);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (displayTimeRef.current) {
        clearInterval(displayTimeRef.current);
      }
    };
  }, []);

  // Handle main press action with animation
  const handlePress = () => {
    // Fail early if habit is undefined
    if (!habit) return;

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
        setBaseTime(0);
        setTimerActive(false);
        setStartTimestamp(null);
        completeHabit(habit.id, 0, false);
        unregisterActiveTimer(habit.id);
        
        if (displayTimeRef.current) {
          clearInterval(displayTimeRef.current);
          displayTimeRef.current = null;
        }
      } else if (!timerActive) {
        // Start timer
        const now = Date.now();
        setStartTimestamp(now);
        setTimerActive(true);
        console.log(`Starting timer for habit ${habit.id} with baseTime: ${baseTime}s`);
        registerActiveTimer(habit.id, now, baseTime, selectedDate);
      } else {
        // Pause timer - calculate and store the accumulated time
        const totalElapsedTime = getTotalElapsedTime();
        setBaseTime(totalElapsedTime);
        setTimerActive(false);
        setStartTimestamp(null);
        unregisterActiveTimer(habit.id);
        
        if (displayTimeRef.current) {
          clearInterval(displayTimeRef.current);
          displayTimeRef.current = null;
        }
        
        // Update completion status based on elapsed time
        const isGoalAchieved = totalElapsedTime >= completionGoal;
        completeHabit(habit.id, totalElapsedTime, isGoalAchieved);
      }
    }
  };

  // Handle increment for repetition habits
  const handleIncrement = () => {
    // Fail early if habit is undefined
    if (!habit) return;
    
    const newValue = (completionValue || 0) + 1;
    const shouldComplete = newValue >= completionGoal;
    completeHabit(habit.id, newValue, shouldComplete);
  };

  // Handle decrement for repetition habits
  const handleDecrement = () => {
    // Fail early if habit is undefined
    if (!habit) return;
    
    if (completionValue <= 0) return;
    
    const newValue = Math.max(0, (completionValue || 0) - 1);
    const shouldComplete = newValue >= completionGoal;
    completeHabit(habit.id, newValue, shouldComplete);
  };

  // Fail early if habit is undefined
  if (!habit) return null;

  // Calculate the width of the progress bar
  const progressBarWidth = `${Math.round(progress * 100)}%`;

  // Get total elapsed time (base time + current session time)
  const getTotalElapsedTime = (): number => {
    // Base time plus any active session time
    if (timerActive && startTimestamp) {
      const now = Date.now();
      const currentSessionSeconds = Math.floor((now - startTimestamp) / 1000);
      return baseTime + currentSessionSeconds;
    }
    return baseTime;
  };
  
  // Format the time for display
  const getDisplayTime = () => {
    return formatTime(getTotalElapsedTime());
  };

  // Generate subtitle text based on habit type
  const getSubtitleText = () => {
    switch (habit.completionType) {
      case 'simple':
        return isCompleted ? 'Completed' : '';
      case 'repetitions':
        return `${completionValue} / ${completionGoal}`;
      case 'timed':
        return `${getDisplayTime()} / ${formatTime(completionGoal)}`;
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