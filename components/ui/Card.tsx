import React from "react";
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Elevation } from "@/constants/Elevation";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import AppText from "./AppText";

type CardVariant = "card" | "surface";

interface CardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    contentStyle?: StyleProp<ViewStyle>;
    title?: string;
    subtitle?: string;
    headerRight?: React.ReactNode;
    footer?: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    variant?: CardVariant;
    elevation?: 0 | 1 | 2 | 3;
    bordered?: boolean;
    padding?: "default" | "none";
    accessibilityLabel?: string;
    accessibilityHint?: string;
}

export default function Card({
    children,
    style,
    contentStyle,
    title,
    subtitle,
    headerRight,
    footer,
    onPress,
    disabled = false,
    variant = "card",
    elevation = 1,
    bordered = true,
    padding = "default",
    accessibilityLabel,
    accessibilityHint,
}: CardProps) {
    const { colors } = useTheme();

    const backgroundColor = variant === "surface" ? colors.surface : colors.cardBackground;

    const shellStyle: ViewStyle = {
        backgroundColor,
        borderWidth: bordered ? 1 : 0,
        borderColor: bordered ? colors.border : "transparent",
        shadowColor: colors.shadow,
        ...Elevation[elevation],
    };

    const body = (
        <View style={[padding === "default" ? styles.defaultPadding : null, contentStyle]}>
            {(title || subtitle || headerRight) && (
                <View style={styles.headerRow}>
                    <View style={styles.headerTextBlock}>
                        {title ? <AppText variant="title">{title}</AppText> : null}
                        {subtitle ? (
                            <AppText variant="caption" color={colors.textSecondary} style={styles.subtitle}>
                                {subtitle}
                            </AppText>
                        ) : null}
                    </View>
                    {headerRight}
                </View>
            )}

            {children}

            {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={accessibilityHint}
                accessibilityState={{ disabled }}
                android_ripple={Platform.OS === "android" ? { color: colors.ripple, borderless: false } : undefined}
                style={({ pressed }) => [styles.shell, shellStyle, Platform.OS === "ios" && pressed ? styles.pressedIos : null, style]}
            >
                {body}
            </Pressable>
        );
    }

    return <View style={[styles.shell, shellStyle, style]}>{body}</View>;
}

const styles = StyleSheet.create({
    shell: {
        borderRadius: BorderRadius.md,
        overflow: "hidden",
        minHeight: 44,
    },
    defaultPadding: {
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.lg,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: Spacing.md,
    },
    headerTextBlock: {
        flex: 1,
    },
    subtitle: {
        marginTop: Spacing.xs,
    },
    footer: {
        marginTop: Spacing.md,
    },
    pressedIos: {
        opacity: 0.84,
    },
});

