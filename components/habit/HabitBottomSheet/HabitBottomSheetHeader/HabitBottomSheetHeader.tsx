import styles from "./HabitBottomSheetHeader.styles";
import { View, Text, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { ChevronUp } from "lucide-react-native";
import type { Habit } from "@/types/habit";

export default function HabitBottomSheetHeader({ habit, onClose }: { habit: Habit; onClose: () => void }) {
  const { colors } = useTheme();

  let formattedTimeGoal = "";
  if (habit.completion.type === "timed") {
    const totalMinutes = Math.floor((habit.completion.goal || 0) / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    formattedTimeGoal = hours > 0 ? (mins > 0 ? `${hours}h ${mins}m` : `${hours}h`) : `${mins}m`;
  }

  return (
    <View style={styles.headerContainer}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <Text style={styles.habitIcon}>{habit.icon}</Text>
      </View>
      <View style={styles.habitInfoContainer}>
        <Text style={[styles.habitTitle, { color: colors.text }]}>{habit.title}</Text>
        <Text style={[styles.habitSubtitle, { color: colors.textSecondary }]}>
          {habit.completion.type === "simple"
            ? "Goal: complete once"
            : habit.completion.type === "repetitions"
              ? `Goal: ${habit.completion.goal || 0} repetitions`
              : `Goal: ${formattedTimeGoal}`}
        </Text>
      </View>
      <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surface }]} onPress={onClose}>
        <ChevronUp size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}
