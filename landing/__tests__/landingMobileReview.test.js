/**
 * @jest-environment jsdom
 */

const fs = require("fs");
const path = require("path");

describe("landing mobile review refinements", () => {
  beforeEach(() => {
    jest.resetModules();
    document.documentElement.className = "theme-sepia scheme-dark";
    document.body.innerHTML = `
      <button class="theme-btn active" data-theme="sepia">Sepia</button>
      <button id="scheme-toggle"></button>
      <div class="gallery-tabs">
        <button class="gallery-tab-btn active" data-img="today" aria-selected="true">Today</button>
        <button class="gallery-tab-btn" data-img="new" aria-selected="false">Create Habits</button>
      </div>
      <div class="gallery-display-wrapper" data-mobile-reveal>
        <div class="gallery-track">
          <div class="gallery-slide active" data-img="today">
            <img src="assets/images/screenshots/YAHT_dark_sepia_today.jpg" />
          </div>
          <div class="gallery-slide" data-img="new">
            <img src="assets/images/screenshots/YAHT_dark_sepia_new.jpg" />
          </div>
        </div>
        <div class="gallery-details">
          <div id="gallery-desc-today" class="desc-card active" role="tabpanel">Today description</div>
          <div id="gallery-desc-new" class="desc-card" role="tabpanel">New description</div>
        </div>
      </div>
      <div class="feature-card" data-mobile-reveal>Top feature</div>
      <div class="feature-card" data-mobile-reveal>Middle feature</div>
      <div class="feature-card" data-mobile-reveal>Bottom feature</div>
    `;

    localStorage.clear();
    delete window.YAHT;
    delete window.IntersectionObserver;
    delete window.matchMedia;
  });

  const setMatchMedia = ({ mobile = false, reducedMotion = false } = {}) => {
    window.matchMedia = jest.fn((query) => ({
      matches: query.includes("prefers-reduced-motion") ? reducedMotion : mobile,
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  };

  it("highlights only the visible feature card closest to the viewport middle", () => {
    setMatchMedia({ mobile: true, reducedMotion: false });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });

    let revealCallback;
    window.IntersectionObserver = jest.fn(function IntersectionObserver(callback) {
      revealCallback = callback;
      this.observe = jest.fn();
      this.unobserve = jest.fn();
      this.disconnect = jest.fn();
    });

    const featureCards = [...document.querySelectorAll(".feature-card")];
    featureCards[0].getBoundingClientRect = () => ({ top: 40, bottom: 240, height: 200 });
    featureCards[1].getBoundingClientRect = () => ({ top: 300, bottom: 500, height: 200 });
    featureCards[2].getBoundingClientRect = () => ({ top: 560, bottom: 760, height: 200 });

    require("../script.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    revealCallback(featureCards.map((target) => ({ isIntersecting: true, target })));

    expect(featureCards.map((card) => card.classList.contains("is-mobile-revealed"))).toEqual([false, true, false]);
  });

  it("syncs tabs, slides, and description when the snap track is swiped", () => {
    setMatchMedia({ mobile: true, reducedMotion: true });
    window.requestAnimationFrame = (callback) => {
      callback();
      return 0;
    };

    require("../script.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    const track = document.querySelector(".gallery-track");
    Object.defineProperty(track, "clientWidth", { configurable: true, value: 200 });
    Object.defineProperty(track, "scrollLeft", { configurable: true, value: 200 });

    track.dispatchEvent(new Event("scroll"));

    const tabs = [...document.querySelectorAll(".gallery-tab-btn")];
    expect(tabs.map((tab) => tab.classList.contains("active"))).toEqual([false, true]);
    expect(tabs.map((tab) => tab.getAttribute("aria-selected"))).toEqual(["false", "true"]);

    const slides = [...document.querySelectorAll(".gallery-slide")];
    expect(slides.map((slide) => slide.classList.contains("active"))).toEqual([false, true]);

    expect(document.getElementById("gallery-desc-today").classList.contains("active")).toBe(false);
    expect(document.getElementById("gallery-desc-new").classList.contains("active")).toBe(true);
  });

  it("activates slides and description from tab clicks", () => {
    setMatchMedia({ mobile: false, reducedMotion: true });

    require("../script.js");
    document.dispatchEvent(new Event("DOMContentLoaded"));

    document.querySelector('.gallery-tab-btn[data-img="new"]').click();

    const slides = [...document.querySelectorAll(".gallery-slide")];
    expect(slides.map((slide) => slide.classList.contains("active"))).toEqual([false, true]);
    expect(document.getElementById("gallery-desc-new").classList.contains("active")).toBe(true);
  });

  it("uses a snap-scrolling carousel with dots and a swipe hint on mobile", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).toContain(".gallery-dot");
    expect(css).toContain(".gallery-swipe-hint");
    expect(css).not.toContain(".gallery-arrow");
  });
});
