import React from "react";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Bug, ChevronRight, Code2, Download, Trash2, Upload } from "lucide-react-native";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppSegmentedControl, AppText } from "@/components/ui";
import type { ColorThemeName } from "@/constants/Colors";
import { BorderRadius, Spacing } from "@/constants/Spacing";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/i18n";
import { useHabitStore } from "@/store/habitStore";
import type { ThemeMode, TimedHabitGoalBehavior, WeekStartDay } from "@/store/themeStore";
import { exportData, importData } from "@/utils/fileOperations";

const APP_VERSION = Constants.expoConfig?.version;
const REPOSITORY_URL = "https://github.com/Niqp/YAHT";

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    colors,
    colorTheme,
    isDarkMode,
    mode,
    setColorTheme,
    setMode,
    setTimedHabitGoalBehavior,
    setWeekStartDay,
    timedHabitGoalBehavior,
    weekStartDay,
  } = useTheme();
  const resetStore = useHabitStore((state) => state.resetStore);
  const themeRenderKey = `${colorTheme}-${mode}-${isDarkMode ? "dark" : "light"}`;
  const appVersion = APP_VERSION ?? t("common.unknown");

  const themeModeOptions: { label: string; value: ThemeMode }[] = [
    { label: t("settings.light"), value: "light" },
    { label: t("settings.dark"), value: "dark" },
    { label: t("settings.system"), value: "system" },
  ];

  const colorThemeOptions: { label: string; value: ColorThemeName }[] = [
    { label: t("settings.sepia"), value: "sepia" },
    { label: t("settings.clear"), value: "clear" },
    { label: t("settings.oled"), value: "oled" },
  ];

  const weekStartOptions: { label: string; value: WeekStartDay }[] = [
    { label: t("settings.sunday"), value: 0 },
    { label: t("settings.monday"), value: 1 },
  ];

  const timedGoalOptions: { label: string; value: TimedHabitGoalBehavior }[] = [
    { label: t("settings.allowOverGoal"), value: "continue" },
    { label: t("settings.stopAtGoal"), value: "stop" },
  ];

  const handleExport = async () => {
    try {
      await exportData();
    } catch (error) {
      console.error("Error exporting data:", error);
      Alert.alert(t("fileOperations.exportFailedTitle"), t("fileOperations.exportFailedBody"));
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
      Alert.alert(t("settings.unableToOpenLinkTitle"), t("settings.unableToOpenLinkBody"));
    }
  };

  const handleOpenReminderDebugLogs = () => {
    router.push({ pathname: "/debug-reminder", params: { inspect: "1" } });
  };

  const handleReset = () => {
    Alert.alert(
      t("settings.resetDataTitle"),
      t("settings.resetDataBody"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("common.reset"),
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
    <View style={[styles.container, { backgroundColor: colors.bgApp }]}>
      <ScrollView
        key={themeRenderKey}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <AppText variant="heading">{t("settings.title")}</AppText>
            <AppText variant="body" color={colors.textSecondary}>
              {t("settings.description")}
            </AppText>
          </View>
        </View>

        <SettingsSection title={t("settings.appearance")}>
          <SegmentedSettingRow
            title={t("settings.interfaceMode")}
            values={themeModeOptions.map((option) => option.label)}
            selectedIndex={themeModeOptions.findIndex((option) => option.value === mode)}
            onChange={(index) => setMode(themeModeOptions[index].value)}
          />
          <SectionDivider />
          <SegmentedSettingRow
            title={t("settings.colorPalette")}
            values={colorThemeOptions.map((option) => option.label)}
            selectedIndex={colorThemeOptions.findIndex((option) => option.value === colorTheme)}
            onChange={(index) => setColorTheme(colorThemeOptions[index].value)}
          />
        </SettingsSection>

        <SettingsSection title={t("settings.behaviour")}>
          <SegmentedSettingRow
            title={t("settings.firstDayOfWeek")}
            values={weekStartOptions.map((option) => option.label)}
            selectedIndex={weekStartOptions.findIndex((option) => option.value === weekStartDay)}
            onChange={(index) => setWeekStartDay(weekStartOptions[index].value)}
          />
          <SegmentedSettingRow
            title={t("settings.timedHabits")}
            description={t("settings.timedHabitsDescription")}
            values={timedGoalOptions.map((option) => option.label)}
            selectedIndex={timedGoalOptions.findIndex((option) => option.value === timedHabitGoalBehavior)}
            onChange={(index) => setTimedHabitGoalBehavior(timedGoalOptions[index].value)}
          />
        </SettingsSection>

        <SettingsSection title={t("settings.localData")}>
          <ActionRow
            icon={<Download size={18} color={colors.iconPrimary} />}
            title={t("settings.exportData")}
            description={t("settings.exportDataDescription")}
            onPress={handleExport}
          />
          <SectionDivider />
          <ActionRow
            icon={<Upload size={18} color={colors.iconPrimary} />}
            title={t("settings.importData")}
            description={t("settings.importDataDescription")}
            onPress={handleImport}
          />
          <SectionDivider />
          <ActionRow
            icon={<Trash2 size={18} color={colors.danger} />}
            title={t("settings.resetAllData")}
            description={t("settings.resetAllDataDescription")}
            onPress={handleReset}
            destructive
          />
        </SettingsSection>

        <SettingsSection title={t("settings.about")}>
          <StaticRow title={t("settings.version")} value={`v${appVersion}`} />
          <SectionDivider />
          <ActionRow
            icon={<Bug size={18} color={colors.iconPrimary} />}
            title={t("settings.reminderDebugLogs")}
            description={t("settings.reminderDebugLogsDescription")}
            onPress={handleOpenReminderDebugLogs}
          />
          <SectionDivider />
          <ActionRow
            icon={<Code2 size={18} color={colors.iconPrimary} />}
            title={t("settings.sourceCode")}
            description={t("settings.sourceCodeDescription")}
            onPress={handleOpenRepository}
          />
        </SettingsSection>
      </ScrollView>
    </View>
  );
}

function SectionDivider() {
  const { colors } = useTheme();

  return <View style={[styles.sectionDivider, { backgroundColor: colors.borderSubtle }]} />;
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
      <View style={[styles.sectionCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderDefault }]}>
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
        <AppText variant="bodyMedium" color={destructive ? colors.danger : colors.textPrimary}>
          {title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {description}
        </AppText>
      </View>

      <ChevronRight size={18} color={destructive ? colors.danger : colors.textSecondary} />
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
