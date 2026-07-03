// YAHT Landing Page Interactive Script

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------------------------------
  // Theme & Color Scheme Switcher
  // -------------------------------------------------------------
  const htmlElement = document.documentElement;
  const themeBtns = document.querySelectorAll(".theme-btn");
  const schemeToggle = document.getElementById("scheme-toggle");
  const heroImage = document.getElementById("hero-image");
  const tabBtns = document.querySelectorAll(".gallery-tab-btn");
  const galleryImage = document.getElementById("gallery-image");

  // Default configuration keys
  const THEME_KEY = "yaht-landing-theme";
  const SCHEME_KEY = "yaht-landing-scheme";

  const getStoredPreference = (key, fallback) => {
    try {
      return localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  };

  // Retrieve active choices or fall back to Sepia Dark as default
  let currentTheme = window.YAHT_LANDING_BOOT?.theme || getStoredPreference(THEME_KEY, "sepia");
  let currentScheme = window.YAHT_LANDING_BOOT?.scheme || getStoredPreference(SCHEME_KEY, "dark");
  let currentGalleryImage = "today";

  const SCREENSHOT_DIR = "assets/images/screenshots";
  const screenshotPaths = {
    dark: {
      clear: {
        today: `${SCREENSHOT_DIR}/YAHT_dark_clear_today.jpg`,
        new: `${SCREENSHOT_DIR}/YAHT_dark_clear_new.jpg`,
        stats: `${SCREENSHOT_DIR}/YAHT_dark_clear_stats.jpg`,
        settings: `${SCREENSHOT_DIR}/YAHT_dark_clear_settings.jpg`,
      },
      sepia: {
        today: `${SCREENSHOT_DIR}/YAHT_dark_sepia_today.jpg`,
        new: `${SCREENSHOT_DIR}/YAHT_dark_sepia_new.jpg`,
        stats: `${SCREENSHOT_DIR}/YAHT_dark_sepia_stats.jpg`,
        settings: `${SCREENSHOT_DIR}/YAHT_dark_sepia_settings.jpg`,
      },
      oled: {
        today: `${SCREENSHOT_DIR}/YAHT_dark_oled_today.jpg`,
        new: `${SCREENSHOT_DIR}/YAHT_dark_oled_new.jpg`,
        stats: `${SCREENSHOT_DIR}/YAHT_dark_oled_stats.jpg`,
        settings: `${SCREENSHOT_DIR}/YAHT_dark_oled_settings.jpg`,
      },
    },
    light: {
      clear: {
        today: `${SCREENSHOT_DIR}/YAHT_light_clear_today.jpg`,
        new: `${SCREENSHOT_DIR}/YAHT_light_clear_new.jpg`,
        stats: `${SCREENSHOT_DIR}/YAHT_light_clear_stats.jpg`,
        settings: `${SCREENSHOT_DIR}/YAHT_light_clear_settings.jpg`,
      },
      sepia: {
        today: `${SCREENSHOT_DIR}/YAHT_light_sepia_today.jpg`,
        new: `${SCREENSHOT_DIR}/YAHT_light_sepia_new.jpg`,
        stats: `${SCREENSHOT_DIR}/YAHT_light_sepia_stats.jpg`,
        settings: `${SCREENSHOT_DIR}/YAHT_light_sepia_settings.jpg`,
      },
      oled: {
        today: `${SCREENSHOT_DIR}/YAHT_light_clear_today.jpg`,
        new: `${SCREENSHOT_DIR}/YAHT_light_clear_new.jpg`,
        stats: `${SCREENSHOT_DIR}/YAHT_light_clear_stats.jpg`,
        settings: `${SCREENSHOT_DIR}/YAHT_light_oled_settings.jpg`,
      },
    },
  };

  const getScreenshotPath = (screenKey, theme = currentTheme, scheme = currentScheme) => {
    return (
      screenshotPaths[scheme]?.[theme]?.[screenKey] ||
      screenshotPaths[scheme]?.clear?.[screenKey] ||
      screenshotPaths.dark.sepia[screenKey]
    );
  };

  const createCrossfader = window.YAHT?.createScreenshotCrossfader;
  const heroCrossfader = createCrossfader?.(heroImage);
  const galleryCrossfader = createCrossfader?.(galleryImage);

  const updateImageSource = (image, src, alt, fade = false) => {
    if (!image) {
      return;
    }

    const crossfader = image === heroImage ? heroCrossfader : galleryCrossfader;

    if (crossfader) {
      crossfader.update(src, alt, { animate: fade });
      return;
    }

    if (image.getAttribute("src") === src) {
      image.alt = alt;
      return;
    }

    if (!fade) {
      image.src = src;
      image.alt = alt;
      return;
    }

    image.style.opacity = "0";

    setTimeout(() => {
      image.src = src;
      image.alt = alt;
      image.style.opacity = "1";
    }, 300);
  };

  const syncScreenshots = (fadeScreenshots = false) => {
    updateImageSource(
      heroImage,
      getScreenshotPath("today"),
      `YAHT App Today checklist screen in ${currentScheme} ${currentTheme} theme`,
      fadeScreenshots
    );

    updateImageSource(
      galleryImage,
      getScreenshotPath(currentGalleryImage),
      `YAHT App ${currentGalleryImage} screen in ${currentScheme} ${currentTheme} theme`,
      fadeScreenshots
    );
  };

  // Set classes on root node
  function applyThemeAndScheme(theme, scheme, options = {}) {
    const { fadeScreenshots = true } = options;

    // Set Theme class (e.g. theme-sepia scheme-dark)
    htmlElement.className = `theme-${theme} scheme-${scheme}`;

    // Update Theme buttons active state
    themeBtns.forEach((btn) => {
      if (btn.getAttribute("data-theme") === theme) {
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.classList.remove("active");
        btn.setAttribute("aria-pressed", "false");
      }
    });

    // Store selected preferences
    try {
      localStorage.setItem(THEME_KEY, theme);
      localStorage.setItem(SCHEME_KEY, scheme);
    } catch {
      // Preference persistence is optional; visual state should still update.
    }

    syncScreenshots(fadeScreenshots);
  }

  // Initialize switcher state
  applyThemeAndScheme(currentTheme, currentScheme, { fadeScreenshots: false });

  // Event listener for theme buttons
  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTheme = btn.getAttribute("data-theme");
      applyThemeAndScheme(currentTheme, currentScheme);
    });
  });

  // Event listener for scheme toggle
  if (schemeToggle) {
    schemeToggle.addEventListener("click", () => {
      currentScheme = currentScheme === "light" ? "dark" : "light";
      applyThemeAndScheme(currentTheme, currentScheme);
    });
  }

  // -------------------------------------------------------------
  // Screenshot Gallery Navigation
  // -------------------------------------------------------------
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const imgKey = btn.getAttribute("data-img");
      currentGalleryImage = imgKey;

      // 1. Update active tab class
      tabBtns.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      // 2. Crossfade to the selected screenshot after the image has loaded
      if (galleryImage && getScreenshotPath(imgKey)) {
        updateImageSource(galleryImage, getScreenshotPath(imgKey), `YAHT App ${btn.textContent} Preview`, true);
      }

      // 3. Update description box with a coordinated 'move and fade' animation (eased)
      const currentActiveCard = document.querySelector(".desc-card.active");
      const targetCard = document.getElementById(`gallery-desc-${imgKey}`);

      if (currentActiveCard && currentActiveCard !== targetCard) {
        // Animate old text exiting to the left
        currentActiveCard.classList.remove("active");
        currentActiveCard.classList.add("slide-exit");
        currentActiveCard.hidden = false;

        setTimeout(() => {
          currentActiveCard.classList.remove("slide-exit");
          currentActiveCard.hidden = true;

          // Animate new text entering from the right
          if (targetCard) {
            targetCard.hidden = false;
            targetCard.classList.add("active", "slide-enter");
            setTimeout(() => {
              targetCard.classList.remove("slide-enter");
            }, 300);
          }
        }, 300);
      } else if (!currentActiveCard && targetCard) {
        targetCard.hidden = false;
        targetCard.classList.add("active");
      }
    });
  });

  // Lock the gallery card height to the first (largest) tab dynamically to prevent layout shifting
  const lockGalleryHeight = () => {
    const detailsContainer = document.querySelector(".gallery-details");
    if (detailsContainer) {
      detailsContainer.style.minHeight = "auto";
      detailsContainer.style.minHeight = `${detailsContainer.offsetHeight}px`;
    }
  };

  window.addEventListener("load", lockGalleryHeight);
  window.addEventListener("resize", lockGalleryHeight);
});
