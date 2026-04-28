import React from "react";
import { View } from "react-native";
import { Circle, CheckCircle } from "lucide-react-native";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { AppText } from "@/components/ui";
import styles from "./TaskGroupSeparator.styles";

interface TaskGroupSeparatorProps {
  title: string;
  completed: boolean;
  count: number;
}

const TaskGroupSeparator = React.memo(({ title, completed, count }: TaskGroupSeparatorProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View
      style={[styles.sectionHeader, { backgroundColor: colors.bgApp }]}
      accessibilityRole="header"
      accessibilityLabel={t("habits.groupAccessibility", { title, count })}
    >
      <View
        style={[
          styles.sectionIconContainer,
          { backgroundColor: colors.bgInset, borderWidth: 1, borderColor: colors.borderDefault },
        ]}
      >
        {completed ? (
          <CheckCircle size={16} color={colors.success} strokeWidth={1.5} />
        ) : (
          <Circle size={16} color={colors.iconDisabled} strokeWidth={1.5} />
        )}
      </View>
      <AppText variant="label" color={colors.textSecondary}>
        {title} • {count}
      </AppText>
    </View>
  );
});

export default TaskGroupSeparator;
