import React from "react";
import { View, Text } from "react-native";
import { Circle, CheckCircle } from "lucide-react-native";
import styles from "./TaskGroupSeparator.styles";

const TaskGroupSeparator = React.memo(
  ({
    title,
    completed,
    count,
    colors,
  }: {
    title: string;
    completed: boolean;
    count: number;
    colors: {
      background: string;
      text: string;
      textSecondary: string;
      divider: string;
      success: string;
    };
  }) => {
    return (
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <View style={[styles.sectionIconContainer, { backgroundColor: completed ? colors.success : colors.divider }]}>
          {completed ? <CheckCircle size={16} color="#fff" /> : <Circle size={16} color={colors.textSecondary} />}
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title} • {count}
        </Text>
      </View>
    );
  }
);

export default TaskGroupSeparator;
