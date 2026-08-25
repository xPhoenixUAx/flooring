/* ===== service-hero ===== */
(() => {
  const initServiceHero = (root) => {
    const serviceType = root.dataset.serviceType;
    if (!serviceType) return;

    requestAnimationFrame(() => {
      root.classList.add("is-ready");
    });
  };

  document.querySelectorAll("[data-service-hero]").forEach(initServiceHero);
})();


/* ===== project-situations ===== */
(() => {
  const sections = document.querySelectorAll("[data-project-situations]");
  if (!sections.length) return;

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12%", threshold: 0.16 }
  );

  sections.forEach((section) => observer.observe(section));
})();


/* ===== project-factors ===== */
(() => {
  const sections = document.querySelectorAll("[data-project-factors]");
  if (!sections.length) return;

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10%", threshold: 0.14 }
  );

  sections.forEach((section) => observer.observe(section));
})();


/* ===== service-process ===== */
(() => {
  const sections = document.querySelectorAll("[data-service-process]");
  if (!sections.length) return;

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10%", threshold: 0.12 }
  );

  sections.forEach((section) => observer.observe(section));
})();


/* ===== proposal-review ===== */
(() => {
  const sections = document.querySelectorAll("[data-proposal-review]");
  if (!sections.length) return;

  if (!("IntersectionObserver" in window)) {
    sections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10%", threshold: 0.1 }
  );

  sections.forEach((section) => observer.observe(section));
})();
