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
      <button class="gallery-tab-btn active" data-img="today">Today</button>
      <button class="gallery-tab-btn" data-img="new">Create Habits</button>
      <div class="gallery-display-wrapper" data-mobile-reveal>
        <div class="screenshot-wrapper">
          <img id="gallery-image" src="assets/images/screenshots/YAHT_dark_sepia_today.jpg" />
        </div>
        <div class="gallery-details">
          <div id="gallery-desc-today" class="desc-card active" role="tabpanel">Today description</div>
          <div id="gallery-desc-new" class="desc-card" role="tabpanel" hidden>New description</div>
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

  it("defines the redesigned mobile Explore carousel layout", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "styles.css"), "utf8");

    expect(css).toContain("display: contents");
    expect(css).toContain("background-color: transparent");
    expect(css).toContain("border: none");
    expect(css).toContain("order: 3");
    expect(css).toContain("font-size: 0.68rem");
    expect(css).toContain("width: min(180px, 48vw)");
    expect(css).toContain("padding: 1rem");
  });
});
