import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";

export interface SegmentedControlOption {
  label: string;
  value: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  disabled = false,
  accessibilityLabel,
}: SegmentedControlProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, { borderColor: colors.border, backgroundColor: colors.input }]}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isDisabled = disabled || option.disabled;

        return (
          <Pressable
            key={option.value}
            disabled={isDisabled}
            onPress={() => onChange(option.value)}
            hitSlop={{ top: Spacing.xs, bottom: Spacing.xs, left: Spacing.xs, right: Spacing.xs }}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: isSelected, disabled: isDisabled }}
            android_ripple={{ color: colors.ripple, borderless: false }}
            style={({ pressed }) => [
              styles.segment,
              index > 0 && [styles.segmentDivider, { borderLeftColor: colors.divider }],
              isSelected && { backgroundColor: colors.primary, borderLeftColor: colors.primary },
              isDisabled && !isSelected && { backgroundColor: colors.buttonDisabled, borderLeftColor: colors.border },
              pressed && !isSelected && { backgroundColor: colors.surface },
            ]}
          >
            <AppText
              variant="label"
              color={
                isSelected
                  ? colors.textInverse
                  : isDisabled && !isSelected
                    ? colors.buttonDisabledText
                    : colors.textSecondary
              }
              style={styles.segmentText}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    flexDirection: "row",
  },
  segment: {
    minHeight: 48,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },
  segmentDivider: {
    borderLeftWidth: 1,
  },
  segmentText: {
    ...Typography.label,
    textAlign: "center",
    letterSpacing: 0,
  },
});
