import { ChevronDown } from "lucide-react-native";
import type React from "react";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import type { Habit } from "../../types/habit";

interface HabitSelectorProps {
  habits: Habit[];
  selectedHabit: Habit | null;
  onSelectHabit: (habit: Habit) => void;
}

const HabitSelector: React.FC<HabitSelectorProps> = ({ habits, selectedHabit, onSelectHabit }) => {
  const { colors } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!selectedHabit) return null;

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={[styles.dropdownButton, { backgroundColor: colors.input }]}
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <View style={styles.selectedHabitContainer}>
          <Text style={styles.selectedHabitIcon}>{selectedHabit.icon}</Text>
          <Text style={[styles.selectedHabitText, { color: colors.text }]}>{selectedHabit.title}</Text>
        </View>
        <ChevronDown size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {isDropdownOpen && (
        <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBackground }]}>
          <ScrollView
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.dropdownScrollContent}
          >
            {habits.map((habit) => (
              <TouchableOpacity
                key={habit.id}
                style={[
                  styles.dropdownItem,
                  selectedHabit?.id === habit.id && {
                    backgroundColor: colors.input,
                  },
                ]}
                onPress={() => {
                  onSelectHabit(habit);
                  setIsDropdownOpen(false);
                }}
              >
                <Text style={styles.dropdownItemIcon}>{habit.icon}</Text>
                <Text style={[styles.dropdownItemText, { color: colors.text }]} numberOfLines={1}>
                  {habit.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 16,
    zIndex: 1000,
    position: "relative",
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    padding: 12,
  },
  selectedHabitContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedHabitIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  selectedHabitText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    maxHeight: 250,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownScrollContent: {
    padding: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  dropdownItemIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  dropdownItemText: {
    fontSize: 16,
  },
});

export default HabitSelector;
