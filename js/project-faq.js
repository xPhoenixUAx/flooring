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
