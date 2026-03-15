# Add Page Input UI Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the add-page sheet UI by fixing icon alignment, redesigning weekly repeatability pills into a centered three-column grid, and switching repetition and interval wheels to the virtualized picker path while leaving timed duration unchanged.

**Architecture:** Keep the current add-page structure intact and make the smallest shared-component changes that remove duplication. Extend the shared `WheelPicker` and `PresetPills` primitives, then wire the new capabilities into the completion and repetition sheet sections. Treat Android picker warm-up as a separate decision point and remove it unless it has a clear remaining benefit after the picker split.

**Tech Stack:** React Native, Expo Router, TypeScript, Jest, `@testing-library/react-native`, `@quidone/react-native-wheel-picker`

---

## File Map

- Modify: `D:/WebDev/YAHT/components/ui/form/WheelPicker.tsx`
  - Add an explicit virtualized mode backed by `withVirtualized(...)`.
- Modify: `D:/WebDev/YAHT/components/ui/form/PresetPills.tsx`
  - Add an optional centered 3-column grid layout variant for weekly repeatability.
- Modify: `D:/WebDev/YAHT/components/habitForm/RepetitionPatternSection/RepetitionPatternSection.tsx`
  - Expand weekday labels, apply centered weekly grid, use virtualized interval wheel, and fix icon/text alignment.
- Modify: `D:/WebDev/YAHT/components/habitForm/CompletionTypeSection/CompletionTypeSection.tsx`
  - Fix icon/text alignment and use virtualized repetition wheel only.
- Modify: `D:/WebDev/YAHT/app/add.tsx`
  - Re-evaluate the Android warm-up path and simplify or remove it based on remaining value.
- Create: `D:/WebDev/YAHT/components/__tests__/WheelPicker.test.tsx`
  - Prove the shared wheel wrapper uses the correct picker implementation.
- Create: `D:/WebDev/YAHT/components/__tests__/PresetPills.test.tsx`
  - Prove the shared pills wrapper applies the weekly grid layout hooks.
- Create: `D:/WebDev/YAHT/components/__tests__/RepetitionPatternSection.test.tsx`
  - Prove weekly labels expand and interval picker wiring uses virtualization.
- Create: `D:/WebDev/YAHT/components/__tests__/CompletionTypeSection.test.tsx`
  - Prove repetition picker wiring uses virtualization and timed duration still uses the base wheel path.
- Create only if warm-up survives: `D:/WebDev/YAHT/components/__tests__/AddScreenPickerWarmup.test.tsx`
  - Prove the warm-up host only renders the intended wheel(s).

## Chunk 1: Shared Form Primitives

### Task 1: Add explicit virtualized support to the shared wheel wrapper

**Files:**
- Create: `D:/WebDev/YAHT/components/__tests__/WheelPicker.test.tsx`
- Modify: `D:/WebDev/YAHT/components/ui/form/WheelPicker.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from "react";
import { render, screen } from "@testing-library/react-native";

const mockBasePicker = jest.fn(() => null);
const mockVirtualizedPicker = jest.fn(() => null);

jest.mock("@quidone/react-native-wheel-picker", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockBasePicker(props);
    return null;
  },
  withVirtualized: () => (props: unknown) => {
    mockVirtualizedPicker(props);
    return null;
  },
}));

import WheelPicker from "@/components/ui/form/WheelPicker";

describe("WheelPicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the base picker by default", () => {
    render(<WheelPicker data={[{ value: 1, label: "1" }]} value={1} onChange={jest.fn()} />);
    expect(mockBasePicker).toHaveBeenCalled();
    expect(mockVirtualizedPicker).not.toHaveBeenCalled();
  });

  it("uses the virtualized picker when requested", () => {
    render(<WheelPicker data={[{ value: 1, label: "1" }]} value={1} onChange={jest.fn()} virtualized />);
    expect(mockVirtualizedPicker).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/__tests__/WheelPicker.test.tsx --runInBand`

Expected: FAIL because `WheelPicker` does not yet accept a `virtualized` prop or does not switch implementations.

- [ ] **Step 3: Write minimal implementation**

```tsx
import BaseWheelPicker, { withVirtualized } from "@quidone/react-native-wheel-picker";

const VirtualizedWheelPicker = withVirtualized(BaseWheelPicker);

interface WheelPickerProps {
  virtualized?: boolean;
}

const PickerComponent = virtualized ? VirtualizedWheelPicker : BaseWheelPicker;

return <PickerComponent {...sharedProps} />;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/__tests__/WheelPicker.test.tsx --runInBand`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/__tests__/WheelPicker.test.tsx components/ui/form/WheelPicker.tsx
git commit -m "test(ui): add wheel picker virtualization coverage"
```

### Task 2: Add a centered 3-column weekly grid mode to shared pills

**Files:**
- Create: `D:/WebDev/YAHT/components/__tests__/PresetPills.test.tsx`
- Modify: `D:/WebDev/YAHT/components/ui/form/PresetPills.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from "react";
import { render, screen } from "@testing-library/react-native";

import PresetPills from "@/components/ui/form/PresetPills";

describe("PresetPills", () => {
  it("renders a centered three-column weekly grid variant", () => {
    render(
      <PresetPills
        layoutVariant="weeklyGrid"
        options={[
          { label: "Monday", value: 1 },
          { label: "Tuesday", value: 2 },
          { label: "Wednesday", value: 3 },
        ]}
        selectionMode="multiple"
        selectedValues={[1]}
        onToggle={jest.fn()}
      />
    );

    expect(screen.getByText("Monday")).toBeOnTheScreen();
    expect(screen.getByTestId("preset-pills-weekly-grid")).toHaveStyle({
      justifyContent: "center",
    });
    expect(screen.getByTestId("preset-pill-1")).toHaveStyle({
      minHeight: 44,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/__tests__/PresetPills.test.tsx --runInBand`

Expected: FAIL because `layoutVariant`, `testID` hooks, and weekly sizing are not implemented.

- [ ] **Step 3: Write minimal implementation**

```tsx
interface BasePresetPillsProps<T extends string | number> {
  layoutVariant?: "default" | "weeklyGrid";
}

const isWeeklyGrid = layoutVariant === "weeklyGrid";

<View
  testID={isWeeklyGrid ? "preset-pills-weekly-grid" : undefined}
  style={[styles.row, isWeeklyGrid ? styles.weeklyGrid : null]}
>
  <Pressable
    testID={isWeeklyGrid ? `preset-pill-${String(option.value)}` : undefined}
    style={[styles.pill, isWeeklyGrid ? styles.weeklyGridPill : null]}
  />
</View>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest components/__tests__/PresetPills.test.tsx --runInBand`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/__tests__/PresetPills.test.tsx components/ui/form/PresetPills.tsx
git commit -m "feat(ui): add weekly grid preset pills"
```

## Chunk 2: Section Wiring and Layout Updates

### Task 3: Update repeatability section for expanded weekday labels and virtualized interval wheel

**Files:**
- Create: `D:/WebDev/YAHT/components/__tests__/RepetitionPatternSection.test.tsx`
- Modify: `D:/WebDev/YAHT/components/habitForm/RepetitionPatternSection/RepetitionPatternSection.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from "react";
import { render, screen } from "@testing-library/react-native";

const mockWheelPicker = jest.fn(() => null);
const mockPresetPills = jest.fn(() => null);

jest.mock("@/components/ui/form", () => {
  const actual = jest.requireActual("@/components/ui/form");
  return {
    ...actual,
    WheelPicker: (props: unknown) => {
      mockWheelPicker(props);
      return null;
    },
    PresetPills: (props: unknown) => {
      mockPresetPills(props);
      return null;
    },
  };
});

import RepetitionPatternSection from "@/components/habitForm/RepetitionPatternSection/RepetitionPatternSection";
import { RepetitionType } from "@/types/habit";

describe("RepetitionPatternSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes expanded weekday labels and weekly grid layout", () => {
    render(
      <RepetitionPatternSection
        repetitionType={RepetitionType.WEEKDAYS}
        setRepetitionType={jest.fn()}
        selectedDays={[1, 3]}
        setSelectedDays={jest.fn()}
        customDays={3}
        setCustomDays={jest.fn()}
        weekStartDay={1}
      />
    );

    expect(mockPresetPills).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutVariant: "weeklyGrid",
        options: expect.arrayContaining([expect.objectContaining({ label: "Monday" })]),
      }),
      undefined
    );
  });

  it("uses the virtualized wheel for interval selection", () => {
    render(
      <RepetitionPatternSection
        repetitionType={RepetitionType.INTERVAL}
        setRepetitionType={jest.fn()}
        selectedDays={[]}
        setSelectedDays={jest.fn()}
        customDays={7}
        setCustomDays={jest.fn()}
        weekStartDay={1}
      />
    );

    expect(mockWheelPicker).toHaveBeenCalledWith(expect.objectContaining({ virtualized: true }), undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/__tests__/RepetitionPatternSection.test.tsx --runInBand`

Expected: FAIL because weekday labels are abbreviated, no weekly grid variant is passed, and interval wheel is not virtualized.

- [ ] **Step 3: Write minimal implementation**

```tsx
const weekdayOptions = orderedWeekdays.map((day) => ({
  value: day.dayIndex,
  label: day.name,
}));

<PresetPills
  layoutVariant="weeklyGrid"
  options={weekdayOptions}
  selectionMode="multiple"
  selectedValues={selectedDays}
  onToggle={handleDayToggle}
/>

<WheelPicker
  data={INTERVAL_OPTIONS}
  value={customDays}
  onChange={setCustomDays}
  style={styles.picker}
  virtualized
/>
```

- [ ] **Step 4: Align the section's description rows**

Adjust the descriptive row styles in the same file so the icon and body copy share a visually centered baseline without ad-hoc offsets. Keep the fixed panel height unchanged unless clipping forces a small adjustment.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest components/__tests__/RepetitionPatternSection.test.tsx --runInBand`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/__tests__/RepetitionPatternSection.test.tsx components/habitForm/RepetitionPatternSection/RepetitionPatternSection.tsx
git commit -m "feat(add): refresh weekly repeatability controls"
```

### Task 4: Update completion type section for aligned copy and virtualized repetition wheel only

**Files:**
- Create: `D:/WebDev/YAHT/components/__tests__/CompletionTypeSection.test.tsx`
- Modify: `D:/WebDev/YAHT/components/habitForm/CompletionTypeSection/CompletionTypeSection.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import React from "react";
import { render } from "@testing-library/react-native";

const mockWheelPicker = jest.fn(() => null);
const mockDurationInput = jest.fn(() => null);

jest.mock("@/components/ui/form", () => {
  const actual = jest.requireActual("@/components/ui/form");
  return {
    ...actual,
    WheelPicker: (props: unknown) => {
      mockWheelPicker(props);
      return null;
    },
    DurationInput: (props: unknown) => {
      mockDurationInput(props);
      return null;
    },
  };
});

import CompletionTypeSection from "@/components/habitForm/CompletionTypeSection/CompletionTypeSection";
import { CompletionType } from "@/types/habit";

describe("CompletionTypeSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses the virtualized wheel for repetitions", () => {
    render(
      <CompletionTypeSection
        completionType={CompletionType.REPETITIONS}
        setCompletionType={jest.fn()}
        completionGoal={10}
        setCompletionGoal={jest.fn()}
        isEditMode={false}
      />
    );

    expect(mockWheelPicker).toHaveBeenCalledWith(expect.objectContaining({ virtualized: true }), undefined);
  });

  it("keeps timed completion on DurationInput instead of a virtualized wheel", () => {
    render(
      <CompletionTypeSection
        completionType={CompletionType.TIMED}
        setCompletionType={jest.fn()}
        completionGoal={900000}
        setCompletionGoal={jest.fn()}
        isEditMode={false}
      />
    );

    expect(mockDurationInput).toHaveBeenCalled();
    expect(mockWheelPicker).not.toHaveBeenCalledWith(expect.objectContaining({ virtualized: true }), undefined);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest components/__tests__/CompletionTypeSection.test.tsx --runInBand`

Expected: FAIL because repetition currently uses the base wheel path.

- [ ] **Step 3: Write minimal implementation**

```tsx
<WheelPicker
  data={REPETITION_OPTIONS}
  value={completionGoal}
  onChange={setCompletionGoal}
  style={styles.picker}
  virtualized
/>
```

- [ ] **Step 4: Align the section's descriptive rows**

Update the icon/text row styles in this file to match the centered treatment applied in the repetition section.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest components/__tests__/CompletionTypeSection.test.tsx --runInBand`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/__tests__/CompletionTypeSection.test.tsx components/habitForm/CompletionTypeSection/CompletionTypeSection.tsx
git commit -m "feat(add): virtualize repetition picker"
```

## Chunk 3: Android Warm-Up Decision and Final Verification

### Task 5: Re-evaluate the Android picker warm-up and simplify it

**Files:**
- Modify: `D:/WebDev/YAHT/app/add.tsx`
- Create only if needed: `D:/WebDev/YAHT/components/__tests__/AddScreenPickerWarmup.test.tsx`

- [ ] **Step 1: Inspect current rationale before changing code**

Run: `git log -S "shouldWarmPickers" -- app/add.tsx`

Expected: See whether the current warm-up was added for a documented Android first-open issue.

- [ ] **Step 2: Choose the simplest remaining behavior**

Use this rule:

- If interval and repetition warm-up entries no longer affect the new virtualized path, remove them.
- If timed warm-up still has a clear and defensible purpose, keep only the timed wheel.
- If there is no strong remaining case, remove the warm-up host entirely.

- [ ] **Step 3: If any warm-up logic remains, write the failing test first**

```tsx
import React from "react";
import { act, render } from "@testing-library/react-native";

const mockWheelPicker = jest.fn(() => null);

jest.mock("@/components/ui/form", () => {
  const actual = jest.requireActual("@/components/ui/form");
  return {
    ...actual,
    WheelPicker: (props: unknown) => {
      mockWheelPicker(props);
      return null;
    },
  };
});

describe("AddScreen picker warm-up", () => {
  it("renders only the remaining warm-up wheel after interactions", async () => {
    // Mock screen dependencies and flush the delayed warm-up path.
    expect(mockWheelPicker).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: Run the warm-up test to verify it fails**

Run: `npx jest components/__tests__/AddScreenPickerWarmup.test.tsx --runInBand`

Expected: FAIL until `add.tsx` matches the chosen warm-up behavior.

- [ ] **Step 5: Implement the warm-up decision**

```tsx
// Example outcome if only timed warm-up survives:
const WARMUP_HOUR_OPTIONS = ...
const WARMUP_MINUTE_OPTIONS = ...

{shouldWarmPickers ? (
  <View ...>
    <WheelPicker data={WARMUP_HOUR_OPTIONS} ... />
    <WheelPicker data={WARMUP_MINUTE_OPTIONS} ... />
  </View>
) : null}
```

If warm-up is removed entirely, delete the offscreen host, data constants, and delayed effect together in one change.

- [ ] **Step 6: Run the relevant test path**

Run one of:

- `npx jest components/__tests__/AddScreenPickerWarmup.test.tsx --runInBand`
- `npm test -- --runInBand components/__tests__/WheelPicker.test.tsx components/__tests__/PresetPills.test.tsx components/__tests__/RepetitionPatternSection.test.tsx components/__tests__/CompletionTypeSection.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/add.tsx components/__tests__/AddScreenPickerWarmup.test.tsx
git commit -m "refactor(add): simplify picker warmup path"
```

### Task 6: Final verification

**Files:**
- Verify all files changed in this plan

- [ ] **Step 1: Run the focused test suite**

Run:

```bash
npx jest components/__tests__/WheelPicker.test.tsx --runInBand
npx jest components/__tests__/PresetPills.test.tsx --runInBand
npx jest components/__tests__/RepetitionPatternSection.test.tsx --runInBand
npx jest components/__tests__/CompletionTypeSection.test.tsx --runInBand
```

Expected: PASS

- [ ] **Step 2: Run broader regression coverage if warm-up changes touched `app/add.tsx` substantially**

Run: `npm test -- --runInBand`

Expected: PASS or a clearly understood pre-existing failure outside this scope.

- [ ] **Step 3: Run formatting check**

Run: `npm run format:check`

Expected: PASS

- [ ] **Step 4: Commit any final cleanup**

```bash
git add components/__tests__/WheelPicker.test.tsx components/__tests__/PresetPills.test.tsx components/__tests__/RepetitionPatternSection.test.tsx components/__tests__/CompletionTypeSection.test.tsx components/ui/form/WheelPicker.tsx components/ui/form/PresetPills.tsx components/habitForm/RepetitionPatternSection/RepetitionPatternSection.tsx components/habitForm/CompletionTypeSection/CompletionTypeSection.tsx app/add.tsx
git commit -m "feat(add): polish sheet inputs and picker performance"
```
