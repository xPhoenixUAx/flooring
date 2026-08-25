(function () {
  "use strict";

  requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));

  const media = document.querySelector(".hero-picture img");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = window.matchMedia("(min-width: 900px)");
  if (!media || reduceMotion.matches || !desktop.matches) return;

  let ticking = false;
  const renderDepth = () => {
    const offset = Math.min(window.scrollY * 0.035, 18);
    media.style.transform = `scale(1.025) translate3d(0, ${offset}px, 0)`;
    ticking = false;
  };

  media.addEventListener("animationend", () => {
    media.style.transform = "scale(1.025)";
  }, { once: true });
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(renderDepth);
    },
    { passive: true }
  );
})();
