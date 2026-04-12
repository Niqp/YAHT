import { useTheme } from "@/hooks/useTheme";
import { Edit, Trash2, Check, RotateCcw, Plus, Minus } from "lucide-react-native";
import { View, TouchableOpacity, Text } from "react-native";
import styles from "./HabitBottomSheetActions.styles";
import { getElevation } from "@/constants/Elevation";
import type { Habit } from "@/types/habit";

interface HabitBottomSheetActionsProps {
  habit: Habit;
  isCompleted: boolean;
  currentValue: number;
  handleEdit: () => void;
  handleDelete: () => void;
  handleComplete: () => void;
  handleReset: () => void;
  handleIncrement: () => void;
  handleDecrement: () => void;
}

export default function HabitBottomSheetActions({
  habit,
  isCompleted,
  currentValue,
  handleEdit,
  handleDelete,
  handleComplete,
  handleReset,
  handleIncrement,
  handleDecrement,
}: HabitBottomSheetActionsProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {habit.completion.type === "repetitions" && (
        <View
          style={[
            styles.repetitionRow,
            { backgroundColor: colors.bgInset, borderWidth: 1, borderColor: colors.borderDefault },
            getElevation(1, colors.shadow),
          ]}
        >
          <TouchableOpacity
            style={styles.repButton}
            onPress={handleDecrement}
            disabled={currentValue === 0}
            activeOpacity={0.7}
          >
            <Minus size={24} color={currentValue === 0 ? colors.iconDisabled : colors.iconAccent} />
          </TouchableOpacity>
          <Text style={[styles.repText, { color: colors.textPrimary }]}>
            {currentValue} / {habit.completion.goal}
          </Text>
          <TouchableOpacity style={styles.repButton} onPress={handleIncrement} activeOpacity={0.7}>
            <Plus size={24} color={colors.iconAccent} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.bgSurfaceElevated, borderWidth: 1, borderColor: colors.borderDefault },
            getElevation(1, colors.shadow),
          ]}
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <Edit size={24} color={colors.iconAccent} />
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: colors.bgSurfaceElevated, borderWidth: 1, borderColor: colors.borderDefault },
            getElevation(1, colors.shadow),
          ]}
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <Trash2 size={24} color={colors.iconDanger} />
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>Delete</Text>
        </TouchableOpacity>

        {!isCompleted ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.bgSurfaceElevated, borderWidth: 1, borderColor: colors.borderDefault },
              getElevation(1, colors.shadow),
            ]}
            onPress={handleComplete}
            activeOpacity={0.7}
          >
            <Check size={24} color={colors.iconSuccess} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Complete</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: colors.bgSurfaceElevated, borderWidth: 1, borderColor: colors.borderDefault },
              getElevation(1, colors.shadow),
            ]}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <RotateCcw size={24} color={colors.iconSecondary} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
