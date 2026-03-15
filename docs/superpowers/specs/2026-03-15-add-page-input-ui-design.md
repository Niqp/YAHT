# Add Page Input UI Design

Date: 2026-03-15
Status: Approved for planning

## Summary

Improve the add-page input UI in three targeted areas:

1. Fix icon and text alignment inside add-page sheet panels so the icon is vertically aligned with the descriptive copy.
2. Redesign weekly repeatability day selection into a centered three-column pill grid with larger touch targets and expanded weekday labels.
3. Introduce the virtualized wheel-picker path for repetition and interval selectors only, while leaving the timed duration picker on the current non-virtual implementation.

This work should preserve the current add-page flow and component structure. The preferred approach is to update shared form primitives only where that reduces duplication without broad refactoring.

## Goals

- Make sheet panel icon-and-text rows feel visually centered and balanced.
- Increase clarity and tap comfort for weekly repeatability selection.
- Reduce the cost of long wheel datasets by switching repetition and interval controls to the package's virtualized wheel implementation.
- Reassess the current Android picker warm-up behavior instead of carrying it forward by default.

## Non-Goals

- No full redesign of the add page.
- No changes to the timed duration wheel interaction unless required by shared code safety.
- No broad refactor of unrelated form sections.

## Current State

- Add-page form sections are rendered in `app/add.tsx` with bottom-sheet detail panels for completion and repeatability settings.
- `CompletionTypeSection` and `RepetitionPatternSection` each render descriptive icon/text rows inside fixed-height sheet panels.
- `PresetPills` is a shared pill row/wrap component used for quick selections.
- `WheelPicker` wraps `@quidone/react-native-wheel-picker` and is currently non-virtualized for all use cases.
- `app/add.tsx` contains an Android-only hidden picker warm-up intended to reduce first-open latency.

## Proposed Changes

### 1. Icon Alignment in Sheet Panels

Update the shared descriptive row styling in the completion and repetition sections so the icon aligns with the text block rather than sitting too high. This should be done by adjusting row alignment and text spacing, not by applying one-off offsets to individual icons.

Scope:

- `components/habitForm/CompletionTypeSection/CompletionTypeSection.tsx`
- `components/habitForm/RepetitionPatternSection/RepetitionPatternSection.tsx`

Expected result:

- Icons and their adjacent copy read as a single vertically centered unit.
- The same alignment treatment is used in both sections.

### 2. Weekly Repeatability Grid

Replace the current wrapped weekday pill layout with an explicit three-column arrangement tailored to the weekly repeatability case.

Requirements:

- Expanded weekday labels instead of three-letter abbreviations.
- Three pills per row.
- Larger pills with improved tap targets.
- Center the overall grid within the panel instead of stretching it edge-to-edge.
- Center the final row horizontally when the row is not full.

Implementation direction:

- Extend `PresetPills` with optional layout variants rather than building a one-off weekly selector.
- Keep the current selected/unselected visual language unless minor token adjustments are required for legibility at the larger size.

Scope:

- `components/ui/form/PresetPills.tsx`
- `components/habitForm/RepetitionPatternSection/RepetitionPatternSection.tsx`

### 3. Virtualized Wheel Picker for Interval and Repetitions

Extend the shared `WheelPicker` abstraction to support a virtualized mode backed by the wheel-picker package's `withVirtualized(...)` HOC.

Requirements:

- Repetition goal picker uses the virtualized path.
- Interval day-count picker uses the virtualized path.
- Timed duration picker remains on the current non-virtual path.
- Call sites should remain simple and explicit, ideally through a prop on the shared wrapper.

Scope:

- `components/ui/form/WheelPicker.tsx`
- `components/habitForm/CompletionTypeSection/CompletionTypeSection.tsx`
- `components/habitForm/RepetitionPatternSection/RepetitionPatternSection.tsx`

## Android Warm-Up Evaluation

The existing hidden picker warm-up in `app/add.tsx` should be evaluated rather than preserved automatically.

Decision rule:

- Keep a warm-up path only if it still has a clear purpose after the picker split and there is evidence in code behavior that it meaningfully reduces first-open cost for the remaining non-virtual timed wheel.
- Remove warm-up entries that become redundant once repetition and interval move to virtualized wheels.
- If the remaining warm-up is not clearly justified, remove it instead of preserving dead complexity.

At minimum, implementation should inspect:

- Which picker instances are currently being warmed.
- Whether the new virtualized picker path is affected by the warm-up at all.
- Whether keeping only timed-wheel warm-up is simpler and still justified.

## Component Boundaries

- `WheelPicker` remains the single abstraction over the third-party wheel package.
- `PresetPills` remains the shared abstraction for pill-based quick selection, but gains optional layout styling for grid use.
- Section components continue owning their own content and helper text.

## Error Handling and UX Constraints

- Existing validation behavior and helper/error copy stay unchanged unless layout adjustments require small presentation changes.
- Interaction affordances should remain accessible, including larger tap targets for the weekly pills.
- Changes should not alter save logic, scheduling semantics, or existing form state transitions.

## Testing Strategy

Follow test-first updates for behavior that can be asserted at component level.

Target coverage:

- `WheelPicker` variant selection: confirm virtualized mode is used where expected and non-virtual mode remains for timed duration.
- Weekly repeatability rendering: confirm expanded labels and new layout hooks/props are applied.
- Any testable warm-up behavior changes in `app/add.tsx`, if warm-up logic remains.

Prefer focused component tests over broad snapshots.

## Risks

- Styling changes inside fixed-height panels can introduce clipping or awkward spacing if not checked carefully.
- A generic grid extension in `PresetPills` can become overdesigned if it tries to solve more than the weekly use case.
- Keeping stale warm-up behavior after the picker split would add maintenance cost without benefit.

## Recommended Implementation Order

1. Add or update tests for shared wheel behavior and weekly pill layout.
2. Extend `WheelPicker` with virtualized support.
3. Extend `PresetPills` with a centered three-column grid option.
4. Update repetition and completion sections to use the new shared capabilities and fix icon alignment.
5. Evaluate and simplify or remove Android picker warm-up logic in `app/add.tsx`.
6. Run targeted verification for impacted tests and formatting if needed.
