import React, { useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import NativeSegmentedControl from "@react-native-segmented-control/segmented-control";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { getElevation } from "@/constants/Elevation";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";

import AppText from "./AppText";

interface AppSegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const ANDROID_BORDER_WIDTH = 1;
const ANDROID_INSET = 2;

export default function AppSegmentedControl({
  values,
  selectedIndex,
  onChange,
  disabled = false,
  style,
}: AppSegmentedControlProps) {
  const { colors } = useTheme();

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.iosMask, style]}>
        <NativeSegmentedControl
          values={values}
          selectedIndex={selectedIndex}
          onChange={(event) => onChange(event.nativeEvent.selectedSegmentIndex)}
          enabled={!disabled}
          tintColor={colors.buttonPrimaryBg}
          backgroundColor={colors.bgInset}
          fontStyle={{ color: colors.textSecondary, fontSize: 13, fontWeight: "600" }}
          activeFontStyle={{ color: colors.buttonPrimaryText, fontSize: 13, fontWeight: "600" }}
          sliderStyle={{
            boxShadow: "0px 0px 0px 0px transparent",
            elevation: 0,
            borderWidth: 0,
            backgroundColor: colors.buttonPrimaryBg,
          }}
          style={styles.iosControl}
        />
      </View>
    );
  }

  return (
    <AndroidSegmentedControl
      values={values}
      selectedIndex={selectedIndex}
      onChange={onChange}
      disabled={disabled}
      style={style}
    />
  );
}

function AndroidSegmentedControl({ values, selectedIndex, onChange, disabled, style }: AppSegmentedControlProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const thumbOffset = useSharedValue(0);
  const hasMeasuredRef = useRef(false);

  const segmentWidth = useMemo(() => {
    if (trackWidth <= 0 || values.length === 0) {
      return 0;
    }

    return trackWidth / values.length;
  }, [trackWidth, values.length]);

  useEffect(() => {
    if (segmentWidth <= 0) {
      return;
    }

    const nextOffset = segmentWidth * selectedIndex;

    if (!hasMeasuredRef.current || reducedMotion) {
      thumbOffset.value = nextOffset;
      hasMeasuredRef.current = true;
      return;
    }

    thumbOffset.value = withTiming(nextOffset, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [reducedMotion, segmentWidth, selectedIndex, thumbOffset]);

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setTrackWidth((currentWidth) => (currentWidth === nextWidth ? currentWidth : nextWidth));
  };

  const thumbStyle = useAnimatedStyle(() => ({
    opacity: segmentWidth > 0 ? 1 : 0,
    width: segmentWidth,
    transform: [{ translateX: thumbOffset.value }],
  }));

  return (
    <View
      style={[
        styles.androidContainer,
        {
          backgroundColor: colors.bgInset,
          borderColor: colors.inputBorder,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      accessibilityRole="tablist"
    >
      <View style={styles.androidTrack} onLayout={handleTrackLayout}>
        <Animated.View
          style={[
            styles.androidThumb,
            {
              pointerEvents: "none",
              backgroundColor: colors.buttonPrimaryBg,
              borderColor: colors.buttonPrimaryBg,
            },
            getElevation(1, colors.shadow),
            thumbStyle,
          ]}
        />

        {values.map((value, index) => {
          const isSelected = index === selectedIndex;

          return (
            <Pressable
              key={value}
              onPress={() => onChange(index)}
              disabled={disabled}
              android_ripple={{ color: colors.ripple, borderless: false }}
              accessibilityRole="button"
              accessibilityState={{ disabled, selected: isSelected }}
              style={({ pressed }) => [styles.segmentPressable, pressed ? styles.segmentPressed : null]}
            >
              <AppText
                variant="small"
                color={isSelected ? colors.buttonPrimaryText : colors.textSecondary}
                style={styles.segmentLabel}
              >
                {value}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  iosMask: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  iosControl: {
    width: "100%",
  },
  androidContainer: {
    flexDirection: "row",
    position: "relative",
    borderWidth: ANDROID_BORDER_WIDTH,
    borderRadius: BorderRadius.md,
    padding: ANDROID_INSET,
    overflow: "hidden",
  },
  androidTrack: {
    flex: 1,
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
  },
  androidThumb: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: BorderRadius.sm,
    borderWidth: ANDROID_BORDER_WIDTH,
  },
  segmentPressable: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  segmentPressed: {
    opacity: 0.82,
  },
  segmentLabel: {
    textAlign: "center",
    fontWeight: "700",
  },
});
