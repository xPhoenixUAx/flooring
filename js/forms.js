/* ===== forms ===== */
(function () {
  "use strict";

  const successMessage =
    "Thank you! We have successfully received your request. Our team will review your information and get back to you shortly.";

  const messages = {
    name: "Please enter your name.",
    email: "Please enter a valid email address.",
    service: "Please choose a service.",
    details: "Please tell us a little about your project.",
    consent: "Please confirm that we may use these details to respond to your request."
  };

  const setFieldError = (field, message) => {
    const error = document.getElementById(`${field.id}-error`);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  };

  const validateField = (field) => {
    let message = "";
    const value = field.type === "checkbox" ? field.checked : field.value.trim();

    if (field.required && !value) {
      message = messages[field.name] || "This field is required.";
    } else if (field.type === "email" && value) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(field.value.trim())) message = messages.email;
    } else if (field.name === "details" && field.value.length > 4000) {
      message = "Please keep project details under 4,000 characters.";
    }

    setFieldError(field, message);
    return !message;
  };

  document.querySelectorAll("[data-project-form]").forEach((form) => {
    const fields = Array.from(form.querySelectorAll("input, select, textarea")).filter(
      (field) => field.name !== "website"
    );
    const submitButton = form.querySelector('button[type="submit"]');
    const status = form.querySelector("[data-form-status]");

    fields.forEach((field) => {
      field.addEventListener(field.tagName === "SELECT" || field.type === "checkbox" ? "change" : "blur", () => {
        validateField(field);
      });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const isValid = fields.map(validateField).every(Boolean);
      if (!isValid) {
        fields.find((field) => field.getAttribute("aria-invalid") === "true")?.focus();
        return;
      }

      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.classList.add("is-loading");
      submitButton.textContent = "Sending…";
      status.textContent = "";
      status.className = "form-status";

      try {
        const endpoint = form.action;
        const response = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "We could not send your request right now. Please try again later.");
        }
        form.reset();
        status.textContent = successMessage;
        status.classList.add("is-success");
        submitButton.textContent = "Request received";
      } catch (error) {
        status.textContent = error.message || "We could not send your request right now. Please try again later.";
        status.classList.add("is-error");
        submitButton.disabled = false;
        submitButton.classList.remove("is-loading");
        submitButton.textContent = originalText;
      }
    });
  });
})();


/* ===== request-footer ===== */
(function () {
  "use strict";

  const SUCCESS_MESSAGE =
    "Thank you! We have successfully received your request. Our team will review your information and get back to you shortly.";
  const GENERIC_ERROR =
    "We couldn’t send your request. Please review the highlighted fields and try again.";
  const SERVER_ERROR =
    "We couldn’t send your request right now. Please try again later or contact us by email.";

  const intake = document.querySelector("[data-intake]");
  if (!intake) return;

  const getErrorElement = (field) => {
    const ids = (field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    const errorId = ids.find((id) => id.endsWith("-error"));
    return errorId ? document.getElementById(errorId) : null;
  };

  const setError = (field, message) => {
    const error = getErrorElement(field);
    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  };

  const fieldMessage = (field) => {
    if (field.name === "project_direction") return "Choose a project direction.";
    if (field.name === "room_area") return "Enter the room or area.";
    if (field.name === "postal_code") return "Enter a five-digit ZIP code or ZIP+4.";
    if (field.name === "desired_timing") return "Choose a desired timing.";
    if (field.name === "project_details") return "Enter 20 to 2,000 characters about the project.";
    if (field.name === "full_name") return "Enter your full name.";
    if (field.name === "email") return "Enter a valid email address.";
    if (field.name === "privacy_consent") return "Consent is required to send this form.";
    return "Complete this field.";
  };

  const normalizeValue = (field) => {
    if (field.type === "checkbox" || field.type === "radio") return;
    field.value = field.value.trim().replace(/[^\S\r\n]+/g, " ");
  };

  const validateField = (field) => {
    if (field.disabled || field.type === "hidden" || field.name === "website") return true;

    if (field.type === "radio") {
      const group = Array.from(field.form.elements[field.name] || []);
      const valid = group.some((option) => option.checked);
      group.forEach((option, index) => setError(option, index === 0 && !valid ? fieldMessage(field) : ""));
      return valid;
    }

    normalizeValue(field);
    const trimmedLength = typeof field.value === "string" ? field.value.trim().length : 0;
    let valid = field.checkValidity();

    if (field.name === "project_details") valid = trimmedLength >= 20 && trimmedLength <= 2000;
    setError(field, valid ? "" : fieldMessage(field));
    return valid;
  };

  const visibleFields = (container) =>
    Array.from(container.querySelectorAll("input, select, textarea")).filter(
      (field) => field.type !== "hidden" && field.name !== "website" && !field.disabled
    );

  const uniqueFields = (fields) => {
    const radioNames = new Set();
    return fields.filter((field) => {
      if (field.type !== "radio") return true;
      if (radioNames.has(field.name)) return false;
      radioNames.add(field.name);
      return true;
    });
  };

  const validateContainer = (container) => {
    const fields = uniqueFields(visibleFields(container));
    const results = fields.map((field) => ({ field, valid: validateField(field) }));
    return {
      valid: results.every((result) => result.valid),
      firstInvalid: results.find((result) => !result.valid)?.field || null
    };
  };

  const focusField = (field) => {
    if (!field) return;
    field.focus({ preventScroll: true });
    const bounds = field.getBoundingClientRect();
    if (bounds.top < 100 || bounds.bottom > window.innerHeight - 30) {
      field.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const showSummary = (form, message) => {
    const summary = form.querySelector("[data-form-summary]");
    if (!summary) return;
    summary.textContent = message;
    summary.hidden = !message;
    if (message) summary.focus({ preventScroll: true });
  };

  const clearServerErrors = (form) => {
    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => setError(field, ""));
    showSummary(form, "");
  };

  const applyServerErrors = (form, errors) => {
    let first = null;
    Object.entries(errors || {}).forEach(([name, message]) => {
      const field = form.elements[name];
      const target = field instanceof RadioNodeList ? field[0] : field;
      if (!target) return;
      setError(target, String(message));
      if (!first) first = target;
    });
    return first;
  };

  const enhanceSubmission = (form, beforeValidate) => {
    let pending = false;
    const submit = form.querySelector('button[type="submit"]');
    const status = form.querySelector("[data-form-status]");
    const success = form.parentElement.querySelector(":scope > [data-form-success]");
    const originalText = submit?.textContent.trim() || "Submit";

    form.addEventListener("input", (event) => {
      if (event.target.matches("input, textarea") && event.target.getAttribute("aria-invalid") === "true") {
        validateField(event.target);
      }
    });

    form.addEventListener("change", (event) => {
      if (event.target.matches("input, select, textarea")) validateField(event.target);
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (pending) return;

      clearServerErrors(form);
      const preflight = beforeValidate ? beforeValidate() : null;
      if (preflight?.handled) return;

      const validation = validateContainer(form);
      if (!validation.valid) {
        showSummary(form, GENERIC_ERROR);
        if (preflight?.showField) preflight.showField(validation.firstInvalid);
        focusField(validation.firstInvalid);
        return;
      }

      pending = true;
      if (submit) {
        submit.disabled = true;
        submit.textContent = "Sending…";
      }
      if (status) status.textContent = "";

      try {
        const endpoint = window.SITE_CONFIG?.formEndpoint || form.action;
        const response = await fetch(endpoint, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" }
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload.success !== true) {
          const firstServerError = applyServerErrors(form, payload.errors);
          const message = response.status === 422 || response.status === 400 ? GENERIC_ERROR : SERVER_ERROR;
          showSummary(form, message);
          if (firstServerError) {
            if (preflight?.showField) preflight.showField(firstServerError);
            focusField(firstServerError);
          }
          throw new Error(message);
        }

        form.reset();
        form.hidden = true;
        if (success) {
          const message = success.querySelector("p:last-child");
          if (message) message.textContent = SUCCESS_MESSAGE;
          success.hidden = false;
          success.focus({ preventScroll: true });
        }
      } catch (error) {
        if (form.hidden) return;
        if (status) status.textContent = error.message || SERVER_ERROR;
        pending = false;
        if (submit) {
          submit.disabled = false;
          submit.textContent = originalText;
        }
      }
    });
  };

  const requestForm = intake.querySelector("[data-multistep-form]");
  if (requestForm) {
    const steps = Array.from(requestForm.querySelectorAll("[data-request-step]"));
    const markers = Array.from(requestForm.querySelectorAll("[data-step-marker]"));
    let currentRequestStep = 0;

    const showStep = (index, { focus = true } = {}) => {
      currentRequestStep = Math.max(0, Math.min(index, steps.length - 1));
      steps.forEach((step, stepIndex) => {
        step.hidden = stepIndex !== currentRequestStep;
      });
      markers.forEach((marker, markerIndex) => {
        marker.classList.toggle("is-complete", markerIndex < currentRequestStep);
        if (markerIndex === currentRequestStep) marker.setAttribute("aria-current", "step");
        else marker.removeAttribute("aria-current");
      });
      if (focus) steps[currentRequestStep].querySelector("legend")?.focus({ preventScroll: true });
    };

    const advance = () => {
      const validation = validateContainer(steps[currentRequestStep]);
      if (!validation.valid) {
        showSummary(requestForm, GENERIC_ERROR);
        focusField(validation.firstInvalid);
        return;
      }
      showSummary(requestForm, "");
      showStep(currentRequestStep + 1);
    };

    requestForm.addEventListener("click", (event) => {
      if (event.target.closest("[data-next-step]")) advance();
      if (event.target.closest("[data-previous-step]")) {
        showSummary(requestForm, "");
        showStep(currentRequestStep - 1);
      }
    });

    requestForm.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.target.tagName === "TEXTAREA" || event.target.type === "radio" || event.target.type === "checkbox") return;
      if (currentRequestStep < steps.length - 1) {
        event.preventDefault();
        advance();
      }
    });

    enhanceSubmission(requestForm, () => ({
      handled: false,
      showField(field) {
        const stepIndex = steps.findIndex((step) => step.contains(field));
        if (stepIndex >= 0 && stepIndex !== currentRequestStep) showStep(stepIndex, { focus: false });
      }
    }));
    showStep(0, { focus: false });
  }

  intake.querySelectorAll("[data-rendered-at]").forEach((field) => {
    field.value = String(Math.floor(Date.now() / 1000));
  });

  const revealItems = Array.from(intake.querySelectorAll("[data-intake-reveal]"));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    revealItems.forEach((item) => observer.observe(item));
  }
})();
