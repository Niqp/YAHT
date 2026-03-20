import React, { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import AppText from "@/components/ui/AppText";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

interface PresetOption<T extends string | number> {
  label: string;
  value: T;
}

interface BasePresetPillsProps<T extends string | number> {
  options: ReadonlyArray<PresetOption<T>>;
}

interface SingleSelectPresetPillsProps<T extends string | number> extends BasePresetPillsProps<T> {
  selectionMode?: "single";
  selectedValue: T;
  onSelect: (value: T) => void;
}

interface MultiSelectPresetPillsProps<T extends string | number> extends BasePresetPillsProps<T> {
  selectionMode: "multiple";
  selectedValues: ReadonlyArray<T>;
  onToggle: (value: T) => void;
}

type PresetPillsProps<T extends string | number> = SingleSelectPresetPillsProps<T> | MultiSelectPresetPillsProps<T>;

function PresetPills<T extends string | number>(props: PresetPillsProps<T>) {
  const { colors } = useTheme();
  const { options } = props;

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isActive =
          props.selectionMode === "multiple"
            ? props.selectedValues.includes(option.value)
            : option.value === props.selectedValue;

        return (
          <Pressable
            key={String(option.value)}
            onPress={() => {
              if (props.selectionMode === "multiple") {
                props.onToggle(option.value);
                return;
              }

              props.onSelect(option.value);
            }}
            android_ripple={{ color: colors.ripple, borderless: false }}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: isActive ? colors.primarySubtle : colors.input,
                borderColor: isActive ? colors.primary : colors.inputBorder,
              },
              pressed ? styles.pillPressed : null,
            ]}
          >
            <AppText variant="small" color={isActive ? colors.primary : colors.textSecondary}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default memo(PresetPills) as typeof PresetPills;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  pill: {
    minWidth: 56,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  pillPressed: {
    opacity: 0.82,
  },
});
