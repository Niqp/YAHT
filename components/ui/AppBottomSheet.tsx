/**
 * YAHT Design System — AppBottomSheet Component
 *
 * Pre-configured wrapper around @gorhom/bottom-sheet that bakes in
 * the guideline defaults from UI_UX_GUIDELINES.md §9.4:
 *  - Top corners: radius-xl (24)
 *  - Handle: 40×4, radius-full, border color
 *  - Background: cardBackground
 *  - Backdrop: overlay color
 *  - Max height: 70% of screen
 *  - Elevation: elevation-2
 */
import React, { forwardRef, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  type BottomSheetProps,
} from "@gorhom/bottom-sheet";
import { BorderRadius } from "@/constants/Spacing";
import { Elevation } from "@/constants/Elevation";
import { useTheme } from "@/hooks/useTheme";

interface AppBottomSheetProps extends Omit<BottomSheetProps, "backgroundStyle" | "handleIndicatorStyle"> {
  children: React.ReactNode;
}

/**
 * A bottom sheet pre-configured with YAHT design system defaults.
 * Pass `snapPoints` to control height. Use `ref` to control open/close.
 *
 * @example
 * const sheetRef = useRef<BottomSheet>(null);
 *
 * <AppBottomSheet ref={sheetRef} snapPoints={["50%", "70%"]} index={-1}>
 *   <View style={{ padding: Spacing.base }}>
 *     <AppText variant="title">Sheet Content</AppText>
 *   </View>
 * </AppBottomSheet>
 */
const AppBottomSheet = forwardRef<BottomSheet, AppBottomSheetProps>(({ children, ...props }, ref) => {
  const { colors } = useTheme();

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
    <BottomSheet
      ref={ref}
      index={-1}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={[
        styles.background,
        {
          backgroundColor: colors.cardBackground,
          ...Elevation[2],
          shadowColor: colors.shadow,
        },
      ]}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.border }]}
      {...props}
    >
      {children}
    </BottomSheet>
  );
});

AppBottomSheet.displayName = "AppBottomSheet";

export default AppBottomSheet;

const styles = StyleSheet.create({
  background: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.full,
  },
});
