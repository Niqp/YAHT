import React from "react";
import Constants from "expo-constants";
import { ChevronRight, Code2, Download, Trash2, Upload } from "lucide-react-native";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppSegmentedControl, AppText } from "@/components/ui";
import type { ColorThemeName } from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useHabitStore } from "@/store/habitStore";
import type { ThemeMode, WeekStartDay } from "@/store/themeStore";
import { exportData, importData } from "@/utils/fileOperations";

const APP_VERSION = Constants.expoConfig?.version ?? "Unknown";
const REPOSITORY_URL = "https://github.com/Niqp/YAHT";

const THEME_MODE_OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
];

const COLOR_THEME_OPTIONS: { label: string; value: ColorThemeName }[] = [
  { label: "Sepia", value: "sepia" },
  { label: "Clear", value: "clear" },
  { label: "OLED", value: "oled" },
];

const WEEK_START_OPTIONS: { label: string; value: WeekStartDay }[] = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
];

export default function SettingsScreen() {
  const { colors, colorTheme, isDarkMode, mode, setColorTheme, setMode, setWeekStartDay, weekStartDay } = useTheme();
  const resetStore = useHabitStore((state) => state.resetStore);
  const themeRenderKey = `${colorTheme}-${mode}-${isDarkMode ? "dark" : "light"}`;

  const handleExport = async () => {
    try {
      await exportData();
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert("Export Failed", "Failed to export data. Please try again.");
    }
  };

  const handleImport = async () => {
    try {
      await importData();
    } catch (error) {
      console.error("Error importing data:", error);
    }
  };

  const handleOpenRepository = async () => {
    try {
      await Linking.openURL(REPOSITORY_URL);
    } catch (error) {
      console.error("Error opening repository:", error);
      Alert.alert("Unable to Open Link", "The GitHub repository could not be opened on this device.");
    }
  };

  const handleReset = () => {
    Alert.alert(
      "Reset Data",
      "This will delete all your data. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            useHabitStore.persist.clearStorage();
            resetStore();
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        key={themeRenderKey}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="heading">Settings</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              Theme, calendar behavior and the data stored on this device.
            </AppText>
          </View>
        </View>

        <SettingsSection title="Appearance">
          <SegmentedSettingRow
            title="Interface mode"
            values={THEME_MODE_OPTIONS.map((option) => option.label)}
            selectedIndex={THEME_MODE_OPTIONS.findIndex((option) => option.value === mode)}
            onChange={(index) => setMode(THEME_MODE_OPTIONS[index].value)}
          />
          <SectionDivider />
          <SegmentedSettingRow
            title="Color palette"
            values={COLOR_THEME_OPTIONS.map((option) => option.label)}
            selectedIndex={COLOR_THEME_OPTIONS.findIndex((option) => option.value === colorTheme)}
            onChange={(index) => setColorTheme(COLOR_THEME_OPTIONS[index].value)}
          />
        </SettingsSection>

        <SettingsSection title="Calendar">
          <SegmentedSettingRow
            title="First day of week"
            values={WEEK_START_OPTIONS.map((option) => option.label)}
            selectedIndex={WEEK_START_OPTIONS.findIndex((option) => option.value === weekStartDay)}
            onChange={(index) => setWeekStartDay(WEEK_START_OPTIONS[index].value)}
          />
        </SettingsSection>

        <SettingsSection title="Local data">
          <ActionRow
            icon={<Download size={18} color={colors.icon} />}
            title="Export data"
            description="Create a JSON backup that you can share or keep."
            onPress={handleExport}
          />
          <SectionDivider />
          <ActionRow
            icon={<Upload size={18} color={colors.icon} />}
            title="Import data"
            description="Replace current habits with the contents of a backup file."
            onPress={handleImport}
          />
          <SectionDivider />
          <ActionRow
            icon={<Trash2 size={18} color={colors.error} />}
            title="Reset all data"
            description="Delete habits, timers and saved progress from this device."
            onPress={handleReset}
            destructive
          />
        </SettingsSection>

        <SettingsSection title="About">
          <StaticRow title="Version" value={`v${APP_VERSION}`} />
          <SectionDivider />
          <ActionRow
            icon={<Code2 size={18} color={colors.icon} />}
            title="Source code"
            description="Open the public GitHub repository."
            onPress={handleOpenRepository}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

function SectionDivider() {
  const { colors } = useTheme();

  return <View style={[styles.sectionDivider, { backgroundColor: colors.divider }]} />;
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <AppText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        {title}
      </AppText>
      <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
}

interface SegmentedSettingRowProps {
  title: string;
  description?: string;
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
}

function SegmentedSettingRow({ title, description, values, selectedIndex, onChange }: SegmentedSettingRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <AppText variant="bodyMedium">{title}</AppText>
        {description ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {description}
          </AppText>
        ) : null}
      </View>

      <AppSegmentedControl values={values} selectedIndex={selectedIndex} onChange={onChange} />
    </View>
  );
}

interface StaticRowProps {
  title: string;
  value: string;
}

function StaticRow({ title, value }: StaticRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.staticRow}>
      <AppText variant="bodyMedium">{title}</AppText>
      <AppText variant="caption" color={colors.textSecondary} style={styles.staticValue}>
        {value}
      </AppText>
    </View>
  );
}

interface ActionRowProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress: () => void;
  destructive?: boolean;
}

function ActionRow({ icon, title, description, onPress, destructive = false }: ActionRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      android_ripple={Platform.OS === "android" ? { color: colors.ripple, borderless: false } : undefined}
      style={({ pressed }) => [styles.actionRow, pressed && Platform.OS === "ios" ? styles.actionRowPressed : null]}
    >
      <View style={styles.actionIcon}>{icon}</View>

      <View style={styles.actionCopy}>
        <AppText variant="bodyMedium" color={destructive ? colors.error : colors.text}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {description}
        </AppText>
      </View>

      <ChevronRight size={18} color={destructive ? colors.error : colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    gap: Spacing.xl,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.xs,
  },
  sectionCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: Spacing.base,
  },
  settingRow: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  settingCopy: {
    gap: Spacing.xs,
  },
  staticRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    minHeight: 60,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  staticValue: {
    flexShrink: 1,
    textAlign: "right",
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: 68,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  actionRowPressed: {
    opacity: 0.72,
  },
  actionIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 20,
  },
  actionCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
});
