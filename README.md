# YAHT - Yet Another Habit Tracker

A modern, feature-rich habit tracking app built with React Native and Expo.

## Features

- Create and track both repetition-based and timer-based habits
- Customizable week start day
- Dark and light theme support
- View detailed statistics of your habits
- Import/export data functionality
- Built with performance and usability in mind

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the development server

   ```bash
   npm start
   ```

   Or run directly on a specific platform:

   ```bash
   # For Android
   npm run android

   # For iOS
   npm run ios
   ```

3. Run a clean build if needed:

   ```bash
   npm run cleanRun
   ```

## Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run in web browser
- `npm run cleanPrebuild` - Clean the prebuild files
- `npm run cleanRun` - Clean and run on Android
- `npm run prod` - Build a production release for Android

## Development

This project uses:

- [Expo](https://expo.dev) with [Expo Router](https://docs.expo.dev/router/introduction) for file-based routing
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Dayjs](https://day.js.org/) for date handling
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) for animations
- [Bottom Sheet](https://github.com/gorhom/react-native-bottom-sheet) for interactive UI components
- [React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit) for statistics visualization

## Contribute

Feel free to open issues or submit pull requests on GitHub.

## License

[GNU GPL License](COPYING)
