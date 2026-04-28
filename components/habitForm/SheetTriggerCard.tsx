import { AppText } from "@/components/ui";
import PressableCard from "@/components/ui/PressableCard";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { ChevronRight } from "lucide-react-native";
import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface SheetTriggerCardProps {
  label: string;
  value: string;
  helperText?: string;
  icon: ReactNode;
  onPress: () => void;
  errorMessage?: string | null;
}

export default function SheetTriggerCard({
  label,
  value,
  helperText,
  icon,
  onPress,
  errorMessage,
}: SheetTriggerCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const statusColor = errorMessage ? colors.danger : colors.textPrimary;
  const statusText = errorMessage ?? value;

  return (
    <PressableCard
      onPress={onPress}
      bordered
      elevation={1}
      style={[
        styles.card,
        {
          borderColor: errorMessage ? colors.danger : colors.borderDefault,
          backgroundColor: colors.bgSurface,
        },
      ]}
      accessibilityHint={t("addHabit.sections.openPanelHint", { label })}
    >
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.bgInset }]}>{icon}</View>

        <View style={styles.textBlock}>
          <AppText variant="small" color={colors.textSecondary}>
            {label}
          </AppText>
          <AppText variant="bodyMedium" color={statusColor} numberOfLines={1}>
            {statusText}
          </AppText>
          {helperText ? (
            <AppText variant="caption" color={colors.textTertiary} numberOfLines={1}>
              {helperText}
            </AppText>
          ) : null}
        </View>

        <View style={[styles.chevronWrap, { backgroundColor: colors.bgInset, borderColor: colors.borderSubtle }]}>
          <ChevronRight size={18} color={colors.iconPrimary} />
        </View>
      </View>
    </PressableCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  content: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  chevronWrap: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
