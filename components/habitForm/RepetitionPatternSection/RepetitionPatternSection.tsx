import { useTheme } from "@/hooks/useTheme";
import { RepetitionType } from "@/types/habit";
import { getOrderedWeekDays } from "@/utils/date";
import type React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "./RepetitionPatternSection.styles";

interface RepetitionPatternSectionProps {
  repetitionType: RepetitionType;
  setRepetitionType: (type: RepetitionType) => void;
  selectedDays: number[];
  setSelectedDays: (days: number[]) => void;
  customDays: number;
  setCustomDays: (days: number) => void;
  weekStartDay: number;
}

const RepetitionPatternSection: React.FC<RepetitionPatternSectionProps> = ({
  repetitionType,
  setRepetitionType,
  selectedDays,
  setSelectedDays,
  customDays,
  setCustomDays,
  weekStartDay,
}) => {
  const { colors } = useTheme();

  // Get weekdays ordered according to the weekStartDay preference
  const WEEKDAYS = getOrderedWeekDays(weekStartDay);

  const handleDayToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  // Helper to check if a day is selected by its displayed index
  const isDaySelected = (displayIndex: number) => {
    return selectedDays.includes(displayIndex);
  };

  const renderRepetitionOptions = () => {
    switch (repetitionType) {
      case RepetitionType.DAILY:
        return (
          <View style={styles.infoRow}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              This habit will repeat every single day.
            </Text>
          </View>
        );
      case RepetitionType.WEEKDAYS:
        return (
          <View style={styles.daysContainer}>
            {WEEKDAYS.map((day: { dayIndex: number; name: string }) => {
              const selected = isDaySelected(day.dayIndex);
              return (
                <TouchableOpacity
                  key={day.dayIndex}
                  style={[
                    styles.dayChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.input,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleDayToggle(day.dayIndex)}
                >
                  <Text
                    style={[
                      styles.dayChipText,
                      { color: selected ? colors.textInverse : colors.text },
                    ]}
                  >
                    {day.name.substring(0, 1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case RepetitionType.INTERVAL:
        return (
          <View style={styles.customDaysContainer}>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Repeat every</Text>
            <View
              style={[
                styles.customDaysInputContainer,
                {
                  backgroundColor: colors.input,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                style={[
                  styles.customDaysInput,
                  { color: colors.primary },
                ]}
                value={customDays.toString()}
                onChangeText={(text) => {
                  const value = Number.parseInt(text);
                  if (!Number.isNaN(value) && value > 0) {
                    setCustomDays(value);
                  }
                }}
                keyboardType="number-pad"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>days</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SCHEDULE</Text>
      <View
        style={[
          styles.surface,
          {
            backgroundColor: colors.surface,
          },
        ]}
      >
        <View style={styles.segmentedControlContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              repetitionType === RepetitionType.DAILY && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setRepetitionType(RepetitionType.DAILY)}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    repetitionType === RepetitionType.DAILY
                      ? colors.textInverse
                      : colors.textSecondary,
                },
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              styles.segmentMiddle,
              { borderLeftColor: colors.divider, borderRightColor: colors.divider },
              repetitionType === RepetitionType.WEEKDAYS && {
                backgroundColor: colors.primary,
                borderLeftColor: colors.primary,
                borderRightColor: colors.primary,
              },
            ]}
            onPress={() => setRepetitionType(RepetitionType.WEEKDAYS)}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    repetitionType === RepetitionType.WEEKDAYS
                      ? colors.textInverse
                      : colors.textSecondary,
                },
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              repetitionType === RepetitionType.INTERVAL && {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={() => setRepetitionType(RepetitionType.INTERVAL)}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    repetitionType === RepetitionType.INTERVAL
                      ? colors.textInverse
                      : colors.textSecondary,
                },
              ]}
            >
              Interval
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.optionsWrapper,
            { borderTopColor: colors.divider },
          ]}
        >
          {renderRepetitionOptions()}
        </View>
      </View>
    </View>
  );
};

export default RepetitionPatternSection;
