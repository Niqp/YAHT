# Test Coverage Plan

## 1) Baseline snapshot

### Current test inventory

- **Total existing test files:** `6`
- **Primary production modules with direct behavioral coverage:** `6`
  - `hooks/habit/useHabitProgress.ts`
  - `hooks/timer/useTimerManager.ts`
  - `store/habit/timerSlice.ts`
  - `store/habit/completionSlice.ts`
  - `utils/statsUtils.ts`
  - `utils/date.ts`

### Currently covered files by requested test locations

#### `components/__tests__`
- `components/__tests__/smoke.test.tsx` (framework smoke check; does not target a specific feature module)

#### `hooks/*/*.test*`
- `hooks/habit/useHabitProgress.test.ts` → `hooks/habit/useHabitProgress.ts`
- `hooks/timer/useTimerManager.test.tsx` → `hooks/timer/useTimerManager.ts`

#### `store/habit/__tests__`
- `store/habit/__tests__/completionSlice.test.ts` → `store/habit/completionSlice.ts`
- `store/habit/__tests__/timerSlice.test.ts` → `store/habit/timerSlice.ts`

#### `utils/__tests__`
- `utils/__tests__/completionHistory.test.ts` → `utils/statsUtils.ts`, `utils/date.ts`

### Immediate baseline gaps (high-signal)

- Store slices with no direct tests yet:
  - `store/habit/crudSlice.ts`
  - `store/habit/importSlice.ts`
  - `store/habitStore.ts`
  - `store/themeStore.ts`
- Utility modules with no direct tests yet:
  - `utils/storage.ts`
  - `utils/fileOperations.ts`
  - `utils/notifications.ts`
- High-usage app/UI surfaces with no route/component-level tests:
  - `app/(tabs)/today.tsx`
  - `app/(tabs)/stats.tsx`
  - `app/(tabs)/settings.tsx`
  - `app/add.tsx`
  - `components/habit/HabitItem.tsx`
  - `components/dateSlider/DateSlider.tsx`

---

## 2) Coverage goals

### Target thresholds

> Use this as a staged target in CI (start with warning gates, then enforce).

- **Global thresholds**
  - Statements: **70%**
  - Branches: **60%**
  - Functions: **70%**
  - Lines: **70%**

- **Critical modules (higher bar)**
  - `store/habit/*.ts`, `store/habitStore.ts`, `store/themeStore.ts`: **85%+ lines / 80%+ branches**
  - `utils/date.ts`, `utils/statsUtils.ts`, `utils/storage.ts`, `utils/fileOperations.ts`: **85%+ lines / 80%+ branches**

- **UI/routes (lower initial bar, expand over time)**
  - `app/**/*.tsx`, `components/**/*.tsx`: **60%+ lines / 50%+ branches** initially

### Prioritization strategy: critical path first

1. **State correctness and persistence safety first**
   - Store slices and serialization boundaries (`store/habit/*.ts`, `store/habitStore.ts`, `utils/storage.ts`).
2. **Business logic helpers next**
   - Date/stat computations and edge-case-heavy helpers (`utils/date.ts`, `utils/statsUtils.ts`, `hooks/useStats.ts`).
3. **User flows last (but before release hardening)**
   - Route and interaction tests (`app/(tabs)/today.tsx`, `app/add.tsx`, habit actions in `components/habit/*`).

---

## 3) Milestone-based backlog

## Milestone A — Store slices and persistence boundaries

**Goal:** Lock down state transitions, cross-slice coordination, and persisted data behavior.

**Priority tasks**

- Add tests for CRUD behavior:
  - `store/habit/crudSlice.ts`
  - Suggested test file: `store/habit/__tests__/crudSlice.test.ts`
- Add tests for import/merge paths and validation:
  - `store/habit/importSlice.ts`
  - Suggested test file: `store/habit/__tests__/importSlice.test.ts`
- Add integration-level store tests:
  - `store/habitStore.ts`
  - Suggested test file: `store/habit/__tests__/habitStore.integration.test.ts`
- Add persistence adapter tests:
  - `utils/storage.ts`
  - Suggested test file: `utils/__tests__/storage.test.ts`
- Add MMKV boundary tests (mocking storage engine interactions):
  - `store/themeStore.ts`
  - Suggested test file: `store/__tests__/themeStore.test.ts`

## Milestone B — Hooks and date/stat helpers

**Goal:** Increase confidence in derived state and date-driven logic.

**Priority tasks**

- Expand hook coverage for derived stats/selectors:
  - `hooks/useStats.ts`
  - Suggested test file: `hooks/useStats.test.ts`
- Add display filtering edge-case tests:
  - `hooks/habit/useHabitDisplay.ts`
  - Suggested test file: `hooks/habit/useHabitDisplay.test.ts`
- Deepen date helper edge cases:
  - `utils/date.ts`
  - Extend `utils/__tests__/completionHistory.test.ts` or split into `utils/__tests__/date.test.ts`
- Add focused stats helper tests:
  - `utils/statsUtils.ts`
  - Suggested test file: `utils/__tests__/statsUtils.test.ts`
- Validate timer reconciliation/notification glue paths:
  - `hooks/timer/useTimerManager.ts`, `utils/notifications.ts`
  - Extend `hooks/timer/useTimerManager.test.tsx` + add `utils/__tests__/notifications.test.ts`

## Milestone C — App routes and key UI interaction paths

**Goal:** Cover end-to-end user-critical interactions at screen/component level.

**Priority tasks**

- Add route tests for core tabs:
  - `app/(tabs)/today.tsx`
  - `app/(tabs)/stats.tsx`
  - `app/(tabs)/settings.tsx`
  - Suggested test files under `app/__tests__/`
- Add habit creation/editing flow coverage:
  - `app/add.tsx`
  - `components/habitForm/*`
  - Suggested test files under `components/habitForm/__tests__/`
- Add interaction tests for item actions and progress UI:
  - `components/habit/HabitItem.tsx`
  - `components/habit/HabitBottomSheet/HabitBottomSheet.tsx`
  - `components/controls/TimedControls.tsx`
- Add date navigation and list behavior tests:
  - `components/dateSlider/DateSlider.tsx`
  - `components/HabitList/HabitList.tsx`

---

## 4) Test patterns & tooling

### Standard testing stack

- Use `@testing-library/react-native` as the default for component/hook rendering and assertions.
- Keep jest as runner with centralized setup in:
  - `jest.config.js`
  - `jest.setup.ts`

### Mocking strategy (standardized)

- Centralize high-noise platform/service mocks in setup or dedicated mock helpers:
  - Expo APIs (e.g., crypto/time/system modules used by slices/hooks)
  - Notifee notification boundary (`utils/notifications.ts`)
  - MMKV/persistence boundary (`utils/storage.ts`, `store/themeStore.ts`)
- Prefer **contract-level mocks** (mock only external side-effect boundary), while keeping store/hook logic real.

### Naming conventions

- Test file naming:
  - Unit: `<module>.test.ts` / `<module>.test.tsx`
  - Integration: `<module>.integration.test.ts`
- Test case naming:
  - Use behavior-first wording: `"returns ... when ..."`, `"dispatches ... on ..."`
- Describe blocks:
  - Top-level `describe('<module name>')`
  - Nested by behavior domain (`repetition`, `persistence`, `reconcile`, etc.)

### Fixture strategy

- Create reusable fixture builders close to domain:
  - Habit fixtures near store tests (e.g., `store/habit/__tests__/fixtures.ts`)
  - Date/stat fixtures near utility tests (e.g., `utils/__tests__/fixtures.ts`)
- Prefer builder functions over static objects to keep tests explicit and override-friendly.
- Freeze time in date-sensitive tests (`jest.useFakeTimers()` / fixed ISO strings) for deterministic assertions.

---

## 5) Execution checklist

### Done criteria by milestone

- **Milestone A done when**
  - Tests exist and pass for `crudSlice`, `importSlice`, `habitStore` integration, and persistence adapters.
  - Store/persistence modules meet target thresholds.
  - No uncovered critical branches for state transitions (create/update/delete/import/reconcile).

- **Milestone B done when**
  - Hooks and helper modules have edge-case coverage for date boundaries, streak logic, and timer state transitions.
  - Notification and timer reconciliation paths are asserted with deterministic mocks.

- **Milestone C done when**
  - Core routes (`today`, `stats`, `settings`, `add`) have interaction-driven tests.
  - Key UI behaviors (habit actions, date navigation, form save) are covered with user-event style assertions.

### Progress table

| Milestone | Scope (concrete paths) | Owner | Status |
|---|---|---|---|
| A | `store/habit/crudSlice.ts`, `store/habit/importSlice.ts`, `store/habitStore.ts`, `utils/storage.ts`, `store/themeStore.ts` | Unassigned | ✅ Complete |
| B | `hooks/useStats.ts`, `hooks/habit/useHabitDisplay.ts`, `utils/date.ts`, `utils/statsUtils.ts`, `hooks/timer/useTimerManager.ts`, `utils/notifications.ts` | Unassigned | ✅ Complete |
| C | `app/(tabs)/today.tsx`, `app/(tabs)/stats.tsx`, `app/(tabs)/settings.tsx`, `app/add.tsx`, `components/habit/HabitItem.tsx`, `components/dateSlider/DateSlider.tsx` | Unassigned | Not Started |


### PR checklist (required for every test coverage change)

- [ ] Added or updated tests for concrete target files in this plan.
- [ ] **Updated this file (`docs/test-coverage-plan.md`) in the same PR** to reflect progress, scope changes, or newly identified gaps.
- [ ] Updated the **Progress table** owner/status for the impacted milestone(s).
- [ ] Checked in a short "Files covered in this PR" note in the PR description, explicitly calling out every test file added/changed (for example: `store/habit/__tests__/crudSlice.test.ts`).
- [ ] Checked in a short "Production files validated by tests" note in the PR description, explicitly listing the source files those tests target (for example: `store/habit/crudSlice.ts`).
- [ ] Ran relevant test command(s) and documented results before merge.

> Team rule: every PR that adds/updates tests must also update this coverage plan and clearly call out the test files and production files covered by that test work.

### Suggested weekly execution loop

1. Pick 1 milestone lane (A/B/C) and assign owner.
2. Add/expand tests for 2–4 files only.
3. Run coverage, compare against threshold deltas.
4. Merge once milestone “done criteria” checks are satisfied for touched modules.
