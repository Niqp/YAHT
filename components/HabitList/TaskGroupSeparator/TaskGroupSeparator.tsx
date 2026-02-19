import React from "react";
import { View } from "react-native";
import { Circle, CheckCircle } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { AppText } from "@/components/ui";
import styles from "./TaskGroupSeparator.styles";

interface TaskGroupSeparatorProps {
  title: string;
  completed: boolean;
  count: number;
}

const TaskGroupSeparator = React.memo(({ title, completed, count }: TaskGroupSeparatorProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.sectionHeader, { backgroundColor: colors.background }]}
      accessibilityRole="header"
      accessibilityLabel={`${title}, ${count} habit${count !== 1 ? "s" : ""}`}
    >
      <View
        style={[
          styles.sectionIconContainer,
          { backgroundColor: completed ? colors.successSubtle : colors.primarySubtle },
        ]}
      >
        {completed ? (
          <CheckCircle size={16} color={colors.success} strokeWidth={1.5} />
        ) : (
          <Circle size={16} color={colors.iconMuted} strokeWidth={1.5} />
        )}
      </View>
      <AppText variant="label" color={colors.textSecondary}>
        {title} • {count}
      </AppText>
    </View>
  );
});

export default TaskGroupSeparator;
