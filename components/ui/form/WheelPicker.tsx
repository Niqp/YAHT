import React, { memo, useEffect, useMemo, useState } from "react";
import { InteractionManager, Platform, StyleSheet, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
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
      color: colors.text,
      fontSize: 22,
    }),
    [colors.text]
  );

  const content = (
    <Picker
      selectedValue={resolvedValue}
      onValueChange={(nextValue) => {
        const resolvedNextValue = typeof nextValue === "number" ? nextValue : Number(nextValue);
        onChange(Number.isFinite(resolvedNextValue) ? resolvedNextValue : (resolvedValue ?? value));
      }}
      itemStyle={itemStyle}
      selectionColor={colors.primary}
      style={styles.iosPicker}
    >
      {data.map((item) => (
        <Picker.Item key={`${item.value}-${item.label}`} label={item.label} value={item.value} color={colors.text} />
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
  const overlayItemStyle = useMemo(
    () => ({ backgroundColor: colors.primarySubtle, borderRadius: BorderRadius.md }),
    [colors.primarySubtle]
  );
  const itemTextStyle = useMemo(() => ({ color: colors.text, fontSize: 18 }), [colors.text]);
  const commonProps = {
    data,
    value,
    onValueChanged: ({ item }: { item: WheelPickerItem }) => onChange(item.value),
    style,
    itemHeight,
    visibleItemCount,
    itemTextStyle,
    overlayItemStyle,
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
});
