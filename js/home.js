/* ===== materials ===== */
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
    const tabList = tab.parentElement;
    if (!tabList) return;

    const left = tab.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2;
    tabList.scrollTo({
      left: Math.max(0, left),
      behavior: reduceMotion.matches ? "auto" : "smooth"
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


/* ===== project-paths ===== */
(() => {
  const section = document.querySelector("[data-project-paths]");
  if (!section) return;

  const comparison = section.querySelector("[data-path-comparison]");
  const paths = Array.from(section.querySelectorAll("[data-project-path]"));
  const pathButtons = Array.from(section.querySelectorAll("[data-compare-path]"));
  const resetButton = section.querySelector("[data-compare-reset]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverPointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 900px)");
  const validPaths = new Set(["balanced", "installation", "repair"]);

  let activePath = "balanced";
  let explicitPath = "balanced";
  let resetTimer = 0;

  const isInteractive = (target) => Boolean(target.closest("a, button, input, select, textarea, label"));

  const updatePathAria = (path) => {
    pathButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.comparePath === path));
    });
  };

  const setProjectPath = (path, { explicit = false } = {}) => {
    if (!validPaths.has(path)) return;
    if (explicit) explicitPath = path;
    if (activePath === path) {
      updatePathAria(path);
      return;
    }

    activePath = path;
    comparison.dataset.active = path;
    updatePathAria(path);
  };

  const resetProjectPath = ({ explicit = true } = {}) => {
    setProjectPath("balanced", { explicit });
  };

  const scheduleReturnToExplicit = () => {
    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      if (!comparison.matches(":hover") && !comparison.contains(document.activeElement)) {
        setProjectPath(explicitPath);
      }
    }, reducedMotion.matches ? 0 : 150);
  };

  paths.forEach((pathPanel) => {
    const path = pathPanel.dataset.projectPath;

    pathPanel.addEventListener("pointerenter", () => {
      if (!hoverPointer.matches) return;
      window.clearTimeout(resetTimer);
      setProjectPath(path);
    });

    pathPanel.addEventListener("click", (event) => {
      if (isInteractive(event.target)) return;
      const nextPath = explicitPath === path ? "balanced" : path;
      setProjectPath(nextPath, { explicit: true });
    });
  });

  comparison.addEventListener("pointerleave", () => {
    if (hoverPointer.matches) scheduleReturnToExplicit();
  });

  comparison.addEventListener("focusin", (event) => {
    window.clearTimeout(resetTimer);
    const panel = event.target.closest("[data-project-path]");
    if (panel) setProjectPath(panel.dataset.projectPath);
  });

  comparison.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!comparison.contains(document.activeElement)) setProjectPath(explicitPath);
    }, 0);
  });

  pathButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const path = button.dataset.comparePath;
      const nextPath = explicitPath === path ? "balanced" : path;
      setProjectPath(nextPath, { explicit: true });
    });
  });

  resetButton?.addEventListener("click", () => resetProjectPath());

  comparison.addEventListener("keydown", (event) => {
    let path = null;
    if (event.key === "ArrowLeft") path = "installation";
    if (event.key === "ArrowRight") path = "repair";
    if (event.key === "Home" || event.key === "Escape") path = "balanced";
    if (!path) return;

    event.preventDefault();
    setProjectPath(path, { explicit: true });
    if (path !== "balanced") {
      section.querySelector(`[data-compare-path="${path}"]`)?.focus({ preventScroll: true });
    } else {
      resetButton?.focus({ preventScroll: true });
    }
  });

  const revealSection = () => {
    section.classList.add("is-visible");
  };

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealSection();
  } else {
    section.classList.add("is-animated");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        revealSection();
        observer.disconnect();
      },
      { rootMargin: "0px 0px -12%", threshold: 0.12 }
    );
    observer.observe(section);
  }

  updatePathAria(activePath);
})();


/* ===== beneath-surface ===== */
(() => {
  const section = document.querySelector("[data-beneath]");
  if (!section) return;

  const explorer = section.querySelector("[data-beneath-explorer]");
  const tabs = Array.from(section.querySelectorAll('[role="tab"][data-condition]'));
  const panel = section.querySelector("[role=tabpanel]");
  const title = section.querySelector("[data-panel-title]");
  const look = section.querySelector("[data-panel-look]");
  const discuss = section.querySelector("[data-panel-discuss]");
  const confirm = section.querySelector("[data-panel-confirm]");
  const cta = section.querySelector("[data-beneath-cta]");
  const progressItems = Array.from(section.querySelectorAll("[data-progress-condition]"));
  const stage = section.querySelector("[data-scan-stage]");
  const lens = section.querySelector("[data-scan-lens]");
  const revealImage = section.querySelector("[data-reveal-image]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canDrag = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)");

  const conditions = Object.freeze([
    {
      title: "The floor that is already there shapes the starting point.",
      look: "material type, visible wear, loose areas",
      discuss: "removal, preservation, access, disposal",
      confirm: "what can remain and what may need preparation",
      image: "img/beneath/room-existing.webp",
      href: "floor-repair-refinishing.html#questions",
      lens: { x: 44, y: 45 }
    },
    {
      title: "Room edges and floor heights connect the whole project.",
      look: "doorways, adjoining materials, direction changes",
      discuss: "finished heights, thresholds, trim, room sequence",
      confirm: "how transitions may be handled in the proposed scope",
      image: "img/beneath/room-transitions.webp",
      href: "floor-installation.html#questions",
      lens: { x: 48, y: 70 }
    },
    {
      title: "The surface below can change the conversation.",
      look: "movement, soft areas, height changes",
      discuss: "preparation, access, transitions",
      confirm: "project-specific scope and requirements",
      image: "img/beneath/room-subfloor.webp",
      href: "floor-installation.html#questions",
      lens: { x: 54, y: 54 }
    },
    {
      title: "Environmental conditions may affect the next steps.",
      look: "seasonal gaps, cupping, staining, movement",
      discuss: "site conditions, product guidance, timing",
      confirm: "whether project-specific testing or preparation is needed",
      image: "img/beneath/room-moisture.webp",
      href: "floor-repair-refinishing.html#questions",
      lens: { x: 58, y: 66 }
    }
  ]);

  let activeIndex = 0;
  let imageToken = 0;
  let pointerId = null;
  let frameRequest = 0;
  let pendingPoint = null;

  const preload = (src) => {
    const image = new Image();
    image.src = src;
  };

  const setLensPosition = ({ x, y }) => {
    stage.style.setProperty("--lens-x", `${x}%`);
    stage.style.setProperty("--lens-y", `${y}%`);
  };

  const updateRevealImage = (src) => {
    if (revealImage.getAttribute("src") === src) return;

    const token = ++imageToken;
    const nextImage = new Image();
    stage.classList.add("is-changing");

    const finish = () => {
      if (token !== imageToken) return;
      revealImage.src = src;
      revealImage.decode?.().catch(() => {}).finally(() => {
        if (token !== imageToken) return;
        stage.classList.remove("is-changing", "reveal-error");
      });
    };

    nextImage.addEventListener("load", finish, { once: true });
    nextImage.addEventListener("error", () => {
      if (token !== imageToken) return;
      stage.classList.remove("is-changing");
      stage.classList.add("reveal-error");
    }, { once: true });
    nextImage.src = src;
    if (nextImage.complete && nextImage.naturalWidth) finish();
  };

  const setActiveCondition = (nextIndex, { focus = false } = {}) => {
    const index = (nextIndex + conditions.length) % conditions.length;
    const condition = conditions[index];
    activeIndex = index;
    explorer.dataset.activeCondition = String(index);

    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    progressItems.forEach((item, itemIndex) => item.classList.toggle("is-active", itemIndex === index));

    panel.classList.add("is-changing");
    panel.setAttribute("aria-labelledby", tabs[index].id);
    title.textContent = condition.title;
    look.textContent = condition.look;
    discuss.textContent = condition.discuss;
    confirm.textContent = condition.confirm;
    cta.href = condition.href;
    setLensPosition(condition.lens);
    updateRevealImage(condition.image);

    window.setTimeout(() => panel.classList.remove("is-changing"), reducedMotion.matches ? 0 : 220);
    if (focus) tabs[index].focus();

    preload(conditions[(index + 1) % conditions.length].image);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setActiveCondition(index));
    tab.addEventListener("pointerenter", () => preload(conditions[index].image), { passive: true });
    tab.addEventListener("focus", () => preload(conditions[index].image));
    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = index + 1;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = index - 1;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = conditions.length - 1;
      else return;

      event.preventDefault();
      setActiveCondition(nextIndex, { focus: true });
    });
  });

  const commitDrag = () => {
    frameRequest = 0;
    if (!pendingPoint) return;

    const stageRect = stage.getBoundingClientRect();
    const radius = lens.offsetWidth / 2;
    const minX = Math.min(radius, stageRect.width / 2);
    const minY = Math.min(radius, stageRect.height / 2);
    const maxX = Math.max(minX, stageRect.width - radius);
    const maxY = Math.max(minY, stageRect.height - radius);
    const localX = Math.min(maxX, Math.max(minX, pendingPoint.x - stageRect.left));
    const localY = Math.min(maxY, Math.max(minY, pendingPoint.y - stageRect.top));

    stage.style.setProperty("--lens-x", `${(localX / stageRect.width) * 100}%`);
    stage.style.setProperty("--lens-y", `${(localY / stageRect.height) * 100}%`);
  };

  const queueDrag = (event) => {
    if (event.pointerId !== pointerId) return;
    pendingPoint = { x: event.clientX, y: event.clientY };
    if (!frameRequest) frameRequest = window.requestAnimationFrame(commitDrag);
  };

  const stopDrag = (event) => {
    if (event.pointerId !== pointerId) return;
    if (lens.hasPointerCapture(pointerId)) lens.releasePointerCapture(pointerId);
    pointerId = null;
    pendingPoint = null;
    lens.classList.remove("is-dragging");
  };

  lens.addEventListener("pointerdown", (event) => {
    if (!canDrag.matches) return;
    pointerId = event.pointerId;
    lens.setPointerCapture(pointerId);
    lens.classList.add("is-dragging");
    queueDrag(event);
  });
  lens.addEventListener("pointermove", queueDrag);
  lens.addEventListener("pointerup", stopDrag);
  lens.addEventListener("pointercancel", stopDrag);

  const enableEntrance = () => {
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
  };

  setLensPosition(conditions[activeIndex].lens);
  preload(conditions[(activeIndex + 1) % conditions.length].image);
  enableEntrance();
})();


/* ===== match-route ===== */
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


/* ===== confidence ===== */
(() => {
  const section = document.querySelector("[data-confidence]");
  if (!section) return;

  const topics = [
    {
      eyebrow: "Scope & Preparation",
      title: "Understand the starting conditions.",
      ask: "What needs to happen before installation or repair begins?",
      compare: "Included preparation, transitions, removal, and disposal.",
      confirm: "Any property-specific requirements directly with the provider.",
      diagram: "img/confidence/diagram-scope.webp",
      diagramAlt: "Technical cutaway of finish flooring, underlayment, subfloor, and prepared substrate"
    },
    {
      eyebrow: "Materials & Product Details",
      title: "Clarify what is being proposed for the space.",
      ask: "Which material, product, finish, and installation direction are proposed?",
      compare: "Product details, appearance, care information, and stated limitations.",
      confirm: "Product-specific requirements and documentation with the provider.",
      diagram: "img/confidence/diagram-materials.webp",
      diagramAlt: "Technical study of flooring product layers, finish sample, and specification details"
    },
    {
      eyebrow: "Timing & Access",
      title: "Plan around how the space may be used.",
      ask: "What timing, access, room-clearing, and return-to-use expectations apply?",
      compare: "Proposed sequence, access needs, dependencies, and schedule assumptions.",
      confirm: "Project-specific timing directly with the provider before work begins.",
      diagram: "img/confidence/diagram-timing.webp",
      diagramAlt: "Technical room plan showing an access route and project sequence"
    },
    {
      eyebrow: "Estimate & Terms",
      title: "Read the estimate as a complete project document.",
      ask: "What work, materials, allowances, exclusions, and payment terms are listed?",
      compare: "Scope detail and assumptions, not price alone.",
      confirm: "Questions, changes, and final terms directly with the provider.",
      diagram: "img/confidence/diagram-estimate.webp",
      diagramAlt: "Technical document study with included and excluded estimate items"
    }
  ];

  const desktop = section.querySelector("[data-confidence-desktop]");
  const mobile = section.querySelector("[data-confidence-mobile]");
  const tablist = section.querySelector("[data-confidence-tabs]");
  const tabs = [...section.querySelectorAll("[data-confidence-tab]")];
  const panel = section.querySelector("[data-confidence-panel]");
  const eyebrow = section.querySelector("[data-confidence-eyebrow]");
  const panelTitle = section.querySelector("[data-confidence-panel-title]");
  const ask = section.querySelector("[data-confidence-ask]");
  const compare = section.querySelector("[data-confidence-compare]");
  const confirm = section.querySelector("[data-confidence-confirm]");
  const diagram = section.querySelector("[data-confidence-diagram]");
  const accordion = section.querySelector("[data-confidence-accordion]");
  const accordionTriggers = [...section.querySelectorAll("[data-confidence-accordion-trigger]")];
  const accordionPanels = [...section.querySelectorAll("[data-confidence-accordion-panel]")];
  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let imageRequest = 0;
  let changeTimer = 0;

  const setDesktopContent = (index) => {
    const topic = topics[index];
    if (!topic) return;

    eyebrow.textContent = topic.eyebrow;
    panelTitle.textContent = topic.title;
    ask.textContent = topic.ask;
    compare.textContent = topic.compare;
    confirm.textContent = topic.confirm;
    panel.setAttribute("aria-labelledby", tabs[index].id);

    const request = ++imageRequest;
    const nextImage = new Image();
    nextImage.onload = () => {
      if (request !== imageRequest) return;
      diagram.hidden = false;
      diagram.src = topic.diagram;
      diagram.alt = topic.diagramAlt;
    };
    nextImage.onerror = () => {
      if (request === imageRequest) diagram.hidden = true;
    };
    nextImage.src = topic.diagram;
  };

  const setActive = (index, options = {}) => {
    if (!topics[index]) return;
    activeIndex = index;

    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    accordionTriggers.forEach((trigger, triggerIndex) => {
      const expanded = triggerIndex === index;
      trigger.classList.toggle("is-active", expanded);
      trigger.setAttribute("aria-expanded", String(expanded));
      accordionPanels[triggerIndex].hidden = !expanded;
    });

    window.clearTimeout(changeTimer);
    if (!reducedMotion.matches && panel) {
      panel.classList.add("is-changing");
      changeTimer = window.setTimeout(() => panel.classList.remove("is-changing"), 150);
    }

    setDesktopContent(index);
    if (options.focusTab) tabs[index].focus();
    if (options.focusAccordion) accordionTriggers[index].focus();
  };

  tablist?.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-confidence-tab]");
    if (!tab) return;
    setActive(Number(tab.dataset.confidenceTab));
  });

  tablist?.addEventListener("keydown", (event) => {
    const current = event.target.closest("[data-confidence-tab]");
    if (!current) return;

    const currentIndex = Number(current.dataset.confidenceTab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    setActive(nextIndex, { focusTab: true });
  });

  accordion?.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-confidence-accordion-trigger]");
    if (!trigger) return;
    setActive(Number(trigger.dataset.confidenceAccordionTrigger));
  });

  const syncPresentation = () => {
    const isMobile = mobileQuery.matches;
    desktop.hidden = isMobile;
    mobile.hidden = !isMobile;
    setActive(activeIndex);
  };

  mobileQuery.addEventListener?.("change", syncPresentation);
  syncPresentation();

  section.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.hidden = true;
      image.closest(".confidence__sample-visual")?.classList.add("is-missing");
    });
  });

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    section.classList.add("is-animated");
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      section.classList.add("is-visible");
      observer.disconnect();
    }, { threshold: 0.08 });
    observer.observe(section);
  } else {
    section.classList.add("is-visible");
  }

  if (window.location.hash === "#confidence") {
    const restoreDeepLink = () => window.setTimeout(() => {
      section.scrollIntoView({ block: "start", behavior: "auto" });
    }, 450);

    if (document.readyState === "complete") {
      restoreDeepLink();
    } else {
      window.addEventListener("load", restoreDeepLink, { once: true });
    }
  }
})();


/* ===== about ===== */
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


/* ===== project-faq ===== */
(() => {
  const section = document.querySelector("[data-faq]");
  if (!section) return;

  const desktop = section.querySelector("[data-faq-desktop]");
  const mobile = section.querySelector("[data-faq-mobile]");
  const source = section.querySelector("[data-faq-source]");
  const categoryNav = section.querySelector("[data-faq-categories]");
  const jumpNav = section.querySelector("[data-faq-jumps]");
  const categoryTitle = section.querySelector("[data-faq-category-title]");
  const questionList = section.querySelector("[data-faq-list]");
  const answerPanel = section.querySelector("[data-faq-answer]");
  const answerIndex = section.querySelector("[data-answer-index]");
  const answerQuestion = section.querySelector("[data-answer-question]");
  const answerContent = section.querySelector("[data-answer-content]");
  const answerRoute = section.querySelector("[data-answer-route]");
  const navigation = section.querySelector("[data-faq-navigation]");
  const previousButton = section.querySelector("[data-faq-previous]");
  const nextButton = section.querySelector("[data-faq-next]");
  const progress = section.querySelector("[data-faq-progress]");
  const archiveImage = section.querySelector(".project-faq__archive");
  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const categorySections = [...source.querySelectorAll("[data-faq-category]")];
  const faqCategories = categorySections.map((categorySection, categoryIndex) => {
    const items = [...categorySection.querySelectorAll("[data-faq-item]")].map((details, questionIndex) => {
      const summary = details.querySelector("summary");
      const answer = details.querySelector("[data-faq-answer-copy]");
      details.dataset.categoryIndex = String(categoryIndex);
      details.dataset.questionIndex = String(questionIndex);
      summary.setAttribute("aria-expanded", String(details.open));

      return {
        id: details.dataset.itemId,
        number: details.dataset.itemNumber,
        question: summary.querySelector("strong").textContent.trim(),
        answer: answer.textContent.trim(),
        route: details.dataset.route === "true",
        details,
        summary
      };
    });

    return {
      id: categorySection.dataset.categoryId,
      number: categorySection.dataset.categoryNumber,
      label: categorySection.dataset.categoryLabel,
      section: categorySection,
      items
    };
  });

  const flatQuestions = faqCategories.flatMap((category, categoryIndex) =>
    category.items.map((item, questionIndex) => ({ ...item, categoryIndex, questionIndex }))
  );

  let activeCategoryIndex = 0;
  let activeQuestionIndex = 0;
  let answerTimer = 0;
  let answerRequest = 0;
  let syncingDetails = false;

  const createCategoryControls = () => {
    categoryNav.replaceChildren();
    jumpNav.replaceChildren();

    faqCategories.forEach((category, index) => {
      const button = document.createElement("button");
      button.className = "project-faq__category";
      button.type = "button";
      button.dataset.faqCategoryButton = String(index);
      button.setAttribute("aria-pressed", String(index === 0));
      button.innerHTML = `
        <span class="project-faq__category-label">${category.label}</span>
      `;
      categoryNav.append(button);

      const jump = document.createElement("a");
      jump.className = "project-faq__jump";
      jump.href = `#${category.section.id}`;
      jump.textContent = category.label;
      jumpNav.append(jump);
    });
  };

  const renderQuestionList = () => {
    const category = faqCategories[activeCategoryIndex];
    categoryTitle.textContent = category.label;
    questionList.replaceChildren();

    category.items.forEach((item, index) => {
      const row = document.createElement("div");
      row.setAttribute("role", "listitem");
      const button = document.createElement("button");
      const selected = index === activeQuestionIndex;
      button.className = `project-faq__question${selected ? " is-active" : ""}`;
      button.type = "button";
      button.dataset.faqQuestionButton = String(index);
      button.setAttribute("aria-expanded", String(selected));
      button.setAttribute("aria-controls", answerPanel.id);
      button.innerHTML = `
        <span class="project-faq__question-text">${item.question}</span>
        <span class="project-faq__question-toggle" aria-hidden="true"></span>
      `;
      row.append(button);
      questionList.append(row);
    });
  };

  const getGlobalIndex = (categoryIndex, questionIndex) =>
    flatQuestions.findIndex((item) => item.categoryIndex === categoryIndex && item.questionIndex === questionIndex);

  const syncMobileDetails = () => {
    syncingDetails = true;
    faqCategories.forEach((category, categoryIndex) => {
      category.items.forEach((item, questionIndex) => {
        const open = categoryIndex === activeCategoryIndex && questionIndex === activeQuestionIndex;
        item.details.open = open;
        item.summary.setAttribute("aria-expanded", String(open));
      });
    });
    syncingDetails = false;
  };

  const updateAnswer = (item, immediate) => {
    const request = ++answerRequest;
    window.clearTimeout(answerTimer);

    const applyContent = () => {
      if (request !== answerRequest) return;
      answerIndex.textContent = "Answer";
      answerQuestion.textContent = item.question;
      answerContent.textContent = item.answer;
      answerRoute.hidden = !item.route;
      answerPanel.classList.remove("is-changing");
    };

    if (immediate || reducedMotion.matches) {
      applyContent();
      return;
    }

    answerPanel.classList.add("is-changing");
    answerTimer = window.setTimeout(applyContent, 135);
  };

  const setActiveQuestion = (categoryIndex, questionIndex, options = {}) => {
    const category = faqCategories[categoryIndex];
    const item = category?.items[questionIndex];
    if (!item) return;

    const categoryChanged = activeCategoryIndex !== categoryIndex;
    activeCategoryIndex = categoryIndex;
    activeQuestionIndex = questionIndex;

    const categoryButtons = [...categoryNav.querySelectorAll("[data-faq-category-button]")];
    categoryButtons.forEach((button, index) => {
      const selected = index === categoryIndex;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    if (categoryChanged || !questionList.children.length) {
      renderQuestionList();
    } else {
      [...questionList.querySelectorAll("[data-faq-question-button]")].forEach((button, index) => {
        const selected = index === questionIndex;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-expanded", String(selected));
      });
    }

    const globalIndex = getGlobalIndex(categoryIndex, questionIndex);
    progress.textContent = "Browse questions";
    previousButton.disabled = globalIndex === 0;
    nextButton.disabled = globalIndex === flatQuestions.length - 1;
    updateAnswer(item, options.immediate === true);
    syncMobileDetails();

    if (options.focusQuestion) {
      const activeButton = questionList.querySelector(`[data-faq-question-button="${questionIndex}"]`);
      activeButton?.focus();
      activeButton?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }

    if (options.scrollCategory) {
      categoryButtons[categoryIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  };

  createCategoryControls();
  renderQuestionList();
  setActiveQuestion(0, 0, { immediate: true });

  categoryNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-faq-category-button]");
    if (!button) return;
    setActiveQuestion(Number(button.dataset.faqCategoryButton), 0, { scrollCategory: true });
  });

  questionList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-faq-question-button]");
    if (!button) return;
    setActiveQuestion(activeCategoryIndex, Number(button.dataset.faqQuestionButton));
  });

  questionList.addEventListener("keydown", (event) => {
    const button = event.target.closest("[data-faq-question-button]");
    if (!button || !["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    const count = faqCategories[activeCategoryIndex].items.length;
    const current = Number(button.dataset.faqQuestionButton);
    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % count;
    if (event.key === "ArrowUp") next = (current - 1 + count) % count;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = count - 1;
    setActiveQuestion(activeCategoryIndex, next, { focusQuestion: true });
  });

  const moveGlobally = (direction, focusQuestion) => {
    const current = getGlobalIndex(activeCategoryIndex, activeQuestionIndex);
    const target = flatQuestions[current + direction];
    if (!target) return;
    setActiveQuestion(target.categoryIndex, target.questionIndex, { focusQuestion, scrollCategory: true });
  };

  previousButton.addEventListener("click", (event) => moveGlobally(-1, event.detail === 0));
  nextButton.addEventListener("click", (event) => moveGlobally(1, event.detail === 0));

  mobile.addEventListener("toggle", (event) => {
    const details = event.target.closest?.("[data-faq-item]");
    if (!details || syncingDetails) return;
    const summary = details.querySelector("summary");
    summary.setAttribute("aria-expanded", String(details.open));
    if (!details.open) return;

    setActiveQuestion(Number(details.dataset.categoryIndex), Number(details.dataset.questionIndex), { immediate: true });
  }, true);

  const syncPresentation = () => {
    const isMobile = mobileQuery.matches;
    desktop.hidden = isMobile;
    mobile.hidden = !isMobile;
    navigation.hidden = isMobile;
    setActiveQuestion(activeCategoryIndex, activeQuestionIndex, { immediate: true });
  };

  mobileQuery.addEventListener?.("change", syncPresentation);
  syncPresentation();

  archiveImage.addEventListener("error", () => {
    archiveImage.hidden = true;
    desktop.classList.add("is-archive-missing");
  });

  window.renderLucideIcons?.(section);

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    section.classList.add("is-animated");
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      section.classList.add("is-visible");
      observer.disconnect();
    }, { threshold: 0.07 });
    observer.observe(section);
  } else {
    section.classList.add("is-visible");
  }

  if (window.location.hash === "#faq") {
    const alignSection = () => {
      const header = document.querySelector("[data-site-header]");
      const offset = (header?.getBoundingClientRect().height || 0) + 20;
      const top = section.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
    };

    const restoreDeepLink = () => [250, 900, 1800].forEach((delay) => {
      window.setTimeout(() => {
        if (window.location.hash === "#faq") {
          alignSection();
        }
      }, delay);
    });

    if (document.readyState === "complete") restoreDeepLink();
    else window.addEventListener("load", restoreDeepLink, { once: true });
  }
})();
