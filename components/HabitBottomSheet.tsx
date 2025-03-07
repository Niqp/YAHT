import React, { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Edit, Trash2, Check, X, ChevronUp } from 'lucide-react-native';
import { router } from 'expo-router';
import { Habit } from '../types/habit';
import { useHabitStore } from '../store/habitStore';
import { useTheme } from '../hooks/useTheme';

interface HabitBottomSheetProps {
  habit: Habit | null;
  onClose: () => void;
}

export default function HabitBottomSheet({ habit, onClose }: HabitBottomSheetProps) {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { deleteHabit, completeHabit, selectedDate } = useHabitStore();
  
  // Use a taller snap point that covers more of the screen
  const snapPoints = React.useMemo(() => ['65%'], []);
  
  // Open the bottom sheet to full height when it mounts
  useEffect(() => {
    if (bottomSheetRef.current) {
      // Small delay to ensure the animation happens after render
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 100);
    }
  }, []);
  
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);
  
  const handleEdit = useCallback(() => {
    if (habit) {
      router.push({
        pathname: '/add',
        params: { habitId: habit.id }
      });
      onClose();
    }
  }, [habit, onClose]);
  
  const handleDelete = useCallback(() => {
    if (habit) {
      deleteHabit(habit.id);
      onClose();
    }
  }, [habit, deleteHabit, onClose]);
  
  const handleComplete = useCallback(() => {
    if (habit) {
      if (habit.completionType === 'simple') {
        completeHabit(habit.id, undefined, true);
      } else if (habit.completionType === 'repetitions' && habit.completionGoal) {
        completeHabit(habit.id, habit.completionGoal, true);
      } else if (habit.completionType === 'timed' && habit.completionGoal) {
        completeHabit(habit.id, habit.completionGoal, true);
      }
      onClose();
    }
  }, [habit, completeHabit, onClose]);
  
  const handleSkip = useCallback(() => {
    if (habit) {
      // For skipping, we set value to 0 and completed to false
      completeHabit(habit.id, 0, false);
      onClose();
    }
  }, [habit, completeHabit, onClose]);
  
  if (!habit) return null;
  
  const isCompleted = habit.completionHistory[selectedDate]?.completed || false;
  
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={[
        styles.bottomSheetBackground, 
        { backgroundColor: colors.cardBackground }
      ]}
      handleIndicatorStyle={[
        styles.indicator, 
        { backgroundColor: colors.textTertiary }
      ]}
    >
      <View style={styles.contentContainer}>
        {/* Header with habit info */}
        <View style={styles.headerContainer}>
          <View style={[styles.iconContainer, { backgroundColor: colors.input }]}>
            <Text style={styles.habitIcon}>{habit.icon}</Text>
          </View>
          <View style={styles.habitInfoContainer}>
            <Text style={[styles.habitTitle, { color: colors.text }]}>{habit.title}</Text>
            <Text style={[styles.habitSubtitle, { color: colors.textSecondary }]}>
              {habit.completionType === 'simple' 
                ? 'Mark as done each day' 
                : habit.completionType === 'repetitions'
                ? `Goal: ${habit.completionGoal} repetitions`
                : `Goal: ${Math.floor((habit.completionGoal || 0) / 60)} minutes`
              }
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.closeButton, { backgroundColor: colors.input }]}
            onPress={onClose}
          >
            <ChevronUp size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Status section */}
        <View style={[styles.statusSection, { backgroundColor: colors.input }]}>
          <Text style={[styles.statusText, { color: colors.textSecondary }]}>
            Status: {isCompleted ? 'Completed' : 'Not completed'} for {selectedDate}
          </Text>
        </View>
        
        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.input }]} 
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Edit size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.input }]} 
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Trash2 size={24} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.text }]}>Delete</Text>
          </TouchableOpacity>
          
          {!isCompleted ? (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.input }]} 
              onPress={handleComplete}
              activeOpacity={0.7}
            >
              <Check size={24} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.text }]}>Complete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.input }]} 
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <X size={24} color={colors.textSecondary} />
              <Text style={[styles.actionText, { color: colors.text }]}>Mark Incomplete</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    width: 40,
    height: 4,
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  habitIcon: {
    fontSize: 30,
  },
  habitInfoContainer: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  habitSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    width: '30%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
    marginBottom: 12,
  },
  actionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});