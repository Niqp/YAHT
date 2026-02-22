import { AppText, ScaleButton } from "@/components/ui";
import { Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

interface DiscardChangesSheetProps {
  isEditMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
}

export default function DiscardChangesSheet({ isEditMode, isOpen, onClose, onDiscard }: DiscardChangesSheetProps) {
  const { colors } = useTheme();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["32%"], []);

  useEffect(() => {
    if (isOpen) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [isOpen]);

  const renderBackdrop = useCallback(
    (backdropProps: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...backdropProps}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        style={[backdropProps.style, { backgroundColor: colors.overlay }]}
      />
    ),
    [colors.overlay]
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={[
        styles.background,
        {
          backgroundColor: colors.cardBackground,
        },
      ]}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.border }]}
    >
      <BottomSheetView style={styles.container}>
        <AppText variant="title" style={styles.title} color={colors.text}>
          Discard changes?
        </AppText>
        <AppText variant="body" style={styles.subtitle} color={colors.textSecondary}>
          {isEditMode ? "Your habit edits have not been saved yet." : "Your new habit has not been saved yet."}
        </AppText>

        <View style={styles.buttonContainer}>
          <ScaleButton label="Discard" variant="destructive" onPress={onDiscard} style={styles.button} />
          <ScaleButton label="Keep Editing" variant="secondary" onPress={onClose} style={styles.button} />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: Spacing.lg,
    borderTopRightRadius: Spacing.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
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
