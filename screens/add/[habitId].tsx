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
import { Button, CheckBox } from 'react-native-elements';
import { useHabitStore } from '../../store/habitStore';
import { router, useLocalSearchParams } from 'expo-router';
import { CompletionType, RepetitionType } from '../../types/habit';
import { Clock, RotateCcw, CheckSquare } from 'lucide-react-native';

export default function AddEditHabitScreen() {
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
          <Text style={styles.repetitionDescription}>Repeat every day</Text>
        );
      case 'weekly':
        return (
          <View style={styles.daysContainer}>
            {WEEKDAYS.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day.value) && styles.selectedDayButton,
                ]}
                onPress={() => handleDayToggle(day.value)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    selectedDays.includes(day.value) && styles.selectedDayButtonText,
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
            <Text style={styles.repetitionDescription}>Repeat every</Text>
            <TextInput
              style={styles.customDaysInput}
              value={customDays.toString()}
              onChangeText={text => {
                const value = parseInt(text);
                if (!isNaN(value) && value > 0) {
                  setCustomDays(value);
                }
              }}
              keyboardType="number-pad"
            />
            <Text style={styles.repetitionDescription}>days</Text>
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
            <CheckSquare size={24} color="#4A6572" />
            <Text style={styles.completionDescription}>
              Simple completion (done or not done)
            </Text>
          </View>
        );
      case 'repetitions':
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <RotateCcw size={24} color="#4A6572" />
              <Text style={styles.completionDescription}>
                Track repetitions (e.g., number of exercises)
              </Text>
            </View>
            <View style={styles.goalContainer}>
              <Text style={styles.goalLabel}>Target repetitions:</Text>
              <TextInput
                style={styles.goalInput}
                value={completionGoal.toString()}
                onChangeText={text => {
                  const value = parseInt(text);
                  if (!isNaN(value) && value > 0) {
                    setCompletionGoal(value);
                  }
                }}
                keyboardType="number-pad"
              />
            </View>
          </View>
        );
      case 'timed':
        return (
          <View style={styles.completionTypeContainer}>
            <View style={styles.completionTypeDescription}>
              <Clock size={24} color="#4A6572" />
              <Text style={styles.completionDescription}>
                Track time (e.g., minutes of exercise)
              </Text>
            </View>
            <View style={styles.goalContainer}>
              <Text style={styles.goalLabel}>Target minutes:</Text>
              <TextInput
                style={styles.goalInput}
                value={Math.floor(completionGoal / 60).toString()}
                onChangeText={text => {
                  const value = parseInt(text);
                  if (!isNaN(value) && value >= 0) {
                    setCompletionGoal(value * 60); // Convert minutes to seconds
                  }
                }}
                keyboardType="number-pad"
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter habit title"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Icon/Emoji</Text>
              <TextInput
                style={styles.emojiInput}
                value={icon}
                onChangeText={setIcon}
                maxLength={2}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Repetition Pattern</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  repetitionType === 'daily' && styles.selectedOptionButton,
                ]}
                onPress={() => setRepetitionType('daily')}
              >
                <Text
                  style={[
                    styles.optionText,
                    repetitionType === 'daily' && styles.selectedOptionText,
                  ]}
                >
                  Daily
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  repetitionType === 'weekly' && styles.selectedOptionButton,
                ]}
                onPress={() => setRepetitionType('weekly')}
              >
                <Text
                  style={[
                    styles.optionText,
                    repetitionType === 'weekly' && styles.selectedOptionText,
                  ]}
                >
                  Weekly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  repetitionType === 'custom' && styles.selectedOptionButton,
                ]}
                onPress={() => setRepetitionType('custom')}
              >
                <Text
                  style={[
                    styles.optionText,
                    repetitionType === 'custom' && styles.selectedOptionText,
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

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completion Type</Text>
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  completionType === 'simple' && styles.selectedOptionButton,
                ]}
                onPress={() => setCompletionType('simple')}
              >
                <Text
                  style={[
                    styles.optionText,
                    completionType === 'simple' && styles.selectedOptionText,
                  ]}
                >
                  Simple
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  completionType === 'repetitions' && styles.selectedOptionButton,
                ]}
                onPress={() => setCompletionType('repetitions')}
              >
                <Text
                  style={[
                    styles.optionText,
                    completionType === 'repetitions' && styles.selectedOptionText,
                  ]}
                >
                  Repetitions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  completionType === 'timed' && styles.selectedOptionButton,
                ]}
                onPress={() => setCompletionType('timed')}
              >
                <Text
                  style={[
                    styles.optionText,
                    completionType === 'timed' && styles.selectedOptionText,
                  ]}
                >
                  Timed
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.completionOptionsContainer}>
              {renderCompletionOptions()}
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <Button
              title={isEditMode ? 'Update Habit' : 'Add Habit'}
              buttonStyle={styles.saveButton}
              titleStyle={styles.buttonText}
              onPress={handleSave}
            />
            {isEditMode && (
              <Button
                title="Delete"
                buttonStyle={styles.deleteButton}
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
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
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
    color: '#212121',
    marginBottom: 15,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },
  emojiInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    backgroundColor: '#F5F5F5',
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
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  selectedOptionButton: {
    backgroundColor: '#4A6572',
    borderColor: '#4A6572',
  },
  optionText: {
    fontSize: 14,
    color: '#757575',
  },
  selectedOptionText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  repetitionOptionsContainer: {
    marginTop: 10,
  },
  repetitionDescription: {
    fontSize: 14,
    color: '#757575',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
    width: '30%',
    alignItems: 'center',
  },
  selectedDayButton: {
    backgroundColor: '#4A6572',
    borderColor: '#4A6572',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  selectedDayButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  customDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customDaysInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
    width: 60,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#F5F5F5',
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
    marginBottom: 10,
  },
  completionDescription: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 10,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 34,
  },
  goalLabel: {
    fontSize: 14,
    color: '#757575',
    marginRight: 10,
  },
  goalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 10,
    width: 70,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#F5F5F5',
  },
  buttonsContainer: {
    marginBottom: 30,
  },
  saveButton: {
    backgroundColor: '#4A6572',
    borderRadius: 8,
    paddingVertical: 15,
    marginBottom: 15,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});