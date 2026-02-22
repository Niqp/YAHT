import { Clock3 } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";
import NumberStepperInput from "./NumberStepperInput";

interface DurationInputProps {
    label: string;
    valueMs: number;
    onChangeMs: (valueMs: number) => void;
    minMs?: number;
    maxMs?: number;
}

const DEFAULT_PRESETS_MS = [5, 10, 15, 30, 60, 90].map((m) => m * 60 * 1000);

const formatDuration = (valueMs: number) => {
    const totalMinutes = Math.max(1, Math.floor(valueMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }

    return `${minutes}m`;
};

export default function DurationInput({
    label,
    valueMs,
    onChangeMs,
    minMs = 60000,
    maxMs = 7200000,
}: DurationInputProps) {
    const { colors } = useTheme();

    const totalMinutes = Math.max(1, Math.floor(valueMs / 60000));
    const minMinutes = Math.max(1, Math.floor(minMs / 60000));
    const maxMinutes = Math.max(minMinutes, Math.floor(maxMs / 60000));

    return (
        <View style={styles.container}>
            <View style={styles.headingRow}>
                <Clock3 size={18} color={colors.primary} strokeWidth={2} />
                <AppText variant="label" color={colors.textSecondary} style={styles.headingText}>
                    {label}
                </AppText>
            </View>

            <View style={[styles.displayCard, { backgroundColor: colors.input, borderColor: colors.inputBorder }]}>
                <AppText variant="title" tabularNums>
                    {formatDuration(valueMs)}
                </AppText>
            </View>

            <NumberStepperInput
                label="Duration (minutes)"
                value={totalMinutes}
                onChange={(minutes) => onChangeMs(minutes * 60000)}
                min={minMinutes}
                max={maxMinutes}
                presets={DEFAULT_PRESETS_MS.map((ms) => Math.floor(ms / 60000)).filter((m) => m >= minMinutes && m <= maxMinutes)}
            />
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
        minHeight: 56,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: Spacing.md,
    },
});

