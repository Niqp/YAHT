import { TimingConfig } from "@/constants/Animation";
import { useAllHabitsStreak } from "@/hooks/useAllHabitsStreak";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import {
  addDays,
  formatDate,
  getCurrentDateDayjs,
  getDay,
  getEpochMilliseconds,
  getMonthName,
  getShortDayName,
  getYear,
} from "@/utils/date";
import type { ConfigType as DayjsConfigType } from "dayjs";
import { ChevronLeft } from "lucide-react-native";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text, TouchableOpacity, useWindowDimensions, type LayoutChangeEvent, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
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
}

const ITEM_WIDTH = 57; // Width of each date item including margins
const ITEM_HEIGHT = 70;
const BUFFER_ITEMS = 15; // Number of items to load before/after visible range

// Memoize the DateItem component to prevent unnecessary re-renders
const DateItem = memo(({ item, isSelected, isToday, onPress }: DateItemProps) => {
  const { colors } = useTheme();
  const { date, dayName, dayNumber } = item;

  // Memoize the onPress callback for this specific date
  const handlePress = useCallback(() => {
    onPress(date);
  }, [date, onPress]);

  // Create styles with theme colors
  const containerStyle = [
    styles.dateItem,
    { backgroundColor: colors.input },
    isSelected && { backgroundColor: colors.primary },
    isToday &&
      !isSelected && {
        backgroundColor: colors.input,
        borderWidth: 2,
        borderColor: colors.accent,
      },
  ];

  const dayNameStyle = [
    styles.dayName,
    { color: colors.textSecondary },
    isSelected && { color: colors.textInverse },
    isToday && !isSelected && { color: colors.accent, fontWeight: "bold" as const },
  ];

  const dayNumberStyle = [
    styles.dayNumber,
    { color: colors.text },
    isSelected && { color: colors.textInverse },
    isToday && !isSelected && { color: colors.accent, fontWeight: "bold" as const },
  ];

  return (
    <TouchableOpacity style={containerStyle} onPress={handlePress}>
      <Text style={dayNameStyle}>{dayName}</Text>
      <Text style={dayNumberStyle}>{dayNumber}</Text>
    </TouchableOpacity>
  );
});

// Add display name to the memoized component
DateItem.displayName = "DateItem";

// Generate a range of dates
const generateDateRange = (startDate: DayjsConfigType, numDays: number): DateInfo[] => {
  const result: DateInfo[] = [];

  for (let i = 0; i < numDays; i++) {
    const date = addDays(startDate, i);
    const formattedDate = formatDate(date);

    result.push({
      date: formattedDate,
      dayName: getShortDayName(date),
      dayNumber: getDay(date),
      month: getMonthName(date),
      year: getYear(date),
      timestamp: getEpochMilliseconds(date),
    });
  }

  return result;
};

export default function DateSlider() {
  const { colors } = useTheme();
  const selectedDate = useHabitStore((state) => state.selectedDate);
  const setSelectedDate = useHabitStore((state) => state.setSelectedDate);
  const { width: viewportWidth } = useWindowDimensions();
  const recyclerListRef = useRef<React.ElementRef<typeof RecyclerListView> | null>(null);
  const initialScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRangeExtensionAtRef = useRef<string | null>(null);

  const [listWidth, setListWidth] = useState(() => Math.max(1, Math.round(viewportWidth)));
  const [today, setToday] = useState(() => formatDate(getCurrentDateDayjs()));
  const streak = useAllHabitsStreak();
  const reducedMotion = useReducedMotion();
  const visibleItems = useMemo(() => Math.ceil(listWidth / ITEM_WIDTH), [listWidth]);

  // Track whether the today pill is visible in the scroll viewport
  const [isTodayPillVisible, setIsTodayPillVisible] = useState(true);

  // Show Today button if selected date is not today OR the today pill scrolled out of view
  const showTodayButton = selectedDate !== today || !isTodayPillVisible;

  // Animated expand/collapse for the Today pill
  const todayPillAnim = useSharedValue(0);

  useEffect(() => {
    setListWidth(Math.max(1, Math.round(viewportWidth)));
  }, [viewportWidth]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentToday = formatDate(getCurrentDateDayjs());
      setToday((previousToday) => (previousToday === currentToday ? previousToday : currentToday));
    }, 60_000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (showTodayButton) {
      // Expand: spring for a natural "pop" feel
      todayPillAnim.value = reducedMotion ? 1 : withSpring(1, { damping: 18, stiffness: 200, mass: 0.8 });
    } else {
      // Collapse: timing ease-in for a quick tuck-away
      todayPillAnim.value = reducedMotion ? 0 : withTiming(0, TimingConfig.itemDismiss);
    }
  }, [showTodayButton, reducedMotion]);

  const todayPillStyle = useAnimatedStyle(() => ({
    maxWidth: todayPillAnim.value * 100,
    opacity: todayPillAnim.value,
    overflow: "hidden" as const,
  }));

  // State to track the visible month and year as user scrolls
  const [visibleMonthYear, setVisibleMonthYear] = useState("");

  // Initial date range centered on today
  const [dateRange, setDateRange] = useState<DateInfo[]>(() => {
    const todayDate = getCurrentDateDayjs();
    const pastDates = generateDateRange(addDays(todayDate, -180), 180);
    const futureDates = generateDateRange(todayDate, 365);
    return [...pastDates, ...futureDates];
  });

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
      />
    ),
    [selectedDate, today, setSelectedDate]
  );

  // Initialize scroll position to today and set initial visible month
  useEffect(() => {
    if (recyclerListRef.current && todayIndex >= 0) {
      initialScrollTimeoutRef.current = setTimeout(() => {
        recyclerListRef.current?.scrollToIndex(todayIndex, true);

        // Set initial visible month/year based on today
        if (dateRange[todayIndex]) {
          const { month, year } = dateRange[todayIndex];
          setVisibleMonthYear(`${month} ${year}`);
        }
      }, 100);
    }
    return () => {
      if (initialScrollTimeoutRef.current) {
        clearTimeout(initialScrollTimeoutRef.current);
        initialScrollTimeoutRef.current = null;
      }
    };
  }, [todayIndex]);

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
        const monthYearString = `${item.month} ${item.year}`;

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
          const newDates = generateDateRange(nextDay, BUFFER_ITEMS * 2);
          setDateRange((prevDates) => [...prevDates, ...newDates]);
        }
      }
    },
    [dateRange, todayIndex, visibleItems]
  );

  // Scroll to today when the Today button is pressed
  const scrollToToday = useCallback(() => {
    if (recyclerListRef.current && todayIndex >= 0) {
      recyclerListRef.current.scrollToIndex(todayIndex, true);
      setSelectedDate(today);
    }
  }, [todayIndex, today, setSelectedDate]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.monthText, { color: colors.primary }]}>{visibleMonthYear}</Text>
        <View style={styles.pillRow}>
          {/* Today button — animated expand/collapse */}
          <Animated.View style={todayPillStyle}>
            <TouchableOpacity
              style={[styles.todayButton, { backgroundColor: colors.primary }]}
              onPress={scrollToToday}
              accessibilityRole="button"
              accessibilityLabel="Go to today"
            >
              <ChevronLeft size={14} color={colors.textInverse} />
              <Text style={[styles.todayButtonText, { color: colors.textInverse }]}>Today</Text>
            </TouchableOpacity>
          </Animated.View>
          {/* Streak pill — always visible */}
          <View style={[styles.streakPill, { backgroundColor: colors.input }]}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={[styles.streakText, { color: colors.text }]}>{streak}</Text>
          </View>
        </View>
      </View>
      <View style={styles.recyclerContainer} onLayout={handleListLayout}>
        <RecyclerListView
          ref={recyclerListRef}
          style={styles.recyclerList}
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
      </View>
    </View>
  );
}
