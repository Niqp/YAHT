import { useAllHabitsStreak } from "@/hooks/useAllHabitsStreak";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import { Spacing } from "@/constants/Spacing";
import {
  addDays,
  formatDate,
  getCurrentDateDayjs,
  getDay,
  getEpochMilliseconds,
  getLocalizedMonthYear,
  getLocalizedShortDayName,
  getYear,
} from "@/utils/date";
import { isSupportedLocale } from "@/i18n/locale";
import { useTranslation } from "@/i18n";
import { useIsFocused } from "@react-navigation/native";
import type { ConfigType as DayjsConfigType } from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  type AppStateStatus,
  type LayoutChangeEvent,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DataProvider, LayoutProvider, RecyclerListView } from "recyclerlistview";
import styles from "./DateSlider.styles";

interface DateInfo {
  date: string;
  dayName: string;
  dayNumber: number;
  month: string;
  year: number;
  timestamp: number;
}

interface DateItemProps {
  item: DateInfo;
  isSelected: boolean;
  isToday: boolean;
  onPress: (date: string) => void;
  selectDateLabel: string;
}

const ITEM_WIDTH = 57; // Width of each date item including margins
const ITEM_HEIGHT = 70;
const BUFFER_ITEMS = 15; // Number of items to load before/after visible range
const TODAY_PILL_HEIGHT = 28;
const TODAY_PILL_ICON_WIDTH = TODAY_PILL_HEIGHT;
const TODAY_PILL_TEXT_END_PADDING = Spacing.sm;
const TODAY_PILL_MIN_WIDTH = 64;
const TODAY_PILL_GAP = Spacing.sm;
const TODAY_PILL_SHOW_DURATION = 260;
const TODAY_PILL_HIDE_DURATION = 200;
const TODAY_PILL_ESTIMATED_CHAR_WIDTH = 7;

const getTodayPillWidth = (labelWidth: number) =>
  Math.max(TODAY_PILL_MIN_WIDTH, TODAY_PILL_ICON_WIDTH + Math.ceil(labelWidth) + TODAY_PILL_TEXT_END_PADDING);

const estimateTodayLabelWidth = (label: string) => label.length * TODAY_PILL_ESTIMATED_CHAR_WIDTH;

// Memoize the DateItem component to prevent unnecessary re-renders
const DateItem = memo(({ item, isSelected, isToday, onPress, selectDateLabel }: DateItemProps) => {
  const { colors } = useTheme();
  const { date, dayName, dayNumber } = item;

  // Memoize the activation callback for this specific date
  const handleActivate = useCallback(() => {
    onPress(date);
  }, [date, onPress]);

  // Create styles with theme colors
  const containerStyle = [
    styles.dateItem,
    { backgroundColor: colors.bgSurfaceElevated, borderColor: colors.borderDefault },
    isSelected && {
      backgroundColor: colors.buttonPrimaryBg,
      borderColor: colors.buttonPrimaryBg,
    },
    isToday &&
      !isSelected && {
        backgroundColor: colors.accentSoftBg,
        borderColor: colors.accentSoftBorder,
      },
  ];

  const dayNameStyle = [
    styles.dayName,
    { color: colors.textSecondary },
    isSelected && { color: colors.buttonPrimaryText, fontWeight: "bold" as const },
    isToday && !isSelected && { color: colors.accent, fontWeight: "bold" as const },
  ];

  const dayNumberStyle = [
    styles.dayNumber,
    { color: colors.textPrimary },
    isSelected && { color: colors.buttonPrimaryText, fontWeight: "bold" as const },
    isToday && !isSelected && { color: colors.accent, fontWeight: "bold" as const },
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={handleActivate}
      onAccessibilityTap={handleActivate}
      accessibilityRole="button"
      accessibilityLabel={selectDateLabel}
      testID={`date-item-${date}`}
    >
      <Text style={dayNameStyle}>{dayName}</Text>
      <Text style={dayNumberStyle}>{dayNumber}</Text>
    </TouchableOpacity>
  );
});

// Add display name to the memoized component
DateItem.displayName = "DateItem";

// Generate a range of dates
const generateDateRange = (startDate: DayjsConfigType, numDays: number, locale: string): DateInfo[] => {
  const result: DateInfo[] = [];
  const supportedLocale = isSupportedLocale(locale) ? locale : "en";

  for (let i = 0; i < numDays; i++) {
    const date = addDays(startDate, i);
    const formattedDate = formatDate(date);

    result.push({
      date: formattedDate,
      dayName: getLocalizedShortDayName(date, supportedLocale),
      dayNumber: getDay(date),
      month: getLocalizedMonthYear(date, supportedLocale),
      year: getYear(date),
      timestamp: getEpochMilliseconds(date),
    });
  }

  return result;
};

export default function DateSlider() {
  const { colors } = useTheme();
  const { i18n, t } = useTranslation();
  const isFocused = useIsFocused();
  const locale = isSupportedLocale(i18n.language) ? i18n.language : "en";
  const selectedDate = useHabitStore((state) => state.selectedDate);
  const setSelectedDate = useHabitStore((state) => state.setSelectedDate);
  const { width: viewportWidth } = useWindowDimensions();
  const recyclerListRef = useRef<React.ElementRef<typeof RecyclerListView> | null>(null);
  const initialScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRangeExtensionAtRef = useRef<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const [listWidth, setListWidth] = useState(() => Math.max(1, Math.round(viewportWidth)));
  const [today, setToday] = useState(() => formatDate(getCurrentDateDayjs()));
  const streak = useAllHabitsStreak();
  const reducedMotion = useReducedMotion();
  const visibleItems = useMemo(() => Math.ceil(listWidth / ITEM_WIDTH), [listWidth]);
  const todayLabel = t("date.today");
  const [measuredTodayLabel, setMeasuredTodayLabel] = useState({ label: "", width: 0 });

  // Track whether the today pill is visible in the scroll viewport
  const [isTodayPillVisible, setIsTodayPillVisible] = useState(true);

  // Show Today button if selected date is not today OR the today pill scrolled out of view
  const showTodayButton = selectedDate !== today || !isTodayPillVisible;

  // Single progress value drives the whole Today pill transition.
  const todayPillProgress = useSharedValue(0);
  const todayLabelWidth =
    measuredTodayLabel.label === todayLabel && measuredTodayLabel.width > 0
      ? measuredTodayLabel.width
      : estimateTodayLabelWidth(todayLabel);
  const todayPillExpandedWidth = getTodayPillWidth(todayLabelWidth);

  useEffect(() => {
    setListWidth(Math.max(1, Math.round(viewportWidth)));
  }, [viewportWidth]);

  const syncTodayState = useCallback(() => {
    const currentToday = formatDate(getCurrentDateDayjs());
    setToday((previousToday) => (previousToday === currentToday ? previousToday : currentToday));

    const currentSelectedDate = useHabitStore.getState().selectedDate;
    if (currentToday > currentSelectedDate) {
      setSelectedDate(currentToday);
    }
  }, [setSelectedDate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentToday = formatDate(getCurrentDateDayjs());
      setToday((previousToday) => (previousToday === currentToday ? previousToday : currentToday));
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isFocused) {
      syncTodayState();
    }
  }, [isFocused, syncTodayState]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      const previousAppState = appStateRef.current;
      appStateRef.current = nextAppState;

      const wasBackgrounded = previousAppState === "background" || previousAppState === "inactive";
      if (wasBackgrounded && nextAppState === "active") {
        syncTodayState();
      }
    });

    return () => subscription.remove();
  }, [syncTodayState]);

  useEffect(() => {
    cancelAnimation(todayPillProgress);

    if (showTodayButton) {
      if (reducedMotion) {
        todayPillProgress.value = 1;
        return;
      }

      todayPillProgress.value = withTiming(1, {
        duration: TODAY_PILL_SHOW_DURATION,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
      });
    } else {
      if (reducedMotion) {
        todayPillProgress.value = 0;
        return;
      }

      todayPillProgress.value = withTiming(0, {
        duration: TODAY_PILL_HIDE_DURATION,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      });
    }
  }, [reducedMotion, showTodayButton, todayPillProgress]);

  const todayPillStyle = useAnimatedStyle(() => ({
    width: interpolate(todayPillProgress.value, [0, 0.3, 1], [0, TODAY_PILL_HEIGHT, todayPillExpandedWidth]),
    height: TODAY_PILL_HEIGHT,
    opacity: interpolate(todayPillProgress.value, [0, 0.12, 1], [0, 1, 1]),
    marginRight: interpolate(todayPillProgress.value, [0, 1], [0, TODAY_PILL_GAP]),
  }));

  const todayTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(todayPillProgress.value, [0, 0.55, 0.8, 1], [0, 0, 0.85, 1]),
    transform: [{ translateX: interpolate(todayPillProgress.value, [0, 0.55, 1], [-6, -6, 0]) }],
  }));

  // State to track the visible month and year as user scrolls
  const [visibleMonthYear, setVisibleMonthYear] = useState(() => getLocalizedMonthYear(getCurrentDateDayjs(), locale));

  // Initial date range centered on today
  const [dateRange, setDateRange] = useState<DateInfo[]>(() => {
    const todayDate = getCurrentDateDayjs();
    const pastDates = generateDateRange(addDays(todayDate, -180), 180, locale);
    const futureDates = generateDateRange(todayDate, 365, locale);
    return [...pastDates, ...futureDates];
  });

  useEffect(() => {
    const todayDate = getCurrentDateDayjs();
    const pastDates = generateDateRange(addDays(todayDate, -180), 180, locale);
    const futureDates = generateDateRange(todayDate, 365, locale);
    setDateRange([...pastDates, ...futureDates]);
    setVisibleMonthYear(getLocalizedMonthYear(todayDate, locale));
  }, [locale]);

  // Find index of today in the date range
  const todayIndex = useMemo(() => {
    return dateRange.findIndex((item) => item.date === today);
  }, [dateRange, today]);

  // Create data provider
  const dataProvider = useMemo(() => {
    return new DataProvider((r1, r2) => {
      return r1.date !== r2.date;
    }).cloneWithRows(dateRange);
  }, [dateRange]);

  const extendedState = useMemo(() => ({ selectedDate, today }), [selectedDate, today]);

  // Create layout provider
  const layoutProvider = useMemo(() => {
    return new LayoutProvider(
      () => 0, // Only one type of layout
      (_, dim) => {
        dim.width = ITEM_WIDTH;
        dim.height = ITEM_HEIGHT;
      }
    );
  }, []);

  // Row renderer (replaces renderItem)
  const rowRenderer = useCallback(
    (_type: string | number, item: DateInfo) => (
      <DateItem
        item={item}
        isSelected={item.date === selectedDate}
        isToday={item.date === today}
        onPress={setSelectedDate}
        selectDateLabel={t("date.selectDate", { date: item.date })}
      />
    ),
    [selectedDate, today, setSelectedDate, t]
  );

  // Initialize scroll position to today and set initial visible month
  useEffect(() => {
    if (!isFocused) {
      return;
    }

    if (recyclerListRef.current && todayIndex >= 0) {
      initialScrollTimeoutRef.current = setTimeout(() => {
        recyclerListRef.current?.scrollToIndex(todayIndex, true);
      }, 100);
    }
    return () => {
      if (initialScrollTimeoutRef.current) {
        clearTimeout(initialScrollTimeoutRef.current);
        initialScrollTimeoutRef.current = null;
      }
    };
  }, [isFocused, todayIndex]);

  const handleListLayout = useCallback((event: LayoutChangeEvent) => {
    const measuredWidth = Math.max(1, Math.round(event.nativeEvent.layout.width));
    setListWidth((currentWidth) => (currentWidth === measuredWidth ? currentWidth : measuredWidth));
  }, []);

  // Handle scrolling, track visible month/year, and decide whether today pill is visible
  const handleScroll = useCallback(
    (_rawEvent: unknown, offsetX: number, _offsetY: number) => {
      // Determine the range of visible item indices
      const firstVisibleIndex = Math.max(0, Math.floor(offsetX / ITEM_WIDTH));
      const lastVisibleIndex = firstVisibleIndex + visibleItems;

      // Check if the today index falls within the visible range
      const todayIsVisible = todayIndex >= firstVisibleIndex && todayIndex <= lastVisibleIndex;
      setIsTodayPillVisible((currentValue) => (currentValue === todayIsVisible ? currentValue : todayIsVisible));

      // Track visible month/year from first visible item
      if (dateRange[firstVisibleIndex]) {
        const item = dateRange[firstVisibleIndex];
        const monthYearString = item.month;

        // Only update if changed
        setVisibleMonthYear((currentValue) => (currentValue === monthYearString ? currentValue : monthYearString));
      }

      // Dynamically extend the date range if we're nearing the end
      const centerIndex = firstVisibleIndex + Math.floor(visibleItems / 2);
      const remainingItems = dateRange.length - centerIndex;
      if (remainingItems < BUFFER_ITEMS * 2) {
        const lastDate = dateRange[dateRange.length - 1];
        if (lastDate && lastRangeExtensionAtRef.current !== lastDate.date) {
          lastRangeExtensionAtRef.current = lastDate.date;
          const nextDay = addDays(lastDate.date, 1);
          const newDates = generateDateRange(nextDay, BUFFER_ITEMS * 2, locale);
          setDateRange((prevDates) => [...prevDates, ...newDates]);
        }
      }
    },
    [dateRange, locale, todayIndex, visibleItems]
  );

  // Scroll to today when the Today button is pressed
  const scrollToToday = useCallback(() => {
    if (recyclerListRef.current && todayIndex >= 0) {
      recyclerListRef.current.scrollToIndex(todayIndex, true);
      setSelectedDate(today);
    }
  }, [todayIndex, today, setSelectedDate]);

  const handleTodayLabelLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const measuredWidth = Math.ceil(event.nativeEvent.layout.width);
      setMeasuredTodayLabel((currentValue) =>
        currentValue.label === todayLabel && currentValue.width === measuredWidth
          ? currentValue
          : { label: todayLabel, width: measuredWidth }
      );
    },
    [todayLabel]
  );

  return (
    <LinearGradient
      colors={[colors.gradientHeaderStart, colors.gradientHeaderMid, colors.gradientHeaderEnd] as const}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.monthText, { color: colors.textOnStrong }]}>{visibleMonthYear}</Text>
        <View style={styles.pillRow}>
          {/* Today button — animated expand/collapse */}
          <Animated.View
            testID="date-slider-today-button-container"
            pointerEvents={showTodayButton ? "auto" : "none"}
            style={[styles.todayButtonContainer, todayPillStyle]}
          >
            <TouchableOpacity
              testID="date-slider-today-button"
              style={[styles.todayButton, { width: todayPillExpandedWidth, backgroundColor: colors.buttonPrimaryBg }]}
              onPress={scrollToToday}
              accessibilityRole="button"
              accessibilityLabel={t("date.goToToday")}
            >
              <View style={styles.todayButtonIcon}>
                <ChevronLeft size={14} color={colors.buttonPrimaryText} />
              </View>
              <Animated.View style={todayTextStyle}>
                <Text
                  testID="date-slider-today-label"
                  style={[styles.todayButtonText, { color: colors.buttonPrimaryText }]}
                  numberOfLines={1}
                  onLayout={handleTodayLabelLayout}
                >
                  {todayLabel}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
          {/* Streak pill — always visible */}
          <View
            style={[styles.streakPill, { backgroundColor: colors.accentSoftBg, borderColor: colors.accentSoftBorder }]}
          >
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.streakText, { color: colors.textPrimary }]}>{streak}</Text>
          </View>
        </View>
      </View>
      <View testID="date-slider-recycler-container" style={styles.recyclerContainer} onLayout={handleListLayout}>
        {listWidth > 1 ? (
          <RecyclerListView
            ref={recyclerListRef}
            style={[styles.recyclerList, { width: listWidth }]}
            canChangeSize={true}
            isHorizontal={true}
            dataProvider={dataProvider}
            layoutProvider={layoutProvider}
            rowRenderer={rowRenderer}
            initialRenderIndex={todayIndex}
            renderAheadOffset={BUFFER_ITEMS * ITEM_WIDTH}
            onScroll={handleScroll}
            scrollViewProps={{
              contentContainerStyle: styles.flatListContent,
              showsHorizontalScrollIndicator: false,
              showsVerticalScrollIndicator: false,
            }}
            extendedState={extendedState}
            scrollThrottle={16}
            layoutSize={{
              width: listWidth,
              height: ITEM_HEIGHT,
            }}
            onEndReachedThreshold={BUFFER_ITEMS}
          />
        ) : null}
      </View>
    </LinearGradient>
  );
}
