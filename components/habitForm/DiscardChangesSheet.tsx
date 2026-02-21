import { AppBottomSheet, AppText, ScaleButton } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import BottomSheet from "@gorhom/bottom-sheet";
import React, { forwardRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";

interface DiscardChangesSheetProps {
    isEditMode: boolean;
    onDiscard: () => void;
    onKeepEditing: () => void;
}

const DiscardChangesSheet = forwardRef<BottomSheet, DiscardChangesSheetProps>(
    ({ isEditMode, onDiscard, onKeepEditing }, ref) => {
        const { colors } = useTheme();

        const handleSheetChanges = useCallback(
            (index: number) => {
                if (index === -1) {
                    // Sheet closed via backdrop tap or swipe down
                    onKeepEditing();
                }
            },
            [onKeepEditing]
        );

        return (
            <AppBottomSheet ref={ref} snapPoints={["32%"]} onChange={handleSheetChanges}>
                <View style={styles.container}>
                    <AppText variant="title" style={styles.title} color={colors.text}>
                        Discard changes?
                    </AppText>
                    <AppText variant="body" style={styles.subtitle} color={colors.textSecondary}>
                        {isEditMode
                            ? "Your habit edits have not been saved yet."
                            : "Your new habit has not been saved yet."}
                    </AppText>

                    <View style={styles.buttonContainer}>
                        <ScaleButton
                            label="Discard"
                            variant="destructive"
                            onPress={onDiscard}
                            style={styles.button}
                        />
                        <ScaleButton
                            label="Keep Editing"
                            variant="secondary"
                            onPress={onKeepEditing}
                            style={styles.button}
                        />
                    </View>
                </View>
            </AppBottomSheet>
        );
    }
);

DiscardChangesSheet.displayName = "DiscardChangesSheet";

const styles = StyleSheet.create({
    container: {
        padding: Spacing.xl,
        flex: 1,
    },
    title: {
        marginBottom: Spacing.sm,
        textAlign: "center",
    },
    subtitle: {
        marginBottom: Spacing.xxl,
        textAlign: "center",
    },
    buttonContainer: {
        gap: Spacing.md,
    },
    button: {
        width: "100%",
    },
});

export default DiscardChangesSheet;
