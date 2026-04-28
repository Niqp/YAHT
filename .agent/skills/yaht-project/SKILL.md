---
name: yaht-project
description: Comprehensive context and patterns for working with the YAHT (Yet Another Habit Tracker) React Native/Expo project
---

# YAHT Project Skill

> [!IMPORTANT]
> **Self-Rewrite Rule**: When you make changes to this project that affect architecture, patterns, conventions, or the directory layout described below, you **must** update this skill file to reflect those changes before finishing the task. See the [Skill Maintenance Protocol](#skill-maintenance-protocol) section at the bottom.

## Project Overview

**YAHT** (Yet Another Habit Tracker) is a mobile-first habit tracking app built with React Native and Expo. It tracks three habit types — simple (yes/no), repetition (counter), and timed (stopwatch) — with scheduling, statistics, data import/export, notifications, and light/dark theming.

- **Platform targets**: Android (primary), iOS, Web (experimental)
- **New Architecture**: Enabled

---

## Tech Stack

| Category           | Technology                                                                                                              | Notes                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework          | Expo 54 (managed + dev-client)                                                                                          | `expo-router` 6.x for file-based routing                                                                                                        |
| Language           | TypeScript 5.x                                                                                                          | Strict mode, `@/*` path alias to project root                                                                                                   |
| State Management   | Zustand 5.x + persist middleware                                                                                        | MMKV storage via `react-native-mmkv`                                                                                                            |
| Date Library       | dayjs 1.x                                                                                                               | Plugins: `isSameOrAfter`, `isToday`, `duration`                                                                                                 |
| Animations         | react-native-reanimated 3.16                                                                                            | + react-native-gesture-handler 2.20                                                                                                             |
| UI                 | lucide-react-native 1.x (icons), @gorhom/bottom-sheet 5.x, expo-linear-gradient, expo-haptics, react-native-emoji-popup | Design system components in `components/ui/` and the native emoji picker used by `app/add.tsx`                                                  |
| Localization       | expo-localization, i18next, react-i18next, i18next-icu                                                                  | System-locale English/Russian localization; ICU messages live in TypeScript catalogs under `i18n/locales/`                                      |
| Charts             | Custom React Native chart components                                                                                    | Stats views render bespoke chart components from `components/stats/charts/`                                                                     |
| Notifications      | expo-notifications 0.32.x, expo-task-manager 14.x, react-native-permissions                                             | Derived bounded reminder queue, Android headless quick actions, iOS native quick actions, platform-specific triggers, Android alarm permissions |
| Time Change Bridge | `@niqp/react-native-android-time-change`                                                                                | Local sibling RN Android library linked with `file:../react-native-android-time-change`                                                         |
| Virtualization     | recyclerlistview 4.x                                                                                                    | Used in DateSlider                                                                                                                              |
| Linting            | ESLint 9 flat config + typescript-eslint + eslint-config-prettier                                                       |                                                                                                                                                 |
| Formatting         | Prettier (`.prettierrc`)                                                                                                | Enforces project style — run `npm run format`                                                                                                   |
| Testing            | Jest (jest-expo preset) + @testing-library/react-native                                                                 | 11 test suites, ~121 tests                                                                                                                      |

---

## Directory Layout

| Directory     | Purpose                                                                                                                                                                                                                                                                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`        | Expo Router pages. Root `_layout.tsx` provides GestureHandler, SafeArea, React Navigation theme, BottomSheet, and TimerManager providers. Tabs: `today`, `stats`, `settings`. `add.tsx` is a modal route for create/edit.                                                                                                                                                         |
| `components/` | UI components grouped by feature in subfolders. Each component may have a colocated `.styles.ts` file.                                                                                                                                                                                                                                                                            |
| `store/`      | Zustand stores. `habitStore.ts` is the main store composed of slices in `store/habit/`. `themeStore.ts` handles appearance + `weekStartDay`.                                                                                                                                                                                                                                      |
| `hooks/`      | Custom hooks. `timer/useTimerManager.ts` handles background/foreground timer sync. `habit/` has display and progress hooks. `useStats.ts` computes statistics. `useTheme.ts` wraps `themeStore`.                                                                                                                                                                                  |
| `i18n/`       | Localization bootstrap and catalogs. `index.ts` initializes i18next/ICU and exports React/non-React translation helpers, `locale.ts` resolves supported device locales, and `locales/*.ts` contains English/Russian message catalogs.                                                                                                                                             |
| `types/`      | TypeScript type definitions: `habit.ts` (core domain types), `timer.ts`, `date.ts` (string type aliases).                                                                                                                                                                                                                                                                         |
| `utils/`      | Pure utility functions: `date.ts` (dayjs helpers), `storage.ts` (MMKV adapter for Zustand persist), notification scheduler/response utilities (`notifications.ts`, `reminderQueue.ts`, `reminderScheduler.ts`, `reminderScheduleLedger.ts`, `reminderResponseLedger.ts`, `reminderNotificationResponse.ts`, `reminderNotificationTask.ts`), `fileOperations.ts`, `statsUtils.ts`. |
| `constants/`  | Design system tokens: `Colors.ts` (full light/dark palette), `Typography.ts` (9-level type scale), `Spacing.ts` (4pt grid + border radii), `Elevation.ts` (platform shadow presets), `Animation.ts` (spring/timing configs).                                                                                                                                                      |
| `plugins/`    | Expo config plugins and native-source templates, including `with-ios-native-reminder-actions.js` for the generated iOS notification action handler.                                                                                                                                                                                                                               |
| `assets/`     | Images, fonts, splash screen.                                                                                                                                                                                                                                                                                                                                                     |

---

## Architecture & Patterns

### Zustand Slice Pattern

The app uses a **single Zustand store** composed of slices spread into the root creator:

```typescript
export const useHabitStore = create<HabitState>()(
  persist(
    (...args) => ({
      selectedDate: getCurrentDateStamp(),
      ...createCRUDSlice(...args),
      ...createCompletionSlice(...args),
      ...createImportSlice(...args),
      ...createTimerSlice(...args),
    }),
    { name: "habits-storage", storage: mmkvStorage, partialize: ... }
  )
);
```

**Conventions:**

- Each slice: `StateCreator<HabitState, [], [], SliceInterface>`
- `partialize` selectively persists only `habits` and `activeTimers`
- Hydration tracked via `_hasHydrated` flag — check before rendering data-dependent UI
- Always use **individual selectors**: `useHabitStore(s => s.habits)` — never destructure the whole store

### Data Model

**Habit** has three completion types via discriminated unions:

- `SIMPLE` — yes/no toggle
- `REPETITIONS` — counter toward a `goal`
- `TIMED` — millisecond timer toward a `goal`

**Repetition scheduling** (also discriminated unions):

- `DAILY` — every day
- `WEEKDAYS` — specific day numbers (0=Sunday...6=Saturday)
- `INTERVAL` — every N days since last completion

**Completion history** is a `Record<string, CompletionHistory>` keyed by `YYYY-MM-DD` date strings. Standard JSON serialization works natively — no custom Map serialization is needed. Keys are inserted in chronological order; use `Object.keys(history).sort()` when order matters.

### Timer System

Timestamp-based approach across `store/habit/timerSlice.ts` and `hooks/timer/useTimerManager.ts`:

1. `activateTimer()` stores `lastResumedAt` ISO timestamp
2. `useTimerManager` ticks every 1s via `setInterval`, calling `tickForeground(nowMs)`
3. On foreground resume, `reconcileActiveTimers()` recalculates true elapsed time from `lastResumedAt`
4. Auto-completes habits when `elapsedTime + storedValue >= goal`
5. `TimerManager` component in root layout mounts the hook

### Reminder Notification System

Habit reminder intent is stored on each `Habit.reminder`; native notification identifiers are not stored on habits. YAHT derives a bounded, non-recurring reminder queue from current habit rules, completion history, and snooze state:

1. `utils/reminderQueue.ts` expands habit reminder rules into concrete occurrence reminders, with one primary reminder and up to three nag reminders per occurrence.
2. The queue reserves 63 normal notification slots plus one visible “Open YAHT to continue reminders” stop notification when more reminders exist.
3. `utils/reminderScheduleLedger.ts` stores a plain MMKV-backed operational ledger of scheduled notification IDs and signatures; it is not part of the React-facing habit store.
4. `utils/reminderScheduler.ts` reconciles desired queue state against Expo scheduled notifications, cancelling changed/stale YAHT reminders and scheduling missing ones.
5. iOS occurrence reminders use non-repeating calendar triggers; Android uses date/timestamp triggers and relies on `expo-notifications` to re-arm stored notification requests after boot or app update.
6. Reminder `Done` and `Snooze` quick actions are handled by shared response logic in `utils/reminderNotificationResponse.ts`; Android background/terminated action taps are bridged through the Expo TaskManager task in `utils/reminderNotificationTask.ts`.
7. iOS background quick actions are installed by `plugins/with-ios-native-reminder-actions.js`, which copies Swift/Objective-C++ sources into the generated iOS project. The native `UNUserNotificationCenterDelegate` directly mutates the MMKV-backed Zustand habit store, cancels all pending/delivered notifications in the tapped reminder series, and records native-applied actions for JS to drain into in-memory Zustand state on hydration/foreground.
8. `utils/reminderResponseLedger.ts` is a dedicated MMKV-backed 48-hour de-dupe ledger for notification response keys. Use it before mutating habit state from notification responses so Headless JS, iOS native handlers, and UI listeners cannot apply the same action twice.

### Localization

YAHT localizes app-owned UI and notification copy through i18next with ICU message formatting:

- `app/_layout.tsx` initializes i18n before rendering and re-syncs the active language from `expo-localization` when the app returns to the foreground.
- Supported JS locales are resolved in `i18n/locale.ts`; English is the fallback and Russian is the first additional locale.
- Message catalogs are TypeScript files in `i18n/locales/en.ts` and `i18n/locales/ru.ts`. Use ICU plural messages for count-sensitive text, especially Russian habit/day/repetition counts.
- React components should use `useTranslation()` from `@/i18n`; non-React modules such as store slices, notifications, and import/export utilities should use `translate()`.
- User data and stable identifiers stay untranslated: habit titles/icons, route names, MMKV keys, notification IDs, enum values, imported/exported JSON, and completion history keys.
- Swift-only iOS reminder action text lives next to the native reminder plugin in `plugins/ios-native-reminder-actions/*.lproj/YAHTNativeReminderActions.strings`; the config plugin copies those resources into the generated iOS project.

### Android Time Change Bridge

The app consumes the sibling package `@niqp/react-native-android-time-change` from `D:\WebDev\react-native-android-time-change` via a local `file:` dependency. YAHT uses a custom `index.js` entrypoint to preserve Expo Router startup while delegating Android Headless JS registration to `utils/registerTimeChangeTask.android.ts`; the default `utils/registerTimeChangeTask.ts` is a non-Android no-op so iOS/web builds do not import the Android native package. App-owned handling lives in `utils/timeChange.ts` and the Android-only `hooks/useTimeChangeManager.android.ts`; the default `hooks/useTimeChangeManager.ts` is a no-op for non-Android platforms. The native package only transports normalized `TIME_SET`, `TIMEZONE_CHANGED`, and optional API 37+ `TIMEZONE_OFFSET_CHANGED` events into JS. Keep habit, timer, reminder, and scheduling policy in YAHT code, not in the library.

### Theming

- `themeStore` persists `mode` (light/dark/system), `colorTheme` (sepia/clear/oled), and `weekStartDay`
- `useTheme()` hook provides `colors` object, `colorTheme`, `setColorTheme`, and light/dark controls
- Colors applied via **inline styles**: `{ backgroundColor: colors.bgApp }`
- Three color themes: **Sepia** (warm brown tones), **Clear** (neutral blue-gray), **OLED** (pure black dark mode)
- System theme changes detected via `AppState` listener in `setupSystemThemeListener()`
- Web persistence uses `localStorage` fallback (MMKV on native)

### Design System

All visual constants live in `constants/`. Import from there — never hardcode values in components.

| File            | Exports                                                     | Usage                                                                                            |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Colors.ts`     | `Colors`, `ColorTheme`, `ColorThemeName`, `ColorSchemeName` | 3×2 semantic color-token matrix (sepia/clear/oled × light/dark). Use via `useTheme().colors`.    |
| `Typography.ts` | `Typography`, `TypographyVariant`                           | `StyleSheet` with 9 named text styles.                                                           |
| `Spacing.ts`    | `Spacing`, `BorderRadius`                                   | 4pt grid spacing + border radius tokens.                                                         |
| `Elevation.ts`  | `getElevation`                                              | Platform-aware shadow presets (levels 0–3). Spread returns: `...getElevation(1, colors.shadow)`. |
| `Animation.ts`  | `SpringConfig`, `TimingConfig`, `PressScale`                | Reanimated spring/timing configs for consistent motion.                                          |

**Design system UI components** live in `components/ui/` and are barrel-exported from `components/ui/index.ts`:

| Component             | Purpose                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `AppText`             | Typography-scale-aware `Text` wrapper with `variant` prop and `tabularNums` support.                                        |
| `AppSegmentedControl` | Shared segmented control with native iOS rendering and custom Android styling for clearer touch targets and selected state. |
| `ScaleButton`         | Animated button with spring press feedback; variants: `primary`, `secondary`, `destructive`.                                |
| `PressableCard`       | Card-style pressable with platform ripple/opacity feedback and configurable elevation.                                      |
| `AppBottomSheet`      | `@gorhom/bottom-sheet` wrapper with guideline defaults (radius-xl, overlay backdrop, handle).                               |

**Form picker pattern**: `components/ui/form/WheelPicker.tsx` is the shared numeric wheel wrapper used by duration, reminder, completion-goal, and interval controls. It renders the native `@react-native-picker/picker` wheel on iOS and keeps `@quidone/react-native-wheel-picker` on Android/Web; shared sizing constants live in `components/ui/form/WheelPicker.shared.ts`.

**Haptics utility**: `utils/haptics.ts` — thin wrapper around `expo-haptics` with `complete`, `success`, `warning`, `medium` methods.

**Colors.ts semantic tokens**: public color tokens use elevation, text, border, state, input, picker, button, chip, toggle, nav, overlay, shadow, and limited gradient roles. Header gradients use start/mid/end tokens. Legacy flat/component aliases are not exported; migrate components to the semantic names when touching color consumers.

### Routing

- Expo Router file-based routing with tab navigator
- Root `_layout.tsx` → `(tabs)/_layout.tsx` → tab screens
- Root layout provides React Navigation `ThemeProvider` and `SafeAreaProvider`; hidden-header tab scenes apply safe-area padding from `(tabs)/_layout.tsx`
- `add.tsx` is a modal with optional `habitId` search param for edit mode
- `index.tsx` redirects to `/(tabs)/today`

---

## Testing

- **Preset**: `jest-expo` with `@testing-library/react-native`
- **Path alias**: `@/` mapped via `moduleNameMapper` in `jest.config.js`
- **Setup file**: `jest.setup.ts`
- **Test file locations**: colocated in `__tests__/` subdirectories next to the source files they cover

### Coverage by area

| Area           | Test files                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `utils/`       | `utils/__tests__/date.test.ts`, `utils/__tests__/completionHistory.test.ts`                                                                     |
| `store/habit/` | `__tests__/completionSlice.test.ts`, `__tests__/crudSlice.test.ts`, `__tests__/importSlice.test.ts`, `__tests__/timerSlice.test.ts`             |
| `hooks/`       | `hooks/habit/useHabitDisplay.test.ts`, `hooks/habit/useHabitProgress.test.ts`, `hooks/timer/useTimerManager.test.tsx`, `hooks/useStats.test.ts` |
| `components/`  | `components/__tests__/smoke.test.tsx` (trivial render check)                                                                                    |

### Patterns for writing tests

- **Pure slices**: use a local harness — create a `state` object, wire `set`/`get` manually, instantiate the slice, call actions directly. No Zustand store needed.
- **Hooks with store deps**: mock `@/store/habitStore` with `jest.mock(...)`, provide a `mockStoreState` object, use `renderHook`.
- **Native modules** (MMKV, expo-crypto, notifications): always mock at the top of the test file.

---

## Code Style Conventions

**Formatting (enforced by Prettier):**

- Double quotes for strings. Semicolons. Arrow functions for most expressions.
- 2-space indentation, `printWidth: 120`, `trailingComma: "es5"`
- Run `npm run format` to auto-format; `npm run format:check` for CI
- `export default function` for page/component exports
- Named `export const` for hooks and utilities

**Imports:**

- Prefer `@/` path aliases: `@/store/habitStore`, `@/utils/date`
- `import type { ... }` for type-only imports
- `import React from "react"` explicitly

**Naming:**

- PascalCase for components/files: `HabitItem.tsx`, `DateSlider.tsx`
- camelCase for hooks/utilities: `useStats.ts`, `statsUtils.ts`
- Colocated styles: `ComponentName.styles.ts` using `StyleSheet.create()`

**Error handling:**

- Try-catch in async store actions → `console.error` + `set({ error: "..." })`
- Defensive null checks on habit data in components

**Types:**

- Enums for finite sets (`CompletionType`, `RepetitionType`)
- Discriminated unions for variant configs (`CompletionConfig`, `RepetitionConfig`)
- String type aliases for semantic meaning (`DateStamp`, `DateTimeStamp`, `UUIDv4`, `timeMs`)

---

## Commands

| Command                       | Description                            |
| ----------------------------- | -------------------------------------- |
| `npm start`                   | Start Expo dev server                  |
| `npm run android`             | Run on Android                         |
| `npm run ios`                 | Run on iOS                             |
| `npm run web`                 | Start web version                      |
| `npm run build:android:debug` | Prebuild and assemble debug APK        |
| `npm run build:android:prod`  | Prebuild and assemble production APK   |
| `npm run cleanRun`            | Clean prebuild + run Android           |
| `npm run prod`                | Release build for Android              |
| `npm run lint`                | Run ESLint                             |
| `npm test`                    | Run Jest test suite                    |
| `npm run tsc`                 | Run TypeScript type checking           |
| `npm run format`              | Format all source files with Prettier  |
| `npm run format:check`        | Check formatting (non-destructive, CI) |

---

## Skill Maintenance Protocol

This skill must stay in sync with the codebase. Follow these rules:

### When to Update

Update this file when any of the following change:

- **Directory layout**: New top-level directories, renamed/moved feature folders, new routing pages
- **Tech stack**: Dependencies added, removed, or replaced
- **Architecture patterns**: New store slices, new middleware, changed data flow patterns
- **Code conventions**: Formatting decisions standardized, import rules changed, naming conventions updated
- **Commands**: New scripts added to `package.json`

### When NOT to Update

Do **not** update this file for:

- Adding individual components within existing feature folders
- Bug fixes that don't change architecture
- Content changes within existing patterns (e.g., adding a field to an existing type)
- Test files

### How to Update

1. Make the code change first
2. Identify which section(s) of this skill are affected
3. Edit **only** the affected sections — keep changes minimal and precise
4. If a system documented here was **removed or replaced**, remove or replace the corresponding documentation
5. If a **new architectural pattern** was introduced, add a new subsection under "Architecture & Patterns"
