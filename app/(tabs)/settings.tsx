import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Github, Star, Info, Download, Upload, ChevronRight, Calendar } from 'lucide-react-native';
import ThemeToggle from '../../components/ThemeToggle';
import { useTheme } from '../../hooks/useTheme';
import { exportData, importData } from '../../utils/fileOperations';
import { WeekStartDay } from '../../store/themeStore';

export default function SettingsScreen() {
  const { colors, weekStartDay, setWeekStartDay } = useTheme();

  const handleExport = async () => {
    try {
      await exportData();
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Export Failed', 'Failed to export data. Please try again.');
    }
  };

  const handleImport = async () => {
    try {
      await importData();
    } catch (error) {
      console.error('Error importing data:', error);
      // Alert is already shown in importData function
    }
  };

  const menuItems = [
    {
      title: 'About',
      icon: <Info size={24} color={colors.primary} />,
      onPress: () => {},
    },
    {
      title: 'Source Code',
      icon: <Github size={24} color={colors.primary} />,
      onPress: () => {},
    },
    {
      title: 'Rate App',
      icon: <Star size={24} color={colors.primary} />,
      onPress: () => {},
    },
    {
      title: 'Export Data',
      icon: <Download size={24} color={colors.primary} />,
      onPress: handleExport,
    },
    {
      title: 'Import Data',
      icon: <Upload size={24} color={colors.primary} />,
      onPress: handleImport,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={[styles.headerText, { color: colors.text }]}>Settings</Text>
        
        <ThemeToggle />

        {/* Week Settings Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Week Settings</Text>
          <View style={styles.weekSettingContainer}>
            <View style={styles.weekSettingHeader}>
              <Calendar size={22} color={colors.primary} />
              <Text style={[styles.weekSettingLabel, { color: colors.text }]}>
                First day of week
              </Text>
            </View>
            
            <View style={styles.weekDayOptions}>
              <TouchableOpacity
                style={[
                  styles.weekDayButton,
                  { backgroundColor: colors.input },
                  weekStartDay === 'sunday' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setWeekStartDay('sunday')}
              >
                <Text
                  style={[
                    styles.weekDayButtonText,
                    { color: colors.textSecondary },
                    weekStartDay === 'sunday' && { color: colors.textInverse }
                  ]}
                >
                  Sunday
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.weekDayButton,
                  { backgroundColor: colors.input },
                  weekStartDay === 'monday' && { backgroundColor: colors.primary }
                ]}
                onPress={() => setWeekStartDay('monday')}
              >
                <Text
                  style={[
                    styles.weekDayButtonText,
                    { color: colors.textSecondary },
                    weekStartDay === 'monday' && { color: colors.textInverse }
                  ]}
                >
                  Monday
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index < menuItems.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.divider,
                },
              ]}
              onPress={item.onPress}
            >
              <View style={styles.menuItemLeft}>
                {item.icon}
                <Text style={[styles.menuItemText, { color: colors.text }]}>
                  {item.title}
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Yet Another Habit Tracker
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
  },
  section: {
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 6,
  },
  weekSettingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  weekSettingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekSettingLabel: {
    fontSize: 16,
    marginLeft: 12,
  },
  weekDayOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  weekDayButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  weekDayButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});