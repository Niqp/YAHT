import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CheckSquare, RotateCcw, Clock } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { CompletionType } from "../../types/habit";

interface HabitTypeIndicatorProps {
  completionType: CompletionType;
}

const HabitTypeIndicator: React.FC<HabitTypeIndicatorProps> = ({ completionType }) => {
  const { colors } = useTheme();

  let icon;
  let label;

  switch (completionType) {
    case "simple":
      icon = <CheckSquare size={16} color={colors.textSecondary} />;
      label = "Simple";
      break;
    case "repetitions":
      icon = <RotateCcw size={16} color={colors.textSecondary} />;
      label = "Repetitions";
      break;
    case "timed":
      icon = <Clock size={16} color={colors.textSecondary} />;
      label = "Timed";
      break;
  }

  return (
    <View style={[styles.habitTypeTag, { backgroundColor: colors.input }]}>
      {icon}
      <Text style={[styles.habitTypeTagText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  habitTypeTag: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  habitTypeTagText: {
    fontSize: 12,
    marginLeft: 4,
  },
});

export default HabitTypeIndicator;
