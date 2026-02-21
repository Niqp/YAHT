# YAHT — UI/UX Design Guidelines

> **Purpose**: Universal visual and interaction rules for YAHT. Any contributor — human or LLM — implementing new screens or refactoring existing ones **must** follow these rules to maintain a consistent look and feel.

---

## 1. Design Philosophy

| Principle       | Rule                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clean**       | Every screen has one clear purpose. If an element doesn't help the user understand or act, remove it.                                         |
| **Focused**     | One primary action per screen. Secondary actions are visually subordinate.                                                                    |
| **Theme-aware** | YAHT supports sepia, clear, and OLED themes. UI structure stays consistent while color tone adapts per theme and mode.                        |
| **Glanceable**  | Core status (done / in progress / not started) must be readable in under 1 second. Use color, icons, and spatial grouping — never text alone. |
| **Trustworthy** | Animations are smooth and purposeful. Nothing jumps or flashes.                                                                               |

### Mobile-First Constraints

- **Thumb-zone**: Primary actions in the bottom 60% of the screen.
- **44pt minimum touch target**: Every pressable area is at least 44×44 points.
- **One-handed use**: No interactive elements in the top bar except system navigation.
- **Generous whitespace**: Density is the enemy of comfort. Let elements breathe.

---

## 2. Color System

YAHT uses three color themes (`sepia`, `clear`, `oled`) and two display modes (`light`, `dark`).

### 2.1 Theme Model

| Theme   | Light mode                 | Dark mode                          | Notes                             |
| ------- | -------------------------- | ---------------------------------- | --------------------------------- |
| `sepia` | Warm paper palette         | Warm low-light palette             | Journal-like tone                 |
| `clear` | Neutral blue-slate palette | Deep blue-slate palette            | Default high-legibility palette   |
| `oled`  | Same as `clear` light      | True-black variant of `clear` dark | Optimized for OLED power/contrast |

Rules:

- `oled.light` must remain identical to `clear.light` in `constants/Colors.ts`.
- `clear.dark` and `oled.dark` share the same accent family (`primary`, `accent`) to keep action semantics consistent.
- Theme differences should come from tokens, not component-level conditionals.

### 2.2 Core Palette Anchors

Source of truth for all tokens: `constants/Colors.ts`. The table below documents the primary anchor tokens used to define each theme.

| Theme + mode  | `background`          | `surface`             | `cardBackground`      | `primary`             | `accent`              | `text`                | `textSecondary`       | `border`              | `tabBackground`       |
| ------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- |
| `sepia.light` | `#FAF7F2`             | `#c7a97dff`           | `#FFFFFF`             | `#8B6F47`             | `#C4813D`             | `#2C2418`             | `#6B5D4F`             | `#E2D9CC`             | `#FFFFFF`             |
| `sepia.dark`  | `#0f0d0bff`           | `#1f1c16ff`           | `#2C2620`             | `#C4A882`             | `#D4944A`             | `#EDE5D8`             | `#A89C8C`             | `#3D3428`             | `#231F1A`             |
| `clear.light` | `#F6F8FB`             | `#EAF0F7`             | `#FFFFFF`             | `#3F74B5`             | `#5D90D2`             | `#18212C`             | `#4F6278`             | `#D5DFEB`             | `#FFFFFF`             |
| `clear.dark`  | `#0F1620`             | `#162130`             | `#1D2A3A`             | `#7FB1E8`             | `#95C2F5`             | `#E7EEF8`             | `#B2C0D2`             | `#2D415A`             | `#162130`             |
| `oled.light`  | Same as `clear.light` | Same as `clear.light` | Same as `clear.light` | Same as `clear.light` | Same as `clear.light` | Same as `clear.light` | Same as `clear.light` | Same as `clear.light` | Same as `clear.light` |
| `oled.dark`   | `#000000`             | `#050B14`             | `#0B1320`             | `#7FB1E8`             | `#95C2F5`             | `#EDF3FB`             | `#B4C2D5`             | `#1A2B40`             | `#000000`             |

### 2.3 Color Rules

1. **Never hardcode hex values in components.** Always use `colors.<token>` from `useTheme()`.
2. **No new tokens without updating this document and `Colors.ts`.**
3. **Gradients only on large surfaces** - full-width cards, page headers, FAB. Small elements stay flat.
4. **Gradient direction**: always top-to-bottom or top-left to bottom-right. Keep gradients subtle (about 2-3 HSL lightness points).
5. **Opacity variants**: derive with `rgba()` from the full-opacity token. Do not create separate alpha tokens unless app-wide reuse is needed (`ripple`, `shadow`, `overlay`).
6. **Contrast minimums** (WCAG AA):
   - `text` on `background` / `cardBackground` -> >= 4.5:1
   - `textSecondary` -> >= 4.5:1
   - `textTertiary` -> >= 3:1 (supplemental info only)
   - `buttonPrimaryText` on `buttonPrimary` -> >= 4.5:1
7. **Never convey information by color alone.** Always pair with an icon, text, or shape change.

---

## 3. Typography

### 3.1 Type Scale

System font only (San Francisco / Roboto). No custom fonts.

| Name         | Size | Weight | Line Height | When to use                               |
| ------------ | ---- | ------ | ----------- | ----------------------------------------- |
| `display`    | 28   | 700    | 34          | Hero numbers (stats, large timer readout) |
| `heading`    | 22   | 700    | 28          | Screen titles                             |
| `title`      | 18   | 600    | 24          | Section headers, card titles              |
| `body`       | 16   | 400    | 22          | Default text, item names                  |
| `bodyMedium` | 16   | 500    | 22          | Emphasized text, button labels            |
| `label`      | 14   | 500    | 18          | Input labels, metadata                    |
| `caption`    | 13   | 400    | 18          | Subtitles, secondary info                 |
| `small`      | 12   | 500    | 16          | Chips, tab labels, timestamps             |
| `tiny`       | 11   | 400    | 14          | Badge counts, tertiary metadata           |

### 3.2 Typography Rules

1. **Maximum two font weights per visual section.** Typically 600 for headings and 400 for body.
2. **Never use ALL CAPS** for body text. Reserve for very short labels only (≤ 3 words).
3. **Changing numbers** (timers, counters) must use `fontVariant: ["tabular-nums"]` for stable width.

---

## 4. Spacing & Layout

### 4.1 Spacing Scale (4pt grid)

All spacing must use these values. No exceptions.

| Token  | Value | Typical uses                               |
| ------ | ----- | ------------------------------------------ |
| `xxs`  | 2     | Tiny internal gaps                         |
| `xs`   | 4     | Icon-to-text tight coupling                |
| `sm`   | 8     | Chip padding, gap between stacked items    |
| `md`   | 12    | List item inner padding, sibling gaps      |
| `base` | 16    | Card horizontal padding, screen margins    |
| `lg`   | 20    | Card vertical padding, section gaps        |
| `xl`   | 24    | Between sections on a page                 |
| `xxl`  | 32    | Major separators, bottom sheet top padding |
| `xxxl` | 40    | Safe-area-aware spacing                    |

### 4.2 Layout Rules

1. **Screen horizontal margin**: always `base` (16).
2. **Card padding**: `base` (16) horizontal, `lg` (20) vertical.
3. **Never use spacing values outside the scale.** If you need 15 or 17, round to the nearest token.
4. **Bottom padding on scrollable screens**: at least `xxxl` (40) so FABs or tab bars don't obscure content.

---

## 5. Touch Targets & Pressable Elements

### 5.1 Minimum Sizes

| Element type      | Min touch area        | Notes                                                    |
| ----------------- | --------------------- | -------------------------------------------------------- |
| Primary button    | 48 height, full width |                                                          |
| Icon button       | 44 × 44               | The visual icon can be smaller; the tap area must not be |
| List item row     | 56 height             | Full width                                               |
| FAB               | 56 × 56               |                                                          |
| Toggle / checkbox | 44 × 44               | Tap area extends beyond the visual element               |

### 5.2 Pressable Distinction Rule

**Every pressable surface must be visually distinguishable from the background through at least two of:**

1. Different background color
2. A border (≥ 1px)
3. An elevation shadow

This ensures the user always knows what they can tap.

### 5.3 Press Feedback

Every `Pressable` / `TouchableOpacity` **must** have visual feedback:

- **Cards / list items**: ripple (`colors.ripple`) on Android, opacity dim on iOS.
- **Buttons**: scale 1.0 → 0.96 → 1.0 (120ms spring).
- **FAB**: scale 1.0 → 0.92 → 1.0 (200ms spring).
- **Icon buttons**: background opacity 0 → 15% of `primary`.

No "dead" pressables — if it responds to a tap, it must show it.

---

## 6. Elevation & Shadows

| Level         | Usage                                  | iOS                                   | Android               |
| ------------- | -------------------------------------- | ------------------------------------- | --------------------- |
| `elevation-0` | Flat backgrounds                       | none                                  | 0                     |
| `elevation-1` | Cards, list items, inputs              | opacity 0.06, offset {0,1}, radius 3  | elevation 2           |
| `elevation-2` | Bottom sheet, tab bar, raised sections | opacity 0.10, offset {0,2}, radius 6  | elevation 4           |
| `elevation-3` | FAB, dialogs, toasts                   | opacity 0.15, offset {0,4}, radius 10 | elevation 8           |
| `overlay`     | Modal backdrops                        | `colors.overlay` fill                 | `colors.overlay` fill |

**Shadow color**: always `colors.shadow` token. Never hardcode `#000`.

---

## 7. Border Radii

| Token         | Value | Usage                                      |
| ------------- | ----- | ------------------------------------------ |
| `radius-xs`   | 4     | Badges, tiny chips, progress bar tracks    |
| `radius-sm`   | 8     | Inputs, small buttons, tags                |
| `radius-md`   | 12    | Cards, sections, list containers           |
| `radius-lg`   | 16    | Modals, standalone pill buttons            |
| `radius-xl`   | 24    | Bottom sheet corners, pill-shaped elements |
| `radius-full` | 9999  | FAB, circular icon containers              |

### Radius Rules

1. **Nested elements use smaller radii than their parent.** Card is `radius-md` → inner elements are `radius-sm` at most.
2. **Consistency within groups**: if one card uses `radius-md`, all cards of that type use `radius-md`.
3. **Do not use values outside this scale.**

---

## 8. Iconography

- **Library**: `lucide-react-native` exclusively. No mixing icon libraries.
- **Sizes**: 24 (tab bar, primary), 22 (item icons), 20 (action buttons), 16 (metadata).
- **Stroke**: `strokeWidth: 2` for 24/20/16, `strokeWidth: 1.5` for 22 (item context, softer feel).
- **Color**: always a semantic token — `colors.icon`, `colors.primary`, `colors.error`, `colors.success`, `colors.textInverse`. Never arbitrary colors.
- **Emoji icons** (user-chosen): render at fontSize 22 inside a circular `primarySubtle` container. No border.

---

## 9. Component Behavior Rules

These rules apply to **any** component, current or future.

### 9.1 Buttons

| Variant     | Background          | Text color            | Border       |
| ----------- | ------------------- | --------------------- | ------------ |
| Primary     | `buttonPrimary`     | `buttonPrimaryText`   | none         |
| Secondary   | `buttonSecondary`   | `buttonSecondaryText` | 1px `border` |
| Destructive | `buttonDestructive` | `textInverse`         | none         |
| Disabled    | `buttonDisabled`    | `buttonDisabledText`  | none         |

- Primary buttons may have a subtle top-to-bottom gradient.
- **Disabled state**: use the disabled color tokens. Never dim via `opacity`. No shadow when disabled.
- Destructive buttons are always behind a confirmation step.

### 9.2 Text Inputs

- Background: `input`. Border: 1px `inputBorder` → `inputFocusBorder` on focus.
- Height: 48. Radius: `radius-sm`. Internal horizontal padding: `md` (12).
- Label above: `label` typography, `textSecondary`, gap `xs` (4) below label.
- Placeholder: `textTertiary`.

### 9.3 Cards & Surfaces

- Background: `cardBackground` (elevated) or `surface` (grouped).
- Radius: `radius-md`.
- Elevation: `elevation-1` minimum for cards that sit above a background.
- Internal padding: see spacing rules (Section 4.2).
- When a card contains a list, rows are separated by 1px `divider` lines, not margins.

### 9.4 Bottom Sheets & Modals

- Top corners: `radius-xl` (24).
- Handle: 40 × 4, `radius-full`, `border` color.
- Background: `cardBackground`.
- Backdrop: `overlay`.
- Max height: 70% of screen.

### 9.5 Empty States

- Centered in available space.
- Icon (48 × 48) in `iconMuted`.
- Message: `body` typography, `textSecondary`, centered.
- CTA button below with `lg` (20) gap.

### 9.6 Section Headers

- Icon (optional, inside `primarySubtle` circle, 28 × 28) + label.
- Text: `label` typography (14, 600), `textSecondary` color.
- Top margin: `xl` (24). Bottom margin: `sm` (8).
- No background or border — spatial separation only.

---

## 10. Animation & Motion

### 10.1 Principles

1. **Purposeful**: animate to show cause-and-effect. Never decorative.
2. **Fast**: 150–300ms. Never over 500ms.
3. **Spring-based**: prefer `react-native-reanimated` springs over linear/ease for natural feel.
4. **Non-blocking**: animations never prevent user input.

### 10.2 Standard Timings

| Interaction                      | Duration | Style                |
| -------------------------------- | -------- | -------------------- |
| Button press feedback            | 120ms    | Spring               |
| State change (completed, active) | 250ms    | Ease-out             |
| Sheet / modal open               | 300ms    | Spring (damping 0.8) |
| Sheet / modal close              | 250ms    | Ease-in              |
| Progress bar fill                | 300ms    | Ease-out             |
| Item dismiss                     | 200ms    | Ease-in              |

### 10.3 Reduced Motion

Respect `prefers-reduced-motion` via `useReducedMotion()` from reanimated:

- Skip decorative animations (background transitions, progress fills).
- Keep essential ones (sheet open/close) but reduce to 100ms.

### 10.4 Haptics

Use sparingly:

- Completing a habit: light impact.
- Timer auto-complete: success notification.
- Destructive action confirmed: warning.

---

## 11. Accessibility

1. **Touch targets**: 44 × 44 minimum (Section 5.1).
2. **Contrast**: WCAG AA (Section 2.3).
3. **Color + shape**: never color alone (Section 2.3, rule 7).
4. **Labels**: every interactive element needs `accessibilityLabel` or `accessibilityHint`.
5. **Roles**: `accessibilityRole="button"` for buttons, `"checkbox"` for toggles, etc.
6. **State**: use `accessibilityState={{ checked, disabled, selected }}`.
7. **Grouping**: compound elements (e.g., a card with icon + name + controls) should be a single focusable unit for screen readers when the whole card is tappable.

---

## 12. Do / Don't

### ✅ Do

- Use semantic color tokens for every color
- Use the 4pt spacing scale for all padding, margin, gap
- Use the border radius scale for all corners
- Provide press feedback on every touchable
- Test all theme and mode combinations before considering a component done
- Use `accessibilityLabel` on interactive elements
- Use gradients only on large surfaces
- Use `fontVariant: ["tabular-nums"]` for changing numbers
- Use `colors.shadow` for all shadows
- Keep max two font weights per visual section

### ❌ Don't

- Hardcode hex colors in components
- Use spacing values outside the 4pt scale
- Use `opacity` to create disabled states — use disabled tokens
- Add icon libraries besides `lucide-react-native`
- Make touch targets smaller than 44 × 44
- Create pressables without visual feedback
- Animate longer than 500ms
- Use horizontal or bottom-to-top gradients
- Use border radii outside the defined scale
- Convey info by color alone

---

## Appendix: Gradient Implementation

```tsx
import { LinearGradient } from "expo-linear-gradient";

<LinearGradient
  colors={[colors.gradientCardStart, colors.gradientCardEnd]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={styles.card}
>
  {children}
</LinearGradient>;
```

Gradients should be subtle — start and end colors differ by ≤ 3 HSL lightness points.
