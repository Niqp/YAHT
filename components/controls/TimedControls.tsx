import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Clock } from "lucide-react-native";
import { useTheme } from "../../hooks/useTheme";
import { getElevation } from "@/constants/Elevation";
import { translate, useTranslation } from "@/i18n";

import styles from "./TimedControls.styles";

interface IOSTimerPickerProps {
  value: number; // in milliseconds
  onChange: (value: number) => void;
  min?: number; // in milliseconds
  max?: number; // in milliseconds
  label?: string;
}

// Constants for picker
const ITEM_HEIGHT = 50;

// Generate an array of numbers with leading zeros
const generateTimeValues = (count: number, padZero = true) => {
  return Array.from({ length: count }, (_, i) => (padZero ? i.toString().padStart(2, "0") : i.toString()));
};

export default function IOSTimerPicker({
  value,
  onChange,
  min: _min = 60000, // 1 minute minimum (in ms)
  max: _max = 86400000, // 24 hours maximum (in ms)
  label = translate("form.targetTime"),
}: IOSTimerPickerProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Calculate hours, minutes from milliseconds
  const totalSeconds = Math.floor(value / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const [hours, setHours] = useState(Math.floor(totalMinutes / 60));
  const [minutes, setMinutes] = useState(totalMinutes % 60);

  // Available values for picker
  const hourOptions = generateTimeValues(24, false);
  const minuteOptions = generateTimeValues(60);

  // Show picker state
  const [showPicker, setShowPicker] = useState(false);

  // ScrollView refs
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Common time presets in milliseconds for quick selection
  const presets = [
    { label: "5m", value: 5 * 60 * 1000 },
    { label: "10m", value: 10 * 60 * 1000 },
    { label: "15m", value: 15 * 60 * 1000 },
    { label: "30m", value: 30 * 60 * 1000 },
    { label: "1h", value: 60 * 60 * 1000 },
    { label: "2h", value: 120 * 60 * 1000 },
    { label: "3h", value: 180 * 60 * 1000 },
    { label: "4h", value: 240 * 60 * 1000 },
  ];

  // Update hours and minutes when value changes
  useEffect(() => {
    const totalSeconds = Math.floor(value / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    setHours(Math.floor(totalMinutes / 60));
    setMinutes(totalMinutes % 60);
  }, [value]);

  // Format time for display
  const formatDisplayTime = () => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Handle hour scrolling end
  const handleHourScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);

    if (index >= 0 && index < hourOptions.length) {
      // Snap to exact position for better UX
      hourScrollRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });

      // Only update if value changed
      if (index !== hours) {
        setHours(index);
        // Keep minutes the same
        const newValue = index * 60 * 60 * 1000 + minutes * 60 * 1000;
        onChange(newValue);
      }
    }
  };

  // Handle minute scrolling end
  const handleMinuteScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);

    if (index >= 0 && index < minuteOptions.length) {
      // Snap to exact position for better UX
      minuteScrollRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });

      // Only update if value changed
      if (index !== minutes) {
        setMinutes(index);
        // Keep hours the same
        const newValue = hours * 60 * 60 * 1000 + index * 60 * 1000;
        onChange(newValue);
      }
    }
  };

  // Handle item press
  const handleItemPress = (type: "hour" | "minute", index: number) => {
    if (type === "hour") {
      hourScrollRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });

      if (index !== hours) {
        setHours(index);
        // Only update hours, keep current minutes
        const newValue = index * 60 * 60 * 1000 + minutes * 60 * 1000;
        onChange(newValue);
      }
    } else {
      minuteScrollRef.current?.scrollTo({
        y: index * ITEM_HEIGHT,
        animated: true,
      });

      if (index !== minutes) {
        setMinutes(index);
        // Only update minutes, keep current hours
        const newValue = hours * 60 * 60 * 1000 + index * 60 * 1000;
        onChange(newValue);
      }
    }
  };

  // Scroll to selected values when picker is shown
  useEffect(() => {
    if (showPicker) {
      // Add a slight delay to ensure the ScrollView is ready
      setTimeout(() => {
        if (hourScrollRef.current) {
          hourScrollRef.current.scrollTo({
            y: hours * ITEM_HEIGHT,
            animated: false,
          });
        }

        if (minuteScrollRef.current) {
          minuteScrollRef.current.scrollTo({
            y: minutes * ITEM_HEIGHT,
            animated: false,
          });
        }
      }, 100);
    }
  }, [showPicker, hours, minutes]);

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Clock size={18} color={colors.accent} />
        <Text style={[styles.label, styles.headingLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>

      {/* Time display - tap to show/hide picker */}
      <TouchableOpacity
        style={[
          styles.timeDisplay,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
          },
        ]}
        onPress={() => setShowPicker(!showPicker)}
        activeOpacity={0.7}
      >
        <Text style={[styles.timeDisplayText, { color: colors.textPrimary }]}>{formatDisplayTime()}</Text>
        <Text style={[styles.timeHintText, { color: colors.textSecondary }]}>
          {showPicker ? t("form.tapToHidePicker") : t("form.tapToShowPicker")}
        </Text>
      </TouchableOpacity>

      {/* iOS-style time picker */}
      {showPicker && (
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: colors.bgInset,
              borderColor: colors.inputBorder,
            },
            getElevation(1, colors.shadow),
          ]}
        >
          <View style={styles.pickerControls}>
            {/* Hours */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>{t("form.hour")}</Text>

              <View style={styles.pickerHighlightContainer}>
                {/* Center highlight */}
                <View style={[styles.pickerHighlight, { backgroundColor: colors.accentSoftBg }]} />

                <ScrollView
                  ref={hourScrollRef}
                  style={styles.pickerScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerScrollContent}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="normal"
                  onMomentumScrollEnd={handleHourScrollEnd}
                  nestedScrollEnabled={true}
                >
                  {hourOptions.map((hour, index) => (
                    <TouchableOpacity
                      key={`hour-${hour}`}
                      style={[styles.pickerItem, { height: ITEM_HEIGHT }]}
                      onPress={() => handleItemPress("hour", index)}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.textPrimary }]}>{hour}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Separator */}
            <Text style={[styles.pickerSeparator, { color: colors.textPrimary }]}>:</Text>

            {/* Minutes */}
            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>{t("form.minute")}</Text>

              <View style={styles.pickerHighlightContainer}>
                {/* Center highlight */}
                <View style={[styles.pickerHighlight, { backgroundColor: colors.accentSoftBg }]} />

                <ScrollView
                  ref={minuteScrollRef}
                  style={styles.pickerScrollView}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pickerScrollContent}
                  snapToInterval={ITEM_HEIGHT}
                  decelerationRate="normal"
                  onMomentumScrollEnd={handleMinuteScrollEnd}
                  nestedScrollEnabled={true}
                >
                  {minuteOptions.map((minute, index) => (
                    <TouchableOpacity
                      key={`minute-${minute}`}
                      style={[styles.pickerItem, { height: ITEM_HEIGHT }]}
                      onPress={() => handleItemPress("minute", index)}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.textPrimary }]}>{minute}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>

          {/* Done button */}
          <Pressable
            style={[styles.doneButton, { backgroundColor: colors.buttonPrimaryBg }]}
            onPress={() => setShowPicker(false)}
          >
            <Text style={[styles.doneButtonText, { color: colors.buttonPrimaryText }]}>{t("common.done")}</Text>
          </Pressable>
        </View>
      )}

      {/* Time presets for quick selection */}
      <View style={styles.presetsContainer}>
        <Text style={[styles.presetsLabel, { color: colors.textSecondary }]}>{t("form.quickSet")}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetButtonsScroll}
          nestedScrollEnabled={true}
        >
          {presets.map((preset) => (
            <TouchableOpacity
              key={preset.value}
              style={[
                styles.presetButton,
                {
                  backgroundColor: value === preset.value ? colors.chipSelectedBg : colors.chipBg,
                  borderColor: value === preset.value ? colors.chipSelectedBorder : colors.chipBorder,
                },
              ]}
              onPress={() => onChange(preset.value)}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  {
                    color: value === preset.value ? colors.chipSelectedText : colors.chipText,
                  },
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
