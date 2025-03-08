import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-elements';
import { useHabitStore } from '../store/habitStore';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { CompletionType, RepetitionType } from '../types/habit';
import { Clock, RotateCcw, CheckSquare } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import RepetitionControls from '../components/controls/RepetitionControls';
import TimedControls from '../components/controls/TimedControls';

export default function AddEditHabitScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const habitId = params.habitId as string | undefined;
  const { addHabit, updateHabit, deleteHabit, getHabitById } = useHabitStore();

  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('🌟');
  const [repetitionType, setRepetitionType] = useState<RepetitionType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [customDays, setCustomDays] = useState<number>(1);
  const [completionType, setCompletionType] = useState<CompletionType>('simple');
  const [completionGoal, setCompletionGoal] = useState<number>(5);
  const [isEditMode, setIsEditMode] = useState(false);

  const WEEKDAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  useEffect(() => {
    if (habitId) {
      const habit = getHabitById(habitId);
      if (habit) {
        setTitle(habit.title);
        setIcon(habit.icon);
        setRepetitionType(habit.repetitionType);
        
        if (habit.repetitionType === 'weekly' && Array.isArray(habit.repetitionValue)) {
          setSelectedDays(habit.repetitionValue);
        } else if (habit.repetitionType === 'custom' && typeof habit.repetitionValue === 'number') {
          setCustomDays(habit.repetitionValue);
        }
        
        setCompletionType(habit.completionType);
        if (habit.completionGoal) {
          setCompletionGoal(habit.completionGoal);
        }
        
        setIsEditMode(true);
      }
    }
  }, [habitId]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your habit');
      return;
    }

    let repetitionValue;
    if (repetitionType === 'weekly') {
      if (selectedDays.length === 0) {
        Alert.alert('Error', 'Please select at least one day of the week');
        return;
      }
      repetitionValue = selectedDays;
    } else if (repetitionType === 'custom') {
      repetitionValue = customDays;
    } else {
      repetitionValue = null;
    }

    const habitData = {
      title,
      icon,
      repetitionType,
      repetitionValue,
      completionType,
      completionGoal: completionType !== 'simple' ? completionGoal : undefined,
    };

    if (isEditMode && habitId) {
      updateHabit(habitId, habitData);
      Alert.alert('Success', 'Habit updated successfully!');
    } else {
      addHabit(habitData);
      Alert.alert('Success', 'Habit added successfully!');
    }

    router.push('/today');
  };

  const handleDelete = () => {
    if (isEditMode && habitId) {
      Alert.alert(
        'Delete Habit',
        'Are you sure you want to delete this habit? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteHabit(habitId);
              router.push('/today');
            },
          },
        ]
      );
    }
  };

  const handleDayToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const renderRepetitionOptions = () => {
    switch (repetitionType) {
      case 'daily':
        return (
          <Text style={[styles.repetitionDescription, { color: colors.textSecondary }]}>
            Repeat every day
          </Text>
        );
      case 'weekly':
        return (
          <View style={styles.daysContainer}>
            {WEEKDAYS.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input
                  },
                  selectedDays.includes(day.value) && { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  },
                ]}
                onPress={() => handleDayToggle(day.value)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    { color: colors.textSecondary },
                    selectedDays.includes(day.value) && { color: colors.textInverse },
                  ]}
                >
                  {day.label.substring(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      case 'custom':
        return (
          <View style={styles.customDaysContainer}>
            <Text style={[styles.repetitionDescription, { color: colors.textSecondary }]}>
              Repeat every
            </Text>
            <TextInput
              style={[
                styles.customDaysInput,
                { 
                  borderColor: colors.border,
                  backgroundColor: colors.input,
                  color: colors.text
                }
              ]}
              value={customDays.toString()}
              onChangeText={text => {
                const value = parseInt(text);
                if (!isNaN(value) && value > 0) {
                  setCustomDays(value);
                }
              }}
              keyboardType="number-pad"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={[styles.repetitionDescription, { color: colors.textSecondary }]}>
              days
            </Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderCompletionOptions = () => {
    switch (completionType) {
      case 'simple':
        return (
          <View style={styles.completionTypeDescription}>
            <CheckSquare size={24} color={colors.primary} />
            <Text style={[styles.completionDescription, { color: colors.textSecondary }]}>
              Simple completion (done or not done)
            </Text>
          </View>
        );
      case 'repetitions':
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <RotateCcw size={24} color={colors.primary} />
              <Text style={[styles.completionDescription, { color: colors.textSecondary }]}>
                Track repetitions (e.g., number of exercises)
              </Text>
            </View>
            <View style={styles.goalContainer}>
              <RepetitionControls
                value={completionGoal}
                onChange={setCompletionGoal}
                min={1}
                max={100}
              />
            </View>
          </View>
        );
      case 'timed':
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <Clock size={24} color={colors.primary} />
              <Text style={[styles.completionDescription, { color: colors.textSecondary }]}>
                Track time (e.g., minutes of exercise)
              </Text>
            </View>
            <View style={styles.goalContainer}>
              <TimedControls
                value={completionGoal}
                onChange={setCompletionGoal}
                min={60}  // 1 minute minimum
                max={7200}  // 2 hours maximum
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: isEditMode ? 'Edit Habit' : 'Add New Habit',
          headerStyle: {
            backgroundColor: colors.cardBackground,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: colors.text
          },
          headerTintColor: colors.text,
        }} 
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer}>
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Basic Information
            </Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Title</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input,
                    color: colors.text
                  }
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter habit title"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Icon/Emoji</Text>
              <TextInput
                style={[
                  styles.emojiInput,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input,
                    color: colors.text
                  }
                ]}
                value={icon}
                onChangeText={setIcon}
                maxLength={2}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Repetition Pattern
            </Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input
                  },
                  repetitionType === 'daily' && { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  },
                ]}
                onPress={() => setRepetitionType('daily')}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    repetitionType === 'daily' && { color: colors.textInverse },
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input
                  },
                  repetitionType === 'weekly' && { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  },
                ]}
                onPress={() => setRepetitionType('weekly')}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    repetitionType === 'weekly' && { color: colors.textInverse },
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input
                  },
                  repetitionType === 'custom' && { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  },
                ]}
                onPress={() => setRepetitionType('custom')}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    repetitionType === 'custom' && { color: colors.textInverse },
                  ]}
                >
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.repetitionOptionsContainer}>
              {renderRepetitionOptions()}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Completion Type
            </Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input
                  },
                  completionType === 'simple' && { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  },
                  isEditMode && { opacity: 0.6 },
                ]}
                onPress={() => !isEditMode && setCompletionType('simple')}
                disabled={isEditMode}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    completionType === 'simple' && { color: colors.textInverse },
                    isEditMode && completionType !== 'simple' && { color: colors.textTertiary },
                  ]}
                >
                  Simple
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input
                  },
                  completionType === 'repetitions' && { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  },
                  isEditMode && { opacity: 0.6 },
                ]}
                onPress={() => !isEditMode && setCompletionType('repetitions')}
                disabled={isEditMode}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    completionType === 'repetitions' && { color: colors.textInverse },
                    isEditMode && completionType !== 'repetitions' && { color: colors.textTertiary },
                  ]}
                >
                  Repetitions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  { 
                    borderColor: colors.border,
                    backgroundColor: colors.input
                  },
                  completionType === 'timed' && { 
                    backgroundColor: colors.primary,
                    borderColor: colors.primary
                  },
                  isEditMode && { opacity: 0.6 },
                ]}
                onPress={() => !isEditMode && setCompletionType('timed')}
                disabled={isEditMode}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: colors.textSecondary },
                    completionType === 'timed' && { color: colors.textInverse },
                    isEditMode && completionType !== 'timed' && { color: colors.textTertiary },
                  ]}
                >
                  Timed
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.completionOptionsContainer}>
              {renderCompletionOptions()}
            </View>
            {isEditMode && (
              <Text style={[styles.editNotice, { color: colors.error }]}>
                Note: Completion type cannot be changed after a habit is created.
              </Text>
            )}
          </View>

          <View style={styles.buttonsContainer}>
            <Button
              title={isEditMode ? 'Update Habit' : 'Add Habit'}
              buttonStyle={[styles.saveButton, { backgroundColor: colors.primary }]}
              titleStyle={[styles.buttonText, { color: colors.textInverse }]}
              onPress={handleSave}
            />
            {isEditMode && (
              <Button
                title="Delete"
                buttonStyle={[styles.deleteButton, { backgroundColor: colors.error }]}
                titleStyle={styles.buttonText}
                onPress={handleDelete}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  emojiInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
    width: 70,
  },
  optionsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 14,
  },
  repetitionOptionsContainer: {
    marginTop: 10,
  },
  repetitionDescription: {
    fontSize: 14,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    width: '30%',
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 14,
  },
  customDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customDaysInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
  },
  completionOptionsContainer: {
    marginTop: 10,
  },
  completionTypeContainer: {
    marginBottom: 15,
  },
  completionTypeDescription: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  completionDescription: {
    fontSize: 14,
    marginLeft: 10,
  },
  goalContainer: {
    marginLeft: 34,
    marginTop: 8,
  },
  goalLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  goalInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    width: 70,
    textAlign: 'center',
    fontSize: 16,
  },
  buttonsContainer: {
    marginBottom: 30,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 15,
    marginBottom: 15,
  },
  deleteButton: {
    borderRadius: 8,
    paddingVertical: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  editNotice: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 10,
  },
});