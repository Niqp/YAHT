import { AppText } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { CompletionType } from "@/types/habit";
import { CheckSquare, Clock3, RotateCcw } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

interface HabitTypeIndicatorProps {
  completionType: CompletionType;
}

const HabitTypeIndicator: React.FC<HabitTypeIndicatorProps> = ({ completionType }) => {
  const { colors } = useTheme();

  let icon: React.ReactNode = null;
  let label = "";

  switch (completionType) {
    case "simple":
      icon = <CheckSquare size={16} color={colors.icon} strokeWidth={2} />;
      label = "Simple";
      break;
    case "repetitions":
      icon = <RotateCcw size={16} color={colors.icon} strokeWidth={2} />;
      label = "Count";
      break;
    case "timed":
      icon = <Clock3 size={16} color={colors.icon} strokeWidth={2} />;
      label = "Timer";
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
