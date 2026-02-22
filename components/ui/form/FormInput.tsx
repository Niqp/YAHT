import React from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { BorderRadius, Spacing } from "@/constants/Spacing";
import { Typography } from "@/constants/Typography";
import { useTheme } from "@/hooks/useTheme";

import AppText from "../AppText";

interface FormInputProps extends Omit<TextInputProps, "style"> {
    label: string;
    hideLabel?: boolean;
    containerStyle?: TextInputProps["style"];
}

export default function FormInput({ label, hideLabel = false, containerStyle, ...inputProps }: FormInputProps) {
    const { colors } = useTheme();

    return (
        <View style={styles.container}>
            {!hideLabel ? (
                <AppText variant="label" color={colors.textSecondary} style={styles.label}>
                    {label}
                </AppText>
            ) : null}
            <TextInput
                {...inputProps}
                style={[
                    styles.input,
                    {
                        backgroundColor: colors.input,
                        borderColor: colors.inputBorder,
                        color: colors.text,
                    },
                    containerStyle,
                ]}
                placeholderTextColor={colors.textTertiary}
                selectionColor={colors.primary}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },
    label: {
        marginBottom: Spacing.xs,
    },
    input: {
        ...Typography.body,
        height: 48,
        borderWidth: 1,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.md,
    },
});


