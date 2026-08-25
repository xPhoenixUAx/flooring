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
