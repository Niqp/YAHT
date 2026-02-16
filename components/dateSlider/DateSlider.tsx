import { ChevronLeft } from "lucide-react-native";
import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import type { ConfigType as DayjsConfigType } from "dayjs";
import { useTheme } from "../../hooks/useTheme";
import { useHabitStore } from "../../store/habitStore";
import styles from "./DateSlider.styles";
import { addDays, formatDate, getMonthName, getShortDayName, getDay, getYear, getEpochMilliseconds, getCurrentDateDayjs } from "../../utils/date";
import { RecyclerListView, DataProvider, LayoutProvider } from "recyclerlistview";

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

const windowWidth = Dimensions.get("window").width;
const ITEM_WIDTH = 57; // Width of each date item including margins
const VISIBLE_ITEMS = Math.ceil(windowWidth / ITEM_WIDTH);
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
    isSelected && { backgroundColor: colors.selectedItem },
    isToday &&
      !isSelected && {
        backgroundColor: colors.input,
        borderWidth: 2,
        borderColor: colors.todayIndicator,
      },
  ];

  const dayNameStyle = [
    styles.dayName,
    { color: colors.textSecondary },
    isSelected && { color: colors.textInverse },
    isToday && !isSelected && { color: colors.todayIndicator, fontWeight: "bold" as const },
  ];

  const dayNumberStyle = [
    styles.dayNumber,
    { color: colors.text },
    isSelected && { color: colors.textInverse },
    isToday && !isSelected && { color: colors.todayIndicator, fontWeight: "bold" as const },
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
  const { selectedDate, setSelectedDate } = useHabitStore();
  const recyclerListRef = useRef<RecyclerListView<any, any>>(null);
  const today = useMemo(() => formatDate(getCurrentDateDayjs()), []);
  const [showTodayButton, setShowTodayButton] = useState(false);

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

  // Create layout provider
  const layoutProvider = useMemo(() => {
    return new LayoutProvider(
      () => 0, // Only one type of layout
      (_, dim) => {
        dim.width = ITEM_WIDTH;
        dim.height = 70; // Adjust based on your date item height
      }
    );
  }, []);

  // Row renderer (replaces renderItem)
  const rowRenderer = useCallback(
    (type: any, item: DateInfo) => (
      <DateItem item={item} isSelected={item.date === selectedDate} isToday={item.date === today} onPress={setSelectedDate} />
    ),
    [selectedDate, today, setSelectedDate]
  );

  // Initialize scroll position to today and set initial visible month
  useEffect(() => {
    if (recyclerListRef.current && todayIndex >= 0) {
      setTimeout(() => {
        recyclerListRef.current?.scrollToIndex(todayIndex, true);

        // Set initial visible month/year based on today
        if (dateRange[todayIndex]) {
          const { month, year } = dateRange[todayIndex];
          setVisibleMonthYear(`${month} ${year}`);
        }
      }, 100);
    }
  }, [todayIndex, dateRange]);

  // Handle scrolling, track visible month/year, and decide whether to show the Today button
  const handleScroll = useCallback(
    (_rawEvent: any, offsetX: number, _offsetY: number) => {
      const centerIndex = Math.floor(offsetX / ITEM_WIDTH) + Math.floor(VISIBLE_ITEMS / 2);

      const centerDate = dateRange[centerIndex]?.date;
      setShowTodayButton(centerDate !== today && todayIndex >= 0);

      // Find the first visible item
      const firstVisibleIndex = Math.floor(offsetX / ITEM_WIDTH);
      if (dateRange[firstVisibleIndex]) {
        const item = dateRange[firstVisibleIndex];
        const monthYearString = `${item.month} ${item.year}`;

        // Only update if changed
        if (monthYearString !== visibleMonthYear) {
          setVisibleMonthYear(monthYearString);
        }
      }

      // Dynamically extend the date range if we're nearing the end
      const remainingItems = dateRange.length - centerIndex;
      if (remainingItems < BUFFER_ITEMS * 2) {
        const lastDate = dateRange[dateRange.length - 1];
        const nextDay = addDays(lastDate.date, 1);
        const newDates = generateDateRange(nextDay, BUFFER_ITEMS * 2);
        setDateRange((prevDates) => [...prevDates, ...newDates]);
      }
    },
    [dateRange, today, todayIndex, visibleMonthYear]
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
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.divider,
        },
      ]}
    >
      <View style={styles.headerContainer}>
        <Text style={[styles.monthText, { color: colors.primary }]}>{visibleMonthYear}</Text>
        {showTodayButton && (
          <TouchableOpacity style={[styles.todayButton, { backgroundColor: colors.primary }]} onPress={scrollToToday}>
            <ChevronLeft size={14} color={colors.textInverse} />
            <Text style={[styles.todayButtonText, { color: colors.textInverse }]}>Today</Text>
          </TouchableOpacity>
        )}
      </View>
      <RecyclerListView
        ref={recyclerListRef}
        isHorizontal={true}
        showsHorizontalScrollIndicator={false}
        dataProvider={dataProvider}
        layoutProvider={layoutProvider}
        rowRenderer={rowRenderer}
        initialRenderIndex={todayIndex}
        renderAheadOffset={BUFFER_ITEMS * ITEM_WIDTH}
        onScroll={handleScroll}
        scrollViewProps={{
          contentContainerStyle: styles.flatListContent,
        }}
        onMomentumScrollEnd={() => {
          // Optional: handle momentum scroll ending
        }}
        extendedState={{ selectedDate, today }}
        scrollThrottle={16}
        renderAheadStep={BUFFER_ITEMS}
        layoutSize={{
          width: windowWidth,
          height: 70, // Adjust to match your item height
        }}
        onEndReached={() => {
          // Alternative approach to extending the list
          // This gets called when the user scrolls near the end
        }}
        onEndReachedThreshold={BUFFER_ITEMS}
      />
    </View>
  );
}
