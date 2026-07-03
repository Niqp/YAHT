# Landing Mobile Polish Design

## Goal

Improve the mobile landing page by tightening vertical rhythm, translating desktop hover motion into scroll-triggered mobile motion, and turning the Explore section into a simple touch swipe carousel.

## Scope

- Keep the desktop landing layout and tab behavior intact.
- Adjust mobile section spacing under the existing `max-width: 600px` breakpoint.
- Reuse the existing Explore screenshot and description state instead of duplicating slide markup.
- Add mobile touch swipe support for the existing four gallery tabs.
- Add scroll-triggered mobile motion for elements that currently rely on hover-only transforms.
- Respect `prefers-reduced-motion: reduce`.

## Approach

The landing page is vanilla HTML, CSS, and JavaScript. Mobile behavior will be implemented with small DOM helpers in `landing/script.js`: a gallery activation helper shared by clicks and swipes, a touch handler that changes the active gallery item, and an `IntersectionObserver` that toggles a mobile active class on hover-capable elements. CSS will keep desktop hover rules unchanged and add mobile-only carousel, spacing, and active-state rules.

## Testing

`landing/__tests__/landingStartup.test.js` will cover mobile swipe navigation, mobile scroll-trigger setup, reduced-motion opt-out, and the presence of mobile carousel CSS hooks. Existing screenshot/theme startup tests must continue to pass.
