import React from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";

interface SelectionPillProps {
    label: string;
    selected: boolean;
    onPress: () => void;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}

export default function SelectionPill({
    label,
    selected,
    onPress,
    disabled = false,
    style,
    accessibilityLabel,
}: SelectionPillProps) {
    const { colors } = useTheme();

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ selected, disabled }}
            android_ripple={{ color: colors.ripple, borderless: false }}
            style={({ pressed }) => [
                styles.pill,
                {
                    backgroundColor: selected ? colors.primary : colors.input,
                    borderColor: selected ? colors.primary : colors.inputBorder,
                },
                pressed && !selected ? { backgroundColor: colors.surface } : null,
                style,
            ]}
        >
            <AppText variant="label" color={selected ? colors.textInverse : colors.textSecondary}>
                {label}
            </AppText>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pill: {
        minHeight: 40,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});

