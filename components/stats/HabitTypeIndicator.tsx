import { AppText } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { CompletionType } from "@/types/habit";
import { CheckSquare, Clock3, RotateCcw } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface HabitTypeIndicatorProps {
  completionType: CompletionType;
}

const HabitTypeIndicator: React.FC<HabitTypeIndicatorProps> = ({ completionType }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  let icon: React.ReactNode = null;
  let label = "";

  switch (completionType) {
    case "simple":
      icon = <CheckSquare size={16} color={colors.iconPrimary} strokeWidth={2} />;
      label = t("habits.types.simple");
      break;
    case "repetitions":
      icon = <RotateCcw size={16} color={colors.iconPrimary} strokeWidth={2} />;
      label = t("habits.types.count");
      break;
    case "timed":
      icon = <Clock3 size={16} color={colors.iconPrimary} strokeWidth={2} />;
      label = t("habits.types.timer");
      break;
  }

  return (
    <View style={styles.habitTypeTag}>
      {icon}
      <AppText variant="caption" color={colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  habitTypeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
});

export default HabitTypeIndicator;
