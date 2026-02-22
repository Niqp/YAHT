import { Minus, Plus } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useTheme } from "@/hooks/useTheme";
import { haptic } from "@/utils/haptics";

import AppText from "../AppText";
import SelectionPill from "./SelectionPill";

interface NumberStepperInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  presets?: number[];
  unit?: string;
}

export default function NumberStepperInput({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  presets = [5, 10, 20, 50],
  unit,
}: NumberStepperInputProps) {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const canDecrease = value - step >= min;
  const canIncrease = value + step <= max;

  const parsedInput = useMemo(() => Number.parseInt(inputValue, 10), [inputValue]);

  const commitValue = (nextValue: number) => {
    const clamped = Math.max(min, Math.min(max, nextValue));
    if (clamped !== value) {
      void haptic.complete();
    }
    onChange(clamped);
    setInputValue(clamped.toString());
  };

  const handleBlur = () => {
    if (Number.isNaN(parsedInput)) {
      commitValue(min);
      return;
    }

    commitValue(parsedInput);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {label}
        </AppText>
        <AppText variant="small" color={colors.textTertiary}>
          {min}–{max}
        </AppText>
      </View>

      <View style={[styles.controlsRow, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
        <Pressable
          onPress={() => commitValue(value - step)}
          disabled={!canDecrease}
          hitSlop={{ top: Spacing.xs, bottom: Spacing.xs, left: Spacing.xs, right: Spacing.xs }}
          accessibilityRole="button"
          accessibilityLabel={`Decrease ${label}`}
          accessibilityState={{ disabled: !canDecrease }}
          android_ripple={{ color: colors.ripple, borderless: false }}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              backgroundColor: canDecrease ? colors.background : colors.buttonDisabled,
              borderColor: canDecrease ? colors.border : colors.buttonDisabled,
            },
            pressed && canDecrease ? { opacity: 0.86 } : null,
          ]}
        >
          <Minus size={18} color={canDecrease ? colors.textSecondary : colors.buttonDisabledText} />
        </Pressable>

        <View style={styles.valueContainer}>
          <TextInput
            value={inputValue}
            onChangeText={(text) => {
              setInputValue(text);
              const nextValue = Number.parseInt(text, 10);
              if (!Number.isNaN(nextValue) && nextValue >= min && nextValue <= max) {
                onChange(nextValue);
              }
            }}
            onBlur={handleBlur}
            keyboardType="number-pad"
            maxLength={4}
            selectTextOnFocus
            accessibilityLabel={`${label} input`}
            style={[
              styles.numericInput,
              {
                color: colors.text,
              },
            ]}
          />
          {unit ? (
            <AppText variant="small" color={colors.textTertiary} style={styles.unitText}>
              {unit}
            </AppText>
          ) : null}
        </View>

        <Pressable
          onPress={() => commitValue(value + step)}
          disabled={!canIncrease}
          hitSlop={{ top: Spacing.xs, bottom: Spacing.xs, left: Spacing.xs, right: Spacing.xs }}
          accessibilityRole="button"
          accessibilityLabel={`Increase ${label}`}
          accessibilityState={{ disabled: !canIncrease }}
          android_ripple={{ color: colors.ripple, borderless: false }}
          style={({ pressed }) => [
            styles.stepperButton,
            {
              backgroundColor: canIncrease ? colors.background : colors.buttonDisabled,
              borderColor: canIncrease ? colors.border : colors.buttonDisabled,
            },
            pressed && canIncrease ? { opacity: 0.86 } : null,
          ]}
        >
          <Plus size={18} color={canIncrease ? colors.textSecondary : colors.buttonDisabledText} />
        </Pressable>
      </View>

      <View style={styles.presetsRow}>
        {presets.map((preset) => {
          const selected = value === preset;
          return (
            <SelectionPill
              key={preset}
              label={unit ? `${preset}${unit}` : String(preset)}
              selected={selected}
              onPress={() => commitValue(preset)}
              accessibilityLabel={`Set to ${preset}`}
              style={styles.presetButton}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
    minHeight: 22,
  },
  label: {
    marginBottom: 0,
  },
  controlsRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  valueContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
  numericInput: {
    ...Typography.title,
    minHeight: 40,
    width: 84,
    textAlign: "center",
  },
  unitText: {
    marginTop: Spacing.xxs,
  },
  presetsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  presetButton: {
    minHeight: 44,
    borderRadius: BorderRadius.lg,
  },
});
