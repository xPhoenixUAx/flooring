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
