(function (root, factory) {
  const exports = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = exports;
  } else {
    root.YAHT = root.YAHT || {};
    root.YAHT.createScreenshotCrossfader = exports.createScreenshotCrossfader;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DEFAULT_DURATION_MS = 300;

  const createScreenshotCrossfader = (initialImage, options = {}) => {
    if (!initialImage || !initialImage.parentElement) {
      return null;
    }

    const parent = initialImage.parentElement;
    const durationMs = options.durationMs ?? DEFAULT_DURATION_MS;
    const requestFrame =
      options.requestFrame ||
      (typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : (callback) => {
            callback();
          });
    const setTimer = options.setTimer || setTimeout;
    const clearTimer = options.clearTimer || clearTimeout;

    let activeImage = initialImage;
    let pendingImage = null;
    let outgoingImage = null;
    let cleanupTimer = null;
    let requestId = 0;

    activeImage.classList.add("screenshot-layer", "is-active");
    requestFrame(() => {
      parent.classList.add("is-crossfade-ready");
    });

    const removeImage = (image) => {
      if (!image) {
        return;
      }

      if (typeof image.remove === "function") {
        image.remove();
      } else if (image.parentElement) {
        image.parentElement.removeChild(image);
      }
    };

    const removePendingImage = () => {
      if (!pendingImage) {
        return;
      }

      pendingImage.removeEventListener("load", pendingImage.__yahtReveal);
      pendingImage.removeEventListener("error", pendingImage.__yahtReveal);
      removeImage(pendingImage);
      pendingImage = null;
    };

    const transferStableId = (fromImage, toImage) => {
      const stableId = fromImage.getAttribute("id");

      if (!stableId) {
        return;
      }

      fromImage.removeAttribute("id");
      toImage.setAttribute("id", stableId);
    };

    const finishOutgoingCleanup = () => {
      if (!outgoingImage) {
        return;
      }

      transferStableId(outgoingImage, activeImage);
      removeImage(outgoingImage);
      outgoingImage = null;

      if (cleanupTimer) {
        clearTimer(cleanupTimer);
        cleanupTimer = null;
      }
    };

    const setImageSource = (image, src, alt) => {
      image.setAttribute("alt", alt);
      image.setAttribute("src", src);
    };

    const update = (src, alt, updateOptions = {}) => {
      const shouldAnimate = updateOptions.animate !== false;

      if (!src) {
        return;
      }

      if (!pendingImage && activeImage.getAttribute("src") === src) {
        activeImage.setAttribute("alt", alt);
        return;
      }

      requestId += 1;
      const currentRequestId = requestId;

      removePendingImage();
      finishOutgoingCleanup();

      if (!shouldAnimate) {
        setImageSource(activeImage, src, alt);
        activeImage.classList.add("is-active");
        return;
      }

      const nextImage = activeImage.cloneNode(false);
      nextImage.classList.add("screenshot-layer");
      nextImage.classList.remove("is-active");
      nextImage.removeAttribute("id");
      nextImage.setAttribute("loading", "eager");
      nextImage.setAttribute("alt", alt);

      const reveal = () => {
        if (currentRequestId !== requestId) {
          return;
        }

        nextImage.removeEventListener("load", reveal);
        nextImage.removeEventListener("error", reveal);

        requestFrame(() => {
          if (currentRequestId !== requestId) {
            return;
          }

          const previousImage = activeImage;

          nextImage.classList.add("is-active");
          activeImage = nextImage;
          pendingImage = null;
          outgoingImage = previousImage;

          cleanupTimer = setTimer(() => {
            finishOutgoingCleanup();
          }, durationMs);
        });
      };

      nextImage.__yahtReveal = reveal;
      nextImage.addEventListener("load", reveal);
      nextImage.addEventListener("error", reveal);
      parent.appendChild(nextImage);
      pendingImage = nextImage;
      nextImage.setAttribute("src", src);

      if (nextImage.complete) {
        reveal();
      }
    };

    return {
      update,
      getActiveImage: () => activeImage,
    };
  };

  return {
    createScreenshotCrossfader,
  };
});
