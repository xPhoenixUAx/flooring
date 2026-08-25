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
