import { useTheme } from "@/hooks/useTheme";
import { Edit, Trash2, Check, RotateCcw, Plus, Minus } from "lucide-react-native";
import { View, Pressable } from "react-native";
import styles from "./HabitBottomSheetActions.styles";
import type { Habit } from "@/types/habit";
import { AppText } from "@/components/ui";
import { useTranslation } from "@/i18n";

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
  const { t } = useTranslation();
  const completeAction = !isCompleted
    ? {
        label: t("common.complete"),
        icon: <Check size={20} color={colors.buttonPrimaryText} />,
        onPress: handleComplete,
        style: [
          styles.actionButton,
          styles.primaryActionButton,
          { backgroundColor: colors.buttonPrimaryBg, borderColor: colors.buttonPrimaryBg },
        ],
        textColor: colors.buttonPrimaryText,
      }
    : {
        label: t("common.reset"),
        icon: <RotateCcw size={20} color={colors.iconSecondary} />,
        onPress: handleReset,
        style: [
          styles.actionButton,
          styles.primaryActionButton,
          { backgroundColor: colors.buttonSecondaryBg, borderColor: colors.buttonSecondaryBorder },
        ],
        textColor: colors.buttonSecondaryText,
      };

  return (
    <View style={styles.container}>
      {habit.completion.type === "repetitions" && (
        <View style={[styles.repetitionRow, { backgroundColor: colors.bgInset, borderColor: colors.inputBorder }]}>
          <Pressable
            style={[styles.repButton, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}
            onPress={handleDecrement}
            disabled={currentValue === 0}
            accessibilityRole="button"
            accessibilityLabel={t("habits.details.decreaseCount")}
          >
            <Minus size={20} color={currentValue === 0 ? colors.iconDisabled : colors.iconAccent} />
          </Pressable>
          <AppText variant="title" color={colors.textPrimary} tabularNums style={styles.repText}>
            {currentValue} / {habit.completion.goal}
          </AppText>
          <Pressable
            style={[styles.repButton, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}
            onPress={handleIncrement}
            accessibilityRole="button"
            accessibilityLabel={t("habits.details.increaseCount")}
          >
            <Plus size={20} color={colors.iconAccent} />
          </Pressable>
        </View>
      )}

      <View style={styles.actionsContainer}>
        <Pressable style={completeAction.style} onPress={completeAction.onPress} accessibilityRole="button">
          {completeAction.icon}
          <AppText variant="bodyMedium" color={completeAction.textColor} style={styles.actionText}>
            {completeAction.label}
          </AppText>
        </Pressable>
      </View>

      <View style={styles.secondaryActionsContainer}>
        <Pressable
          style={[
            styles.secondaryActionButton,
            { backgroundColor: colors.buttonSecondaryBg, borderColor: colors.buttonSecondaryBorder },
          ]}
          onPress={handleEdit}
          accessibilityRole="button"
        >
          <Edit size={18} color={colors.iconAccent} />
          <AppText variant="label" color={colors.buttonSecondaryText} style={styles.actionText}>
            {t("common.edit")}
          </AppText>
        </Pressable>

        <Pressable
          style={[styles.secondaryActionButton, { backgroundColor: colors.dangerSoftBg, borderColor: colors.danger }]}
          onPress={handleDelete}
          accessibilityRole="button"
        >
          <Trash2 size={18} color={colors.iconDanger} />
          <AppText variant="label" color={colors.danger} style={styles.actionText}>
            {t("common.delete")}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
