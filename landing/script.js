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
  const galleryTabs = document.querySelector(".gallery-tabs");
  const galleryTrack = document.querySelector(".gallery-track");
  const gallerySlides = Array.from(document.querySelectorAll(".gallery-slide"));
  const galleryKeys = gallerySlides.map((slide) => slide.getAttribute("data-img")).filter(Boolean);

  // Must match the mobile breakpoint used in styles.css (@media (max-width: 600px))
  const MOBILE_MAX_WIDTH_PX = 600;
  const mobileGalleryQuery = window.matchMedia?.(`(max-width: ${MOBILE_MAX_WIDTH_PX}px)`);

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

  // Must match the allowlists in the boot script in index.html
  const ALLOWED_THEMES = ["sepia", "clear", "oled"];
  const ALLOWED_SCHEMES = ["dark", "light"];

  // Retrieve active choices or fall back to Sepia Dark as default
  let currentTheme = window.YAHT_LANDING_BOOT?.theme || getStoredPreference(THEME_KEY, "sepia");
  let currentScheme = window.YAHT_LANDING_BOOT?.scheme || getStoredPreference(SCHEME_KEY, "dark");

  if (!ALLOWED_THEMES.includes(currentTheme)) {
    currentTheme = "sepia";
  }

  if (!ALLOWED_SCHEMES.includes(currentScheme)) {
    currentScheme = "dark";
  }

  let currentGalleryImage = "today";

  const SCREENSHOT_DIR = "assets/images/screenshots";

  const getScreenshotPath = (screenKey, theme = currentTheme, scheme = currentScheme) => {
    // OLED light renders with the clear light palette, so it reuses the clear
    // screenshots — except settings, where the visible theme toggle differs.
    if (scheme === "light" && theme === "oled" && screenKey !== "settings") {
      theme = "clear";
    }

    return `${SCREENSHOT_DIR}/YAHT_${scheme}_${theme}_${screenKey}.jpg`;
  };

  const createCrossfader = window.YAHT?.createScreenshotCrossfader;
  const heroCrossfader = createCrossfader?.(heroImage);

  // Tracks the most recently requested src per image so a stale preload
  // finishing late can't overwrite a newer theme choice.
  const pendingImageSrc = new WeakMap();

  const updateImageSource = (image, src, alt, fade = false) => {
    if (!image) {
      return;
    }

    if (heroCrossfader && image === heroImage) {
      heroCrossfader.update(src, alt, { animate: fade });
      return;
    }

    image.alt = alt;

    if (image.getAttribute("src") === src) {
      pendingImageSrc.delete(image);
      return;
    }

    // Warm the cache before swapping so the phone screen never flashes black
    pendingImageSrc.set(image, src);
    const loader = new Image();
    loader.onload = loader.onerror = () => {
      if (pendingImageSrc.get(image) === src) {
        pendingImageSrc.delete(image);
        image.src = src;
      }
    };
    loader.src = src;
  };

  const syncScreenshots = (fadeScreenshots = false) => {
    updateImageSource(
      heroImage,
      getScreenshotPath("today"),
      `YAHT App Today checklist screen in ${currentScheme} ${currentTheme} theme`,
      fadeScreenshots
    );

    gallerySlides.forEach((slide) => {
      const screenKey = slide.getAttribute("data-img");
      const slideImage = slide.querySelector("img");

      if (screenKey && slideImage) {
        updateImageSource(
          slideImage,
          getScreenshotPath(screenKey),
          `YAHT App ${screenKey} screen in ${currentScheme} ${currentTheme} theme`
        );
      }
    });
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
  const galleryDetails = document.querySelector(".gallery-details");
  const galleryDots = document.querySelectorAll(".gallery-dot");
  const isMobileGallery = () => Boolean(mobileGalleryQuery?.matches);
  let descAnimationTimer = null;
  let suppressScrollSync = false;
  let suppressScrollSyncTimer = null;

  // Center the active chip within the scrollable tab row (mobile)
  const scrollTabIntoView = (button) => {
    if (!galleryTabs || galleryTabs.scrollWidth <= galleryTabs.clientWidth) {
      return;
    }

    galleryTabs.scrollTo({
      left: button.offsetLeft - (galleryTabs.clientWidth - button.offsetWidth) / 2,
      behavior: "smooth",
    });
  };

  const showDescriptionCard = (imgKey, direction, animate) => {
    const currentActiveCard = document.querySelector(".desc-card.active");
    const targetCard = document.getElementById(`gallery-desc-${imgKey}`);

    if (!targetCard || currentActiveCard === targetCard) {
      return;
    }

    if (descAnimationTimer) {
      clearTimeout(descAnimationTimer);
      descAnimationTimer = null;
    }

    document.querySelectorAll(".desc-card").forEach((card) => {
      card.classList.remove("slide-exit", "slide-enter");
    });

    galleryDetails?.style.setProperty("--slide-dir", String(direction));

    if (currentActiveCard) {
      currentActiveCard.classList.remove("active");
    }

    targetCard.classList.add("active");

    if (animate && currentActiveCard) {
      currentActiveCard.classList.add("slide-exit");
      targetCard.classList.add("slide-enter");

      descAnimationTimer = setTimeout(() => {
        currentActiveCard.classList.remove("slide-exit");
        targetCard.classList.remove("slide-enter");
        descAnimationTimer = null;
      }, 320);
    }
  };

  const activateGalleryItem = (imgKey, options = {}) => {
    const { scrollTrack = true } = options;
    const targetButton = Array.from(tabBtns).find((btn) => btn.getAttribute("data-img") === imgKey);

    if (!imgKey || !targetButton || imgKey === currentGalleryImage) {
      return;
    }

    const previousIndex = galleryKeys.indexOf(currentGalleryImage);
    const nextIndex = galleryKeys.indexOf(imgKey);
    currentGalleryImage = imgKey;

    tabBtns.forEach((tab) => {
      tab.classList.remove("active");
      tab.setAttribute("aria-selected", "false");
    });
    targetButton.classList.add("active");
    targetButton.setAttribute("aria-selected", "true");
    scrollTabIntoView(targetButton);

    galleryDots.forEach((dot) => {
      dot.classList.toggle("active", dot.getAttribute("data-img") === imgKey);
    });

    // Desktop crossfades between stacked slides; on mobile all slides stay visible
    gallerySlides.forEach((slide) => {
      slide.classList.toggle("active", slide.getAttribute("data-img") === imgKey);
    });

    // On mobile, glide the snap track to the selected slide
    if (scrollTrack && galleryTrack && isMobileGallery() && nextIndex >= 0) {
      suppressScrollSync = true;
      clearTimeout(suppressScrollSyncTimer);
      suppressScrollSyncTimer = setTimeout(() => {
        suppressScrollSync = false;
      }, 700);

      galleryTrack.scrollTo({
        left: nextIndex * galleryTrack.clientWidth,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    }

    showDescriptionCard(imgKey, nextIndex >= previousIndex ? 1 : -1, !prefersReducedMotion);
  };

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activateGalleryItem(btn.getAttribute("data-img"));
    });
  });

  // Keep tabs and description in sync while the user swipes the snap track
  if (galleryTrack && galleryKeys.length > 1) {
    let scrollSyncFrame = null;

    galleryTrack.addEventListener(
      "scroll",
      () => {
        if (!isMobileGallery() || suppressScrollSync || scrollSyncFrame) {
          return;
        }

        scrollSyncFrame = requestAnimationFrame(() => {
          scrollSyncFrame = null;
          const slideWidth = galleryTrack.clientWidth;

          if (!slideWidth) {
            return;
          }

          const index = Math.round(galleryTrack.scrollLeft / slideWidth);
          const imgKey = galleryKeys[Math.max(0, Math.min(index, galleryKeys.length - 1))];

          if (imgKey && imgKey !== currentGalleryImage) {
            activateGalleryItem(imgKey, { scrollTrack: false });
          }
        });
      },
      { passive: true }
    );

    galleryTrack.addEventListener("scrollend", () => {
      clearTimeout(suppressScrollSyncTimer);
      suppressScrollSync = false;
    });
  }

  // -------------------------------------------------------------
  // Mobile scroll-triggered motion
  // -------------------------------------------------------------
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const isCoarseMobile = window.matchMedia?.(
    `(hover: none) and (pointer: coarse), (max-width: ${MOBILE_MAX_WIDTH_PX}px)`
  )?.matches;
  const mobileRevealTargets = document.querySelectorAll("[data-mobile-reveal]");

  if (!prefersReducedMotion && isCoarseMobile && "IntersectionObserver" in window && mobileRevealTargets.length > 0) {
    const featureRevealTargets = Array.from(mobileRevealTargets).filter((target) =>
      target.classList.contains("feature-card")
    );
    const visibleFeatureTargets = new Set();
    const updateCenteredFeatureReveal = () => {
      if (visibleFeatureTargets.size === 0) {
        featureRevealTargets.forEach((target) => target.classList.remove("is-mobile-revealed"));
        return;
      }

      const viewportMiddle = window.innerHeight / 2;
      let centeredTarget;
      let shortestDistance = Number.POSITIVE_INFINITY;

      visibleFeatureTargets.forEach((target) => {
        const rect = target.getBoundingClientRect();
        const targetMiddle = rect.top + rect.height / 2;
        const distance = Math.abs(targetMiddle - viewportMiddle);

        if (distance < shortestDistance) {
          shortestDistance = distance;
          centeredTarget = target;
        }
      });

      featureRevealTargets.forEach((target) => {
        target.classList.toggle("is-mobile-revealed", target === centeredTarget);
      });
    };

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target.classList.contains("feature-card")) {
            if (entry.isIntersecting) {
              visibleFeatureTargets.add(entry.target);
            } else {
              visibleFeatureTargets.delete(entry.target);
            }

            return;
          }

          if (entry.isIntersecting) {
            entry.target.classList.add("is-mobile-revealed");
          } else {
            entry.target.classList.remove("is-mobile-revealed");
          }
        });

        updateCenteredFeatureReveal();
      },
      { rootMargin: "-10% 0px -25%", threshold: 0.35 }
    );

    mobileRevealTargets.forEach((target) => {
      revealObserver.observe(target);
    });

    window.addEventListener("scroll", updateCenteredFeatureReveal, { passive: true });
    window.addEventListener("resize", updateCenteredFeatureReveal);
  } else {
    mobileRevealTargets.forEach((target) => {
      if (!target.classList.contains("feature-card")) {
        target.classList.add("is-mobile-revealed");
      }
    });
  }
});
