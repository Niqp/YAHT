import { Clock3 } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";
import { DatePicker } from "@quidone/react-native-wheel-picker";

interface DurationInputProps {
  label: string;
  valueMs: number;
  onChangeMs: (valueMs: number) => void;
}
export default function DurationInput({ label, valueMs, onChangeMs }: DurationInputProps) {
  const { colors } = useTheme();

  const hours = Math.floor(valueMs / 3600000);
  const minutes = Math.floor((valueMs % 3600000) / 60000);
  const dummyDateStr = `1970-01-01T${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00.000Z`;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Clock3 size={18} color={colors.primary} strokeWidth={2} />
        <AppText variant="label" color={colors.textSecondary} style={styles.headingText}>
          {label}
        </AppText>
      </View>

      <View style={[styles.displayCard, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
        <DatePicker
          date={dummyDateStr}
          onDateChanged={({ date }: { date: string }) => {
            const newDate = new Date(date);
            const newHours = newDate.getUTCHours();
            const newMinutes = newDate.getUTCMinutes();
            // Store goal in milliseconds
            onChangeMs((newHours * 60 + newMinutes) * 60000);
          }}
          itemHeight={40}
          itemTextStyle={{ color: colors.text, fontSize: 18 }}
          overlayItemStyle={{ backgroundColor: colors.primarySubtle, borderRadius: BorderRadius.md }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  headingText: {
    marginLeft: Spacing.sm,
  },
  displayCard: {
    height: 150,
    width: "100%",
    minHeight: 56,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
