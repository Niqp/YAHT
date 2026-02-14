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

| Category | Technology | Notes |
|--|--|--|
| Framework | Expo 52 (managed + dev-client) | `expo-router` 4.x for file-based routing |
| Language | TypeScript 5.x | Strict mode, `@/*` path alias to project root |
| State Management | Zustand 5.x + persist middleware | MMKV storage via `react-native-mmkv` |
| Date Library | dayjs 1.x | Plugins: `isSameOrAfter`, `isToday`, `duration` |
| Animations | react-native-reanimated 3.16 | + react-native-gesture-handler 2.20 |
| UI | lucide-react-native (icons), @rneui/themed (buttons), @gorhom/bottom-sheet 5.x | |
| Charts | react-native-chart-kit 6.12 | |
| Notifications | @notifee/react-native 9.x | Timestamp-triggered, Android alarm permissions |
| Virtualization | recyclerlistview 4.x | Used in DateSlider |
| Linting | ESLint 9 flat config + typescript-eslint | |

---

## Directory Layout

| Directory | Purpose |
|--|--|
| `app/` | Expo Router pages. Root `_layout.tsx` provides GestureHandler, BottomSheet, SafeArea, and TimerManager providers. Tabs: `today`, `stats`, `settings`. `add.tsx` is a modal route for create/edit. |
| `components/` | UI components grouped by feature in subfolders. Each component may have a colocated `.styles.ts` file. |
| `store/` | Zustand stores. `habitStore.ts` is the main store composed of slices in `store/habit/`. `themeStore.ts` handles appearance + `weekStartDay`. |
| `hooks/` | Custom hooks. `timer/useTimerManager.ts` handles background/foreground timer sync. `habit/` has display and progress hooks. `useStats.ts` computes statistics. `useTheme.ts` wraps `themeStore`. |
| `types/` | TypeScript type definitions: `habit.ts` (core domain types), `timer.ts`, `date.ts` (string type aliases). |
| `utils/` | Pure utility functions: `date.ts` (dayjs helpers), `storage.ts` (MMKV + Map serialization), `map.ts` (sorted insertion), `notifications.ts`, `fileOperations.ts`, `statsUtils.ts`. |
| `constants/` | `Colors.ts` — static light/dark theme color definitions. |
| `plugins/` | Expo config plugins (`notifee-mod.js`). |
| `assets/` | Images, fonts, splash screen. |

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

**Completion history** is a `Map<string, CompletionHistory>` keyed by date string, sorted chronologically. The Map requires custom JSON serialization (`{ __isMap: true, entries: [...] }` format in `utils/storage.ts`) and sorted insertion via `utils/map.ts`.

### Timer System

Timestamp-based approach across `store/habit/timerSlice.ts` and `hooks/timer/useTimerManager.ts`:
1. `activateTimer()` stores `lastResumedAt` ISO timestamp
2. `useTimerManager` ticks every 1s via `setInterval`, calling `incrementAllTimers(1000)`
3. On foreground resume, recalculates true elapsed time from `lastResumedAt`
4. Auto-completes habits when `elapsedTime + storedValue >= goal`
5. `TimerManager` component in root layout mounts the hook

### Theming

- `themeStore` persists `mode` (light/dark/system) and `weekStartDay`
- `useTheme()` hook provides `colors` object from `constants/Colors.ts`
- Colors applied via **inline styles**: `{ backgroundColor: colors.background }`
- System theme changes detected via `AppState` listener

### Routing

- Expo Router file-based routing with tab navigator
- Root `_layout.tsx` → `(tabs)/_layout.tsx` → tab screens
- `add.tsx` is a modal with optional `habitId` search param for edit mode
- `index.tsx` redirects to `/(tabs)/today`

---

## Code Style Conventions

**Formatting:**
- Double quotes for strings. Semicolons. Arrow functions for most expressions.
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

| Command | Description |
|--|--|
| `npm start` | Start Expo dev server |
| `npm run android` | Run on Android |
| `npm run ios` | Run on iOS |
| `npm run web` | Start web version |
| `npm run cleanRun` | Clean prebuild + run Android |
| `npm run prod` | Release build for Android |

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
