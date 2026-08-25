(function () {
  "use strict";

  const section = document.querySelector("[data-about]");
  if (!section) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    section.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        section.classList.add("is-visible");
        observer.disconnect();
      });
    },
    { threshold: 0.16 }
  );

  observer.observe(section);
})();
