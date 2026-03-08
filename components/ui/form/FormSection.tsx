import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";
import Card from "../Card";

interface FormSectionProps {
  label: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  description?: string;
}

export default function FormSection({ label, children, style, cardStyle, description }: FormSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <AppText variant="label" color={colors.textSecondary} style={styles.label}>
        {label}
      </AppText>

      {description ? (
        <AppText variant="caption" color={colors.textTertiary} style={styles.description}>
          {description}
        </AppText>
      ) : null}

      <Card variant="surface" style={cardStyle}>
        {children}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
});
