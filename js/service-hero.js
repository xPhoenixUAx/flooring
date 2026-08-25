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
