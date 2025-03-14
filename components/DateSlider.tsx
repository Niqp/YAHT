import React, {
	useState,
	useRef,
	useEffect,
	useMemo,
	useCallback,
	memo,
} from "react";
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	Dimensions,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
} from "react-native";
import { useHabitStore } from "../store/habitStore";
import {
	formatDate,
	getShortDayName,
	addDays,
	getMonthName,
} from "../utils/date";
import { useTheme } from "../hooks/useTheme";
import { ChevronLeft } from "lucide-react-native";

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
const DateItem = memo(
	({ item, isSelected, isToday, onPress }: DateItemProps) => {
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
			isToday &&
				!isSelected && { color: colors.todayIndicator, fontWeight: "bold" },
		];

		const dayNumberStyle = [
			styles.dayNumber,
			{ color: colors.text },
			isSelected && { color: colors.textInverse },
			isToday &&
				!isSelected && { color: colors.todayIndicator, fontWeight: "bold" },
		];

		return (
			<TouchableOpacity style={containerStyle} onPress={handlePress}>
				<Text style={dayNameStyle}>{dayName}</Text>
				<Text style={dayNumberStyle}>{dayNumber}</Text>
			</TouchableOpacity>
		);
	},
);

// Generate a range of dates
const generateDateRange = (startDate: Date, numDays: number): DateInfo[] => {
	const result: DateInfo[] = [];

	for (let i = 0; i < numDays; i++) {
		const date = addDays(startDate, i);
		const formattedDate = formatDate(date);

		result.push({
			date: formattedDate,
			dayName: getShortDayName(date),
			dayNumber: date.getDate(),
			month: getMonthName(date),
			year: date.getFullYear(),
			timestamp: date.getTime(),
		});
	}

	return result;
};

// Implement getItemLayout for FlatList to improve performance
const getItemLayout = (_data: any, index: number) => ({
	length: ITEM_WIDTH,
	offset: ITEM_WIDTH * index,
	index,
});

export default function DateSlider() {
	const { colors } = useTheme();
	const { selectedDate, setSelectedDate } = useHabitStore();
	const flatListRef = useRef<FlatList>(null);
	const today = useMemo(() => formatDate(new Date()), []);
	const [showTodayButton, setShowTodayButton] = useState(false);

	// State to track the visible month and year as user scrolls
	const [visibleMonthYear, setVisibleMonthYear] = useState("");

	// Initial date range centered on today
	const [dateRange, setDateRange] = useState<DateInfo[]>(() => {
		const todayDate = new Date();
		const pastDates = generateDateRange(addDays(todayDate, -180), 180);
		const futureDates = generateDateRange(todayDate, 365);
		return [...pastDates, ...futureDates];
	});

	// Find index of today in the date range
	const todayIndex = useMemo(() => {
		return dateRange.findIndex((item) => item.date === today);
	}, [dateRange, today]);

	// Initialize scroll position to today and set initial visible month
	useEffect(() => {
		if (flatListRef.current && todayIndex >= 0) {
			setTimeout(() => {
				flatListRef.current?.scrollToIndex({
					index: todayIndex,
					animated: false,
					viewPosition: 0.5,
				});

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
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const offsetX = event.nativeEvent.contentOffset.x;
			const centerIndex =
				Math.floor(offsetX / ITEM_WIDTH) + Math.floor(VISIBLE_ITEMS / 2);

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
				const nextDay = new Date(lastDate.date);
				nextDay.setDate(nextDay.getDate() + 1);
				const newDates = generateDateRange(nextDay, BUFFER_ITEMS * 2);
				setDateRange((prevDates) => [...prevDates, ...newDates]);
			}
		},
		[dateRange, today, todayIndex, visibleMonthYear],
	);

	// Scroll to today when the Today button is pressed
	const scrollToToday = useCallback(() => {
		if (flatListRef.current && todayIndex >= 0) {
			flatListRef.current.scrollToIndex({
				index: todayIndex,
				animated: true,
				viewPosition: 0.5,
			});
			setSelectedDate(today);
		}
	}, [todayIndex, today, setSelectedDate]);

	// Memoize the renderItem function
	const renderItem = useCallback(
		({ item }: { item: DateInfo }) => (
			<DateItem
				item={item}
				isSelected={item.date === selectedDate}
				isToday={item.date === today}
				onPress={setSelectedDate}
			/>
		),
		[selectedDate, today, setSelectedDate],
	);

	// Memoize the keyExtractor function
	const keyExtractor = useCallback((item: DateInfo) => item.date, []);

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
				<Text style={[styles.monthText, { color: colors.primary }]}>
					{visibleMonthYear}
				</Text>
				{showTodayButton && (
					<TouchableOpacity
						style={[styles.todayButton, { backgroundColor: colors.primary }]}
						onPress={scrollToToday}
					>
						<ChevronLeft size={14} color={colors.textInverse} />
						<Text
							style={[styles.todayButtonText, { color: colors.textInverse }]}
						>
							Today
						</Text>
					</TouchableOpacity>
				)}
			</View>
			<FlatList
				ref={flatListRef}
				horizontal
				showsHorizontalScrollIndicator={false}
				data={dateRange}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				getItemLayout={getItemLayout}
				contentContainerStyle={styles.flatListContent}
				initialNumToRender={VISIBLE_ITEMS + BUFFER_ITEMS}
				maxToRenderPerBatch={BUFFER_ITEMS}
				windowSize={VISIBLE_ITEMS}
				onScroll={handleScroll}
				onScrollToIndexFailed={() => {
					// If scroll to index fails, try again with a delay
					setTimeout(() => {
						if (flatListRef.current && todayIndex >= 0) {
							flatListRef.current.scrollToIndex({
								index: Math.max(0, todayIndex),
								animated: false,
								viewPosition: 0.5,
							});
						}
					}, 500);
				}}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		paddingVertical: 10,
		borderBottomWidth: 1,
	},
	headerContainer: {
		height: 40,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: 15,
		marginBottom: 10,
	},
	monthText: {
		fontSize: 16,
		fontWeight: "600",
	},
	todayButton: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 16,
	},
	todayButtonText: {
		fontSize: 12,
		fontWeight: "600",
		marginLeft: 2,
	},
	flatListContent: {
		paddingHorizontal: 10,
	},
	dateItem: {
		alignItems: "center",
		justifyContent: "center",
		marginHorizontal: 6,
		width: 45,
		height: 70,
		borderRadius: 22.5,
	},
	dayName: {
		fontSize: 12,
		marginBottom: 4,
	},
	dayNumber: {
		fontSize: 16,
		fontWeight: "bold",
	},
});
