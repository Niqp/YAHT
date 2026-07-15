import React, { memo, useCallback, useMemo } from "react";
import { Platform, StyleProp, StyleSheet, Text, TextStyle, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";

import { BorderRadius } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import BaseWheelPicker, {
  usePickerItemHeight,
  withVirtualized,
  type PickerItem,
  type RenderItemProps,
} from "@quidone/react-native-wheel-picker";

import { type WheelPickerProps } from "./WheelPicker.shared";

const VirtualizedBaseWheelPicker = withVirtualized(BaseWheelPicker);

// Above this size the Android wheel virtualizes so mount cost stays
// proportional to visible rows, not the full value range.
const VIRTUALIZATION_THRESHOLD = 48;
const VIRTUALIZED_LIST_PROPS = {
  initialNumToRender: 5,
  maxToRenderPerBatch: 8,
  windowSize: 7,
} as const;

const defaultFormatLabel = (value: number) => String(value);

function IOSWheelPicker({ values, formatLabel = defaultFormatLabel, value, onChange, style }: WheelPickerProps) {
  const { colors } = useTheme();

  const resolvedValue = useMemo(() => (values.includes(value) ? value : values[0]), [values, value]);

  const itemStyle = useMemo(
    () => ({
      color: colors.textPrimary,
      fontSize: 22,
    }),
    [colors.textPrimary]
  );

  return (
    <View style={style}>
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
        {values.map((itemValue) => (
          <Picker.Item key={itemValue} label={formatLabel(itemValue)} value={itemValue} color={colors.textPrimary} />
        ))}
      </Picker>
    </View>
  );
}

function LazyPickerItem({
  value,
  formatLabel,
  itemTextStyle,
}: {
  value: number;
  formatLabel: (value: number) => string;
  itemTextStyle: StyleProp<TextStyle>;
}) {
  const height = usePickerItemHeight();

  return <Text style={[styles.wheelItemText, { lineHeight: height }, itemTextStyle]}>{formatLabel(value)}</Text>;
}

function AndroidWebWheelPicker({
  values,
  formatLabel = defaultFormatLabel,
  value,
  onChange,
  style,
  itemHeight = 40,
  visibleItemCount = 3,
}: WheelPickerProps) {
  const { colors } = useTheme();

  const data = useMemo(() => values.map((itemValue) => ({ value: itemValue })), [values]);

  const renderItem = useCallback(
    ({ item, itemTextStyle }: RenderItemProps<PickerItem<number>>) => (
      <LazyPickerItem value={item.value} formatLabel={formatLabel} itemTextStyle={itemTextStyle} />
    ),
    [formatLabel]
  );

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
    onValueChanged: ({ item }: { item: PickerItem<number> }) => onChange(item.value),
    style,
    itemHeight,
    visibleItemCount,
    itemTextStyle,
    renderItem,
    renderOverlay,
    enableScrollByTapOnItem: true,
  } as const;

  if (values.length > VIRTUALIZATION_THRESHOLD) {
    return <VirtualizedBaseWheelPicker {...commonProps} {...VIRTUALIZED_LIST_PROPS} />;
  }

  return <BaseWheelPicker {...commonProps} />;
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
  wheelItemText: {
    textAlign: "center",
    fontSize: 20,
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
