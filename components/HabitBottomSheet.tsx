import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Edit, Trash2, Check, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Habit } from '../types/habit';
import { useHabitStore } from '../store/habitStore';

interface HabitBottomSheetProps {
  habit: Habit | null;
  onClose: () => void;
}

export default function HabitBottomSheet({ habit, onClose }: HabitBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { deleteHabit, completeHabit, selectedDate } = useHabitStore();
  
  const snapPoints = React.useMemo(() => ['25%', '50%'], []);
  
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
      completeHabit(habit.id);
      onClose();
    }
  }, [habit, completeHabit, onClose]);
  
  const handleSkip = useCallback(() => {
    // For skipping, we just close the bottom sheet without taking action
    onClose();
  }, [onClose]);
  
  if (!habit) return null;
  
  const isCompleted = habit.completionHistory[selectedDate]?.completed || false;
  
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose
      backgroundStyle={styles.bottomSheetBackground}
      handleIndicatorStyle={styles.indicator}
    >
      <View style={styles.contentContainer}>
        <View style={styles.habitInfo}>
          <View style={styles.iconContainer}>
            <Text style={styles.habitIcon}>{habit.icon}</Text>
          </View>
          <Text style={styles.habitTitle}>{habit.title}</Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Edit size={24} color="#4A6572" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={24} color="#F44336" />
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
          
          {!isCompleted ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleComplete}>
              <Check size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Complete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={handleSkip}>
              <X size={24} color="#757575" />
              <Text style={styles.actionText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  indicator: {
    backgroundColor: '#BDBDBD',
    width: 40,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  habitIcon: {
    fontSize: 24,
  },
  habitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
  },
  actionText: {
    marginTop: 5,
    fontSize: 14,
    color: '#757575',
  },
});