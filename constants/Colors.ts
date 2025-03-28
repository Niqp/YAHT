/**
 * Comprehensive color system for the app, supporting both light and dark themes.
 */

// Primary application colors
const primaryLight = '#4A6572';
const primaryDark = '#6A8EAE';
const accentLight = '#4CAF50';
const accentDark = '#66BB6A';

export const Colors = {
  light: {
    // Core UI colors
    primary: primaryLight,
    accent: accentLight,
    background: '#FFFFFF',
    cardBackground: '#FFFFFF',
    surface: '#F8F9FA',
    
    // Text colors
    text: '#212121',
    textSecondary: '#757575',
    textTertiary: '#9E9E9E',
    textInverse: '#FFFFFF',
    
    // UI element colors
    border: '#E0E0E0',
    divider: '#F0F0F0',
    icon: '#687076',
    input: '#F5F5F5',
    error: '#F44336',
    success: '#4CAF50',
    
    // Tab navigation
    tabBackground: '#FFFFFF',
    tabIconDefault: '#B0BEC5',
    tabIconSelected: primaryLight,
    
    // Habit states
    habitBackground: '#F5F5F5',
    habitCompleted: '#F5F9F7',
    
    // Interactive elements
    buttonPrimary: primaryLight,
    buttonDisabled: '#BDBDBD',
    ripple: 'rgba(0, 0, 0, 0.1)',
    selectedItem: primaryLight,
    todayIndicator: accentLight,
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    // Core UI colors
    primary: primaryDark,
    accent: accentDark,
    background: '#121212',
    cardBackground: '#1E1E1E',
    surface: '#242424',
    
    // Text colors
    text: '#ECEDEE',
    textSecondary: '#B0B0B0',
    textTertiary: '#767676',
    textInverse: '#121212',
    
    // UI element colors
    border: '#383838',
    divider: '#2C2C2C',
    icon: '#9BA1A6',
    input: '#2C2C2C',
    error: '#F77B72',
    success: '#66BB6A',
    
    // Tab navigation
    tabBackground: '#1E1E1E',
    tabIconDefault: '#606060',
    tabIconSelected: primaryDark,
    
    // Habit states
    habitBackground: '#1E1E1E',
    habitCompleted: '#1E2922',
    
    // Interactive elements
    buttonPrimary: primaryDark,
    buttonDisabled: '#555555',
    ripple: 'rgba(255, 255, 255, 0.1)',
    selectedItem: primaryDark,
    todayIndicator: accentDark,
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
};

// Type definition for accessing colors
export type ColorTheme = typeof Colors.light;