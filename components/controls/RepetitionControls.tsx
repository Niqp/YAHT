import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Minus, Plus } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";

interface RepetitionControlsProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export default function RepetitionControls({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  label = "Target repetitions:",
}: RepetitionControlsProps) {
  const { colors } = useTheme();

  // Allow empty input for better editing experience
  const [inputValue, setInputValue] = useState(value.toString());

  // Update internal input value when the external value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleIncrement = () => {
    if (value + step <= max) {
      onChange(value + step);
    }
  };

  const handleDecrement = () => {
    if (value - step >= min) {
      onChange(value - step);
    }
  };

  const handleInputChange = (text: string) => {
    // Allow empty or partial input while typing
    setInputValue(text);

    // Only update the actual value if it's valid
    const newValue = parseInt(text);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  // When focus is lost, ensure we have a valid value
  const handleBlur = () => {
    if (inputValue === "" || isNaN(parseInt(inputValue))) {
      // Reset to minimum value if input is empty or invalid
      setInputValue(min.toString());
      onChange(min);
    } else {
      const parsedValue = parseInt(inputValue);

      // Ensure value is within bounds
      if (parsedValue < min) {
        setInputValue(min.toString());
        onChange(min);
      } else if (parsedValue > max) {
        setInputValue(max.toString());
        onChange(max);
      }
    }
  };

  // Common preset values
  const presets = [5, 10, 20, 50];

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>

      <View style={styles.controlsRow}>
        {/* Decrement button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: value <= min ? colors.buttonDisabled : colors.input,
              borderColor: value <= min ? colors.buttonDisabled : colors.border,
            },
          ]}
          onPress={handleDecrement}
          disabled={value <= min}
        >
          <Minus size={18} color={value <= min ? colors.buttonDisabledText : colors.textSecondary} />
        </TouchableOpacity>

        {/* Text input */}
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.input,
              color: colors.text,
            },
          ]}
          value={inputValue}
          onChangeText={handleInputChange}
          keyboardType="number-pad"
          selectTextOnFocus
          onBlur={handleBlur}
          maxLength={3}
        />

        {/* Increment button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: value >= max ? colors.buttonDisabled : colors.input,
              borderColor: value >= max ? colors.buttonDisabled : colors.border,
            },
          ]}
          onPress={handleIncrement}
          disabled={value >= max}
        >
          <Plus size={18} color={value >= max ? colors.buttonDisabledText : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Presets */}
      <View style={styles.presetsContainer}>
        <Text style={[styles.presetsLabel, { color: colors.textSecondary }]}>Quick set:</Text>
        <View style={styles.presetButtons}>
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                {
                  backgroundColor: value === preset ? colors.primary : colors.input,
                  borderColor: value === preset ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onChange(preset)}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  {
                    color: value === preset ? colors.buttonPrimaryText : colors.text,
                  },
                ]}
              >
                {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    height: 48,
    width: 60,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    marginHorizontal: Spacing.sm,
    textAlign: "center",
    ...Typography.body,
  },
  presetsContainer: {
    marginTop: Spacing.xs,
  },
  presetsLabel: {
    ...Typography.label,
    marginBottom: Spacing.sm,
  },
  presetButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  presetButton: {
    minHeight: 36,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    justifyContent: "center",
  },
  presetButtonText: {
    ...Typography.label,
  },
});
