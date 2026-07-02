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
- `npm run build:android:debug` - Prebuild and assemble a debug Android APK
- `npm run build:android:prod` - Prebuild and assemble a release Android APK
- `npm run prod` - Run the Android release variant on a device
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm test` - Run Jest
- `npm run format:check` - Check Prettier formatting

## Release Preparation

- `PRIVACY.md` contains the app privacy policy for store listings.
- `store.config.json` contains Apple App Store metadata for EAS Metadata.
- `docs/store/apple-app-store.md` and `docs/store/google-play.md` contain platform-specific submission notes, privacy declarations, and screenshot checklists.

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
