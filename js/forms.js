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
