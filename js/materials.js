(function () {
  "use strict";

  const section = document.querySelector("[data-surface-library]");
  if (!section) return;

  const materials = ["hardwood", "luxury-vinyl", "laminate", "tile", "carpet"];
  const tabs = Array.from(section.querySelectorAll("[data-material]"));
  const panels = Array.from(section.querySelectorAll("[data-material-panel]"));
  const heroLinks = Array.from(document.querySelectorAll("[data-hero-material]"));
  const previous = section.querySelector("[data-material-prev]");
  const next = section.querySelector("[data-material-next]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeMaterialIndex = 0;
  let transitionTimer = 0;

  const normalizeIndex = (index) => (index + materials.length) % materials.length;
  const hashFor = (material) => `#materials-${material}`;

  const indexFromHash = () => {
    const material = materials.find((item) => hashFor(item) === window.location.hash);
    return material ? materials.indexOf(material) : -1;
  };

  const preloadPanel = (index) => {
    panels[index]?.querySelectorAll('img[loading="lazy"]').forEach((image) => {
      image.loading = "eager";
    });
  };

  const centerActiveTab = (tab) => {
    if (!tab || window.innerWidth >= 1200) return;
    tab.scrollIntoView({
      behavior: reduceMotion.matches ? "auto" : "smooth",
      block: "nearest",
      inline: "center"
    });
  };

  const updateTabs = (index, focusTab) => {
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    const activeTab = tabs[index];
    centerActiveTab(activeTab);
    if (focusTab) activeTab?.focus({ preventScroll: true });
  };

  const updatePanels = (index, animate) => {
    window.clearTimeout(transitionTimer);
    panels.forEach((panel, panelIndex) => {
      const active = panelIndex === index;
      panel.classList.toggle("is-active", active);
      panel.classList.remove("is-entering");
      panel.hidden = !active;
    });

    const activePanel = panels[index];
    if (!activePanel || !animate || reduceMotion.matches) return;
    requestAnimationFrame(() => activePanel.classList.add("is-entering"));
    transitionTimer = window.setTimeout(() => activePanel.classList.remove("is-entering"), 850);
  };

  const updateHeroRail = (index) => {
    const material = materials[index];
    heroLinks.forEach((link) => {
      const active = link.dataset.heroMaterial === material;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const updateHash = (material) => {
    const hash = hashFor(material);
    if (window.location.hash === hash) return;
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
  };

  const setActiveMaterial = (index, options = {}) => {
    const normalizedIndex = normalizeIndex(index);
    const {
      animate = true,
      focusTab = false,
      writeHash = true,
      scrollToSection = false
    } = options;

    const changed = normalizedIndex !== activeMaterialIndex;
    activeMaterialIndex = normalizedIndex;
    preloadPanel(activeMaterialIndex);
    updateTabs(activeMaterialIndex, focusTab);
    updatePanels(activeMaterialIndex, animate && changed);
    updateHeroRail(activeMaterialIndex);
    if (writeHash) updateHash(materials[activeMaterialIndex]);

    if (scrollToSection) {
      requestAnimationFrame(() => {
        section.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "start"
        });
      });
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setActiveMaterial(index));
    tab.addEventListener("pointerenter", () => preloadPanel(index));
    tab.addEventListener("focus", () => preloadPanel(index));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = null;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = index + 1;
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = index - 1;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = materials.length - 1;
      if (nextIndex === null) return;
      event.preventDefault();
      setActiveMaterial(nextIndex, { focusTab: true });
    });
  });

  previous?.addEventListener("click", () => setActiveMaterial(activeMaterialIndex - 1));
  next?.addEventListener("click", () => setActiveMaterial(activeMaterialIndex + 1));

  heroLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const index = materials.indexOf(link.dataset.heroMaterial);
      if (index < 0) return;
      event.preventDefault();
      setActiveMaterial(index, { scrollToSection: true });
    });
  });

  window.addEventListener("hashchange", () => {
    const index = indexFromHash();
    if (index >= 0) setActiveMaterial(index, { writeHash: false, scrollToSection: true });
  });

  window.addEventListener("site:material-select", (event) => {
    const index = materials.indexOf(event.detail?.material);
    if (index >= 0) setActiveMaterial(index, { scrollToSection: true });
  });

  section.classList.add("is-enhanced");
  const initialIndex = indexFromHash();
  setActiveMaterial(initialIndex >= 0 ? initialIndex : 0, {
    animate: false,
    writeHash: false,
    scrollToSection: initialIndex >= 0
  });
})();
