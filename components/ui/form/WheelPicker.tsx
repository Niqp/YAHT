import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { InteractionManager, Platform, StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn } from "react-native-reanimated";

import { BorderRadius } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import BaseWheelPicker, { withVirtualized } from "@quidone/react-native-wheel-picker";

import { type WheelPickerItem, type WheelPickerProps } from "./WheelPicker.shared";

const VirtualizedBaseWheelPicker = withVirtualized(BaseWheelPicker);

function IOSWheelPicker({ data, value, onChange, style, animateMount = true }: WheelPickerProps) {
  const { colors } = useTheme();

  const resolvedValue = useMemo(() => {
    if (data.some((item) => item.value === value)) {
      return value;
    }

    return data[0]?.value;
  }, [data, value]);

  const itemStyle = useMemo(
    () => ({
      color: colors.textPrimary,
      fontSize: 22,
    }),
    [colors.textPrimary]
  );

  const content = (
    <Picker
      selectedValue={resolvedValue}
      onValueChange={(nextValue) => {
        const resolvedNextValue = typeof nextValue === "number" ? nextValue : Number(nextValue);
        onChange(Number.isFinite(resolvedNextValue) ? resolvedNextValue : (resolvedValue ?? value));
      }}
      itemStyle={itemStyle}
      selectionColor={colors.pickerSelectionBg}
      style={styles.iosPicker}
    >
      {data.map((item) => (
        <Picker.Item
          key={`${item.value}-${item.label}`}
          label={item.label}
          value={item.value}
          color={colors.textPrimary}
        />
      ))}
    </Picker>
  );

  if (animateMount) {
    return (
      <Animated.View entering={FadeIn.duration(200)} style={style}>
        {content}
      </Animated.View>
    );
  }

  return <View style={style}>{content}</View>;
}

function AndroidWebWheelPicker({
  data,
  value,
  onChange,
  style,
  itemHeight = 40,
  visibleItemCount = 3,
  virtualized = false,
  initialNumToRender,
  maxToRenderPerBatch,
  windowSize,
  updateCellsBatchingPeriod,
  animateMount = true,
}: WheelPickerProps) {
  const { colors } = useTheme();
  const [isReady, setIsReady] = useState(!animateMount);

  useEffect(() => {
    if (animateMount) {
      let task: ReturnType<typeof InteractionManager.runAfterInteractions> | null = null;
      const timeoutId = setTimeout(() => {
        task = InteractionManager.runAfterInteractions(() => {
          setIsReady(true);
        });
      }, 350);

      return () => {
        clearTimeout(timeoutId);
        task?.cancel();
      };
    } else {
      setIsReady(true);
    }
  }, [animateMount]);
  const renderOverlay = useCallback(
    ({ itemHeight }: { itemHeight: number }) => (
      <View pointerEvents="none" style={styles.selectionOverlayContainer}>
        <LinearGradient
          colors={["rgba(0,0,0,0)", colors.pickerSelectionBg, colors.pickerSelectionBg, "rgba(0,0,0,0)"] as const}
          locations={[0, 0.3, 0.7, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.selectionOverlay, { height: itemHeight }]}
        />
      </View>
    ),
    [colors.pickerSelectionBg]
  );
  const itemTextStyle = useMemo(() => ({ color: colors.textPrimary, fontSize: 18 }), [colors.textPrimary]);
  const commonProps = {
    data,
    value,
    onValueChanged: ({ item }: { item: WheelPickerItem }) => onChange(item.value),
    style,
    itemHeight,
    visibleItemCount,
    itemTextStyle,
    renderOverlay,
    enableScrollByTapOnItem: true,
  } as const;

  let content;
  if (virtualized) {
    content = (
      <VirtualizedBaseWheelPicker
        {...commonProps}
        initialNumToRender={initialNumToRender}
        maxToRenderPerBatch={maxToRenderPerBatch}
        windowSize={windowSize}
        updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      />
    );
  } else {
    content = <BaseWheelPicker {...commonProps} />;
  }

  if (animateMount) {
    if (isReady) {
      return (
        <Animated.View entering={FadeIn.duration(200)} style={style}>
          {content}
        </Animated.View>
      );
    } else {
      return <View style={style} />;
    }
  }

  return content;
}

function WheelPicker(props: WheelPickerProps) {
  if (Platform.OS === "ios") {
    return <IOSWheelPicker {...props} />;
  }

  return <AndroidWebWheelPicker {...props} />;
}

export default memo(WheelPicker);

const styles = StyleSheet.create({
  iosPicker: {
    width: "100%",
    height: "100%",
  },
  selectionOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  selectionOverlay: {
    width: "100%",
    borderRadius: BorderRadius.sm,
  },
});
