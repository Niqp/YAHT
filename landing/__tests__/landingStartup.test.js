/**
 * @jest-environment jsdom
 */

const fs = require("fs");
const path = require("path");

describe("landing startup rendering", () => {
  beforeEach(() => {
    jest.resetModules();
    document.documentElement.className = "theme-sepia scheme-dark";
    document.body.innerHTML = `
      <button class="theme-btn active" data-theme="sepia">Sepia</button>
      <button class="theme-btn" data-theme="clear">Clear</button>
      <button id="scheme-toggle"></button>
      <button class="gallery-tab-btn active" data-img="today">Today</button>
      <div class="hero-mockup-wrapper">
        <div class="screenshot-wrapper">
          <img id="hero-image" src="assets/images/screenshots/YAHT_dark_sepia_today.jpg" />
        </div>
      </div>
      <div class="gallery-display-wrapper">
        <div class="screenshot-wrapper">
          <img id="gallery-image" src="assets/images/screenshots/YAHT_dark_sepia_today.jpg" />
        </div>
      </div>
      <div class="gallery-details"></div>
    `;

    localStorage.clear();
    localStorage.setItem("yaht-landing-theme", "clear");
    localStorage.setItem("yaht-landing-scheme", "light");
  });

  it("does not animate saved screenshot synchronization during startup", () => {
    const updates = [];
    window.YAHT = {
      createScreenshotCrossfader: (image) => ({
        update: (src, alt, options) => {
          updates.push({ id: image.id, src, alt, options });
        },
      }),
    };

    require("../script.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    expect(updates).toEqual([
      expect.objectContaining({
        id: "hero-image",
        src: "assets/images/screenshots/YAHT_light_clear_today.jpg",
        options: { animate: false },
      }),
      expect.objectContaining({
        id: "gallery-image",
        src: "assets/images/screenshots/YAHT_light_clear_today.jpg",
        options: { animate: false },
      }),
    ]);
  });

  it("loads the stored theme boot script before render-blocking styles", () => {
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    const bootScriptIndex = html.indexOf("landingThemeBoot");
    const stylesheetIndex = html.indexOf('<link rel="stylesheet" href="styles.css"');

    expect(bootScriptIndex).toBeGreaterThan(-1);
    expect(stylesheetIndex).toBeGreaterThan(-1);
    expect(bootScriptIndex).toBeLessThan(stylesheetIndex);
  });

  it("requests Google Fonts with fallback font swapping", () => {
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

    expect(html).toContain("display=swap");
    expect(html).not.toContain("display=block");
  });

  it("does not hardcode the active theme button before the booted theme is known", () => {
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

    expect(html).not.toMatch(/class="theme-btn active"/);
    expect(css).toContain("width: 64px");
    expect(css).toContain('html.theme-sepia .theme-btn[data-theme="sepia"]');
    expect(css).toContain('html.theme-clear .theme-btn[data-theme="clear"]');
    expect(css).toContain('html.theme-oled .theme-btn[data-theme="oled"]');
  });

  it("uses the approved neutral coffee palette for light sepia", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
    const lightSepiaRule = css.match(/html\.theme-sepia\.scheme-light \{[\s\S]*?\n\}/)?.[0] || "";

    expect(lightSepiaRule).toContain("--bg-app: #fbf7f1");
    expect(lightSepiaRule).toContain("--bg-surface: #fffdf9");
    expect(lightSepiaRule).toContain("--bg-inset: #f6eadc");
    expect(lightSepiaRule).toContain("--text-primary: #2f1f1a");
    expect(lightSepiaRule).toContain("--text-secondary: #715f54");
    expect(lightSepiaRule).toContain("--accent: #8d6140");
    expect(lightSepiaRule).toContain("--accent-muted: #b98d62");
    expect(lightSepiaRule).toContain("--gradient-header-start: #e8d0b5");
    expect(lightSepiaRule).toContain("--gradient-header-mid: #f5e8d9");
    expect(lightSepiaRule).toContain("--gradient-header-end: #fbf7f1");
  });

  it("uses the approved dark mocha palette for dark sepia", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
    const darkSepiaRule = css.match(/html\.theme-sepia\.scheme-dark \{[\s\S]*?\n\}/)?.[0] || "";

    expect(darkSepiaRule).toContain("--bg-app: #16110d");
    expect(darkSepiaRule).toContain("--bg-surface: #241b14");
    expect(darkSepiaRule).toContain("--bg-surface-elevated: #2e241b");
    expect(darkSepiaRule).toContain("--bg-inset: #3a2e22");
    expect(darkSepiaRule).toContain("--text-primary: #f5e8d6");
    expect(darkSepiaRule).toContain("--text-secondary: #d1c0a9");
    expect(darkSepiaRule).toContain("--accent: #d0ad73");
    expect(darkSepiaRule).toContain("--accent-muted: #bc925a");
    expect(darkSepiaRule).toContain("--gradient-header-start: #231a12");
    expect(darkSepiaRule).toContain("--gradient-header-mid: #1c150f");
    expect(darkSepiaRule).toContain("--gradient-header-end: #16110d");
  });

  it("gates screenshot opacity transitions until crossfader setup is complete", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
    const baseImageRule = css.match(/\.mockup-img,\n\.gallery-screenshot-img \{[\s\S]*?\n\}/)?.[0] || "";

    expect(baseImageRule).not.toContain("transition: opacity");
    expect(css).toContain(".screenshot-wrapper.is-crossfade-ready .screenshot-layer");
  });

  it("uses a shared lighter phone hardware material for light schemes only", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

    expect(css).toContain("--phone-casing: #27272a");
    expect(css).toContain("html.scheme-light");
    expect(css).toContain("--phone-casing: #4f5863");
    expect(css).toContain("border: 10px solid var(--phone-casing)");
    expect(css).toContain("background-color: var(--phone-casing)");
  });

  it("does not pass hex color variables into rgba", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

    expect(css).not.toContain("rgba(var(");
  });

  it("keeps the App Store badge visibly disabled until the listing exists", () => {
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");
    const appStoreMarkup =
      html.match(/<!-- Apple App Store Badge -->[\s\S]*?<!-- Google Play Store Badge -->/)?.[0] || "";

    expect(appStoreMarkup).toContain('class="store-badge-btn store-badge-btn-disabled"');
    expect(appStoreMarkup).toContain('aria-disabled="true"');
    expect(appStoreMarkup).not.toContain("href=");
    expect(css).toContain(".store-badge-btn-disabled");
    expect(css).toContain("filter: grayscale(1)");
  });

  it("exposes selected state on theme and gallery controls", () => {
    const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-controls="gallery-desc-today"');
  });

  it("respects reduced-motion preferences", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("scroll-behavior: auto");
  });

  it("marks the screenshot wrapper crossfade-ready after the initial layer is active", () => {
    const { createScreenshotCrossfader } = require("../screenshotCrossfade.js");
    const wrapper = document.createElement("div");
    const image = document.createElement("img");
    let frameCallback;

    image.src = "assets/images/screenshots/YAHT_dark_sepia_today.jpg";
    wrapper.appendChild(image);

    createScreenshotCrossfader(image, {
      requestFrame: (callback) => {
        frameCallback = callback;
      },
    });

    expect(image.classList.contains("screenshot-layer")).toBe(true);
    expect(image.classList.contains("is-active")).toBe(true);
    expect(wrapper.classList.contains("is-crossfade-ready")).toBe(false);

    frameCallback();

    expect(wrapper.classList.contains("is-crossfade-ready")).toBe(true);
  });
});
