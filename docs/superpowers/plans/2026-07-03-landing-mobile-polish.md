# Landing Mobile Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the landing page on mobile with better section spacing, scroll-triggered motion, and a touch swipe Explore carousel.

**Architecture:** Reuse the current static landing structure and centralize gallery activation in `landing/script.js` so clicks and swipes share state. Keep desktop CSS behavior intact while adding mobile-only layout and motion rules in `landing/styles.css`.

**Tech Stack:** Vanilla HTML, CSS media queries, DOM touch events, `IntersectionObserver`, Jest with jsdom.

---

### Task 1: Mobile Behavior Tests

**Files:**

- Modify: `landing/__tests__/landingStartup.test.js`

- [ ] **Step 1: Add failing tests for mobile gallery swipes, scroll-trigger setup, and CSS hooks**

Add tests that load `landing/script.js`, dispatch `DOMContentLoaded`, simulate a left swipe on `.gallery-display-wrapper`, verify the second gallery tab becomes active, verify `IntersectionObserver.observe` is called for mobile reveal targets, and verify `styles.css` contains mobile carousel and scroll-trigger selectors.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm test -- landing/__tests__/landingStartup.test.js --runInBand --watchman=false`
Expected: FAIL because swipe behavior and mobile active CSS hooks do not exist yet.

### Task 2: Mobile Gallery and Scroll Behavior

**Files:**

- Modify: `landing/script.js`
- Modify: `landing/index.html`

- [ ] **Step 1: Implement shared gallery activation**

Extract the existing tab click body into an `activateGalleryItem(imgKey, options)` helper. It updates tabs, screenshot, and description state.

- [ ] **Step 2: Implement mobile swipe navigation**

Add touch start/end listeners to `.gallery-display-wrapper`; left swipe activates the next tab, right swipe activates the previous tab.

- [ ] **Step 3: Implement mobile scroll-trigger active states**

Add `data-mobile-reveal` attributes to hover-motion elements and observe them with `IntersectionObserver` only on coarse-pointer mobile screens when reduced motion is not requested.

- [ ] **Step 4: Run targeted tests and verify pass**

Run: `npm test -- landing/__tests__/landingStartup.test.js --runInBand --watchman=false`
Expected: PASS.

### Task 3: Mobile CSS Polish

**Files:**

- Modify: `landing/styles.css`

- [ ] **Step 1: Adjust mobile spacing**

Under `@media (max-width: 600px)`, reduce section paddings and section header margins so the page reads as a continuous mobile landing flow.

- [ ] **Step 2: Add mobile carousel presentation**

Under `@media (max-width: 600px)`, make `.gallery-display-wrapper` a swipe target, place description before/after the phone cleanly as needed by current layout, and convert the tab buttons to compact carousel controls without losing accessibility.

- [ ] **Step 3: Add mobile active-state transforms**

Under coarse-pointer mobile conditions, map `.is-mobile-revealed` to the hover transform styles for feature cards, phone mockups, and primary motion targets.

- [ ] **Step 4: Run targeted tests and format check**

Run: `npm test -- landing/__tests__/landingStartup.test.js --runInBand --watchman=false`
Expected: PASS.

Run: `npm run format:check -- landing`
Expected: PASS or only unrelated formatting findings outside landing.
