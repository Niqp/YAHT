import { BasicInfoSection, CompletionTypeSection, RepetitionPatternSection } from "@/components/habitForm";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import { CompletionType, Habit, RepetitionConfig, RepetitionType } from "@/types/habit";
import { getCurrentDateStamp } from "@/utils/date";
import { Button } from "@rneui/themed";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState, useEffect } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AddEditHabitScreen() {
  const { colors, weekStartDay } = useTheme();
  const params = useLocalSearchParams();
  const habitId = params.habitId as string | undefined;
  const { addHabit, updateHabit, deleteHabit, getHabitById } = useHabitStore();

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("🌟");
  const [repetitionType, setRepetitionType] = useState<RepetitionType>(RepetitionType.DAILY);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [customDays, setCustomDays] = useState<number>(1);
  const [completionType, setCompletionType] = useState<CompletionType>(CompletionType.SIMPLE);
  const [completionGoal, setCompletionGoal] = useState<number>(5);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (habitId) {
      const habit = getHabitById(habitId);
      if (habit) {
        setTitle(habit.title);
        setIcon(habit.icon);
        setRepetitionType(habit.repetition.type);

        if (habit.repetition.type === RepetitionType.WEEKDAYS && Array.isArray(habit.repetition.days)) {
          setSelectedDays(habit.repetition.days);
        } else if (habit.repetition.type === RepetitionType.INTERVAL && typeof habit.repetition.days === "number") {
          setCustomDays(habit.repetition.days);
        }

        setCompletionType(habit.completion.type);
        if (habit.completion.type !== CompletionType.SIMPLE && habit.completion.goal) {
          setCompletionGoal(habit.completion.goal);
        }

        setIsEditMode(true);
      }
    }
  }, [habitId, getHabitById]);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your habit");
      return;
    }
    if (!completionType) {
      Alert.alert("Error", "Please select a completion type");
      return;
    }

    let repetition: RepetitionConfig = { type: RepetitionType.DAILY };
    const currentDate = getCurrentDateStamp();

    // Create the correct repetition object based on the type
    if (repetitionType === RepetitionType.WEEKDAYS) {
      if (selectedDays.length === 0) {
        Alert.alert("Error", "Please select at least one day of the week");
        return;
      }
      repetition = {
        type: RepetitionType.WEEKDAYS,
        days: selectedDays,
      };
    } else if (repetitionType === RepetitionType.INTERVAL) {
      repetition = {
        type: RepetitionType.INTERVAL,
        days: customDays,
      };
    }

    const habitData: Omit<Habit, "id"> = {
      title,
      icon,
      completionHistory: {},
      completion: { type: completionType, goal: completionGoal },
      repetition,
      createdAt: currentDate,
    };

    if (isEditMode && habitId) {
      updateHabit(habitId, habitData);
    } else {
      addHabit(habitData);
    }

    router.push("/today");
  };

  const handleDelete = () => {
    if (isEditMode && habitId) {
      Alert.alert("Delete Habit", "Are you sure you want to delete this habit? This action cannot be undone.", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteHabit(habitId);
            router.push("/today");
          },
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: isEditMode ? "Edit Habit" : "Add New Habit",
          headerStyle: {
            backgroundColor: colors.cardBackground,
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 18,
            color: colors.text,
          },
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView style={styles.scrollContainer}>
          <BasicInfoSection title={title} setTitle={setTitle} icon={icon} setIcon={setIcon} />

          <RepetitionPatternSection
            repetitionType={repetitionType}
            setRepetitionType={setRepetitionType}
            selectedDays={selectedDays}
            setSelectedDays={setSelectedDays}
            customDays={customDays}
            setCustomDays={setCustomDays}
            weekStartDay={weekStartDay}
          />

          <CompletionTypeSection
            completionType={completionType}
            setCompletionType={setCompletionType}
            completionGoal={completionGoal}
            setCompletionGoal={setCompletionGoal}
            isEditMode={isEditMode}
          />

          <View style={styles.buttonsContainer}>
            <Button
              title={isEditMode ? "Update Habit" : "Add Habit"}
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
    fontWeight: "bold",
  },
});
