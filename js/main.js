/* ===== main ===== */
(function () {
  "use strict";

  const config = window.SITE_CONFIG || {};
  const company = config.company || {};
  const brand = config.brand || {};
  const contact = config.contact || {};
  const disclaimer = config.disclaimer || {};
  const body = document.body;
  const header = document.querySelector("[data-site-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const mobileServicesToggle = document.querySelector("[data-mobile-services-toggle]");
  const mobileServicesSubnav = mobileServicesToggle
    ? document.getElementById(mobileServicesToggle.getAttribute("aria-controls"))
    : null;
  const dropdownToggle = document.querySelector("[data-dropdown-toggle]");
  const cookieBanner = document.querySelector("[data-cookie-banner]");
  const cookieKey = "flooring-match-cookie-choice";

  const setConfigContent = () => {
    const siteTitle = config.pageTitle || company.name || "Flooring Match";
    const pageTitles = {
      home: `${siteTitle} | Find the right flooring professional`,
      installation: `Floor Installation & Replacement | ${siteTitle}`,
      repair: `Floor Repair & Refinishing | ${siteTitle}`,
      privacy: `Privacy Policy | ${siteTitle}`,
      terms: `Terms of Service | ${siteTitle}`,
      cookies: `Cookie Policy | ${siteTitle}`
    };
    document.title = pageTitles[body.dataset.page] || siteTitle;
    const socialTitle = document.querySelector('meta[property="og:title"]');
    if (socialTitle) socialTitle.content = document.title;

    document.querySelectorAll("[data-brand-name]").forEach((element) => {
      element.textContent = company.name || "Flooring Match";
    });

    document.querySelectorAll("[data-current-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });

    document.querySelectorAll("[data-copyright-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });

    document.querySelectorAll("[data-global-disclaimer]").forEach((element) => {
      element.textContent = disclaimer.full || "";
    });

    document.querySelectorAll("[data-footer-text]").forEach((element) => {
      element.textContent = brand.descriptor || element.textContent;
    });

    const publicEmail = contact.email || "";
    document.querySelectorAll("[data-corporate-email-group]").forEach((element) => {
      element.hidden = !publicEmail;
    });
    document.querySelectorAll("[data-corporate-email]").forEach((element) => {
      if (!publicEmail) {
        element.hidden = true;
        return;
      }
      element.hidden = false;
      element.textContent = publicEmail;
      if (element.tagName === "A") {
        element.href = `mailto:${publicEmail}`;
      }
    });
  };

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const closeMobileMenu = ({ restoreFocus = false } = {}) => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    mobileMenu.setAttribute("inert", "");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
    header?.classList.remove("is-menu-open");
    body.classList.remove("is-locked");
    if (restoreFocus) menuToggle.focus();
  };

  const openMobileMenu = () => {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    mobileMenu.removeAttribute("inert");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
    header?.classList.add("is-menu-open");
    body.classList.add("is-locked");
    mobileMenu.querySelector("a, button")?.focus();
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) closeMobileMenu({ restoreFocus: true });
    else openMobileMenu();
  });

  mobileMenu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileMenu();
  });

  mobileServicesToggle?.addEventListener("click", () => {
    const isOpen = mobileServicesToggle.getAttribute("aria-expanded") === "true";
    mobileServicesToggle.setAttribute("aria-expanded", String(!isOpen));
    if (mobileServicesSubnav) mobileServicesSubnav.hidden = isOpen;
  });

  dropdownToggle?.addEventListener("click", () => {
    const isOpen = dropdownToggle.getAttribute("aria-expanded") === "true";
    dropdownToggle.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", (event) => {
    if (dropdownToggle && !event.target.closest(".nav-dropdown")) {
      dropdownToggle.setAttribute("aria-expanded", "false");
    }
  });

  dropdownToggle?.closest(".nav-dropdown")?.addEventListener("focusout", (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      dropdownToggle.setAttribute("aria-expanded", "false");
    }
  });

  const getFocusable = (container) =>
    Array.from(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hidden && element.offsetParent !== null);

  const openDialog = (dialog, trigger) => {
    if (!dialog) return;
    dialog.dataset.returnFocus = trigger?.id || "";
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    body.classList.add("is-locked");
    dialog.querySelector("input, select, textarea, button")?.focus();
  };

  const closeDialog = (dialog) => {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    body.classList.remove("is-locked");
    const triggerId = dialog.dataset.returnFocus;
    if (triggerId) document.getElementById(triggerId)?.focus();
  };

  document.querySelectorAll("[data-open-dialog]").forEach((trigger, index) => {
    if (!trigger.id) trigger.id = `dialog-trigger-${index + 1}`;
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      closeMobileMenu();
      openDialog(document.getElementById(trigger.dataset.openDialog), trigger);
    });
  });

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(dialog));
    });

    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog(dialog);
    });

    dialog.addEventListener("click", (event) => {
      const bounds = dialog.getBoundingClientRect();
      const isBackdrop =
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom;
      if (isBackdrop) closeDialog(dialog);
    });

    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = getFocusable(dialog);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && menuToggle?.getAttribute("aria-expanded") === "true" && mobileMenu) {
      const focusable = getFocusable(mobileMenu);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (event.key === "Escape") {
      if (dropdownToggle?.getAttribute("aria-expanded") === "true") {
        dropdownToggle.setAttribute("aria-expanded", "false");
        dropdownToggle.focus();
      }
      if (menuToggle?.getAttribute("aria-expanded") === "true") {
        closeMobileMenu({ restoreFocus: true });
      }
    }
  });

  const storeCookieChoice = (choice) => {
    try {
      localStorage.setItem(cookieKey, choice);
    } catch (_error) {
      // The choice remains effective for the current page if storage is blocked.
    }
    if (cookieBanner) cookieBanner.hidden = true;
  };

  let cookieChoice = null;
  try {
    cookieChoice = localStorage.getItem(cookieKey);
  } catch (_error) {
    cookieChoice = null;
  }
  if (cookieBanner && !cookieChoice) cookieBanner.hidden = false;

  document.querySelectorAll("[data-cookie-choice]").forEach((button) => {
    button.addEventListener("click", () => storeCookieChoice(button.dataset.cookieChoice));
  });

  document.querySelectorAll("[data-open-cookie-settings]").forEach((button) => {
    button.addEventListener("click", () => {
      openDialog(document.getElementById("cookie-dialog"), button);
    });
  });

  document.querySelectorAll("[data-save-cookie-settings]").forEach((button) => {
    button.addEventListener("click", () => {
      storeCookieChoice("necessary");
      closeDialog(document.getElementById("cookie-dialog"));
    });
  });

  const navSections = [
    {
      key: "home",
      items: [
        document.querySelector('.desktop-nav .nav-link[href="index.html"]'),
        document.querySelector('.mobile-menu .mobile-nav-link[href="index.html"]')
      ]
    },
    { key: "services", items: [dropdownToggle, mobileServicesToggle] },
    {
      key: "how-it-works",
      items: [
        document.querySelector('.desktop-nav .nav-link[href="#how-it-works"]'),
        document.querySelector('.mobile-menu .mobile-nav-link[href="#how-it-works"]')
      ]
    },
    {
      key: "about",
      items: [
        document.querySelector('.desktop-nav .nav-link[href="#about"]'),
        document.querySelector('.mobile-menu .mobile-nav-link[href="#about"]')
      ]
    },
    {
      key: "contact",
      items: [
        document.querySelector('.desktop-nav .nav-link[href="#request-form"]'),
        document.querySelector('.mobile-menu .mobile-nav-link[href="#request-form"]')
      ]
    }
  ].map((entry) => ({ ...entry, items: entry.items.filter(Boolean) }));

  const navMarkers = body.dataset.page === "home"
    ? [
        { element: document.querySelector(".flooring-hero"), key: "home" },
        { element: document.getElementById("services"), key: "services" },
        { element: document.getElementById("how-it-works"), key: "how-it-works" },
        { element: document.getElementById("about"), key: "about" },
        { element: document.getElementById("faq"), key: null },
        { element: document.getElementById("request-form"), key: "contact" }
      ].filter((marker) => marker.element)
    : [];

  let activeNavKey;
  let navFrame = 0;

  const setActiveNavSection = (key) => {
    if (activeNavKey === key) return;
    activeNavKey = key;

    navSections.forEach((entry) => {
      const active = entry.key === key;
      entry.items.forEach((item) => {
        item.classList.toggle("is-active", active);
        if (item.tagName === "A") {
          if (active) item.setAttribute("aria-current", "location");
          else item.removeAttribute("aria-current");
        }
      });
    });
  };

  const updateActiveNavSection = () => {
    navFrame = 0;
    if (!navMarkers.length) return;

    const headerOffset = header?.offsetHeight || 0;
    const readingLine = window.scrollY + headerOffset + Math.min(window.innerHeight * 0.22, 180);
    let currentKey = navMarkers[0].key;

    navMarkers.forEach((marker) => {
      const markerTop = marker.element.getBoundingClientRect().top + window.scrollY;
      if (markerTop <= readingLine) currentKey = marker.key;
    });

    setActiveNavSection(currentKey);
  };

  const scheduleActiveNavUpdate = () => {
    if (navFrame) return;
    navFrame = window.requestAnimationFrame(updateActiveNavSection);
  };

  if (new URLSearchParams(window.location.search).get("request") === "1") {
    document.getElementById("request-form")?.scrollIntoView({ block: "start" });
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("scroll", scheduleActiveNavUpdate, { passive: true });
  window.addEventListener("hashchange", scheduleActiveNavUpdate);
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1024) closeMobileMenu();
    scheduleActiveNavUpdate();
  });

  setConfigContent();
  updateHeader();
  updateActiveNavSection();
})();


/* ===== animations ===== */
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
