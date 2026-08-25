(() => {
  const section = document.querySelector("[data-match-route]");
  if (!section) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    section.classList.add("is-visible");
    return;
  }

  section.classList.add("is-animated");
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    section.classList.add("is-visible");
    observer.disconnect();
  }, { threshold: 0.08 });

  observer.observe(section);
})();
