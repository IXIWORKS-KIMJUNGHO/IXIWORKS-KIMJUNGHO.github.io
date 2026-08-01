(() => {
  const closeFallbackDuration = 260;
  const detailsElements = document.querySelectorAll(
    "body.teaching-document details, details.archive-panel, details.architecture-disclosure",
  );

  for (const details of detailsElements) {
    if (details.dataset.detailsMotion === "ready") continue;

    const summary = details.querySelector(":scope > summary");
    if (!summary) continue;

    let content = details.querySelector(":scope > .details-motion-content");
    if (!content) {
      content = document.createElement("div");
      while (summary.nextSibling) content.append(summary.nextSibling);
      details.append(content);
    }
    content.classList.add("details-motion-content");

    let closeTimer = 0;
    let closeListener = null;

    function setState(state) {
      details.dataset.detailsState = state;
    }

    function cancelPendingClose() {
      window.clearTimeout(closeTimer);
      closeTimer = 0;
      if (closeListener) {
        content.removeEventListener("transitionend", closeListener);
        closeListener = null;
      }
    }

    function toggleDetailsInstantly() {
      cancelPendingClose();
      details.dataset.detailsMotionInstant = "true";

      const shouldOpen =
        details.dataset.detailsState === "closing" || !details.open;
      if (shouldOpen) details.open = true;
      setState(shouldOpen ? "open" : "closed");
      content.getBoundingClientRect();
      if (!shouldOpen) details.open = false;
      details.getBoundingClientRect();

      delete details.dataset.detailsMotionInstant;
    }

    function openDetails() {
      cancelPendingClose();

      if (details.open && details.dataset.detailsState === "closing") {
        setState("open");
        return;
      }

      details.open = true;
      setState("opening");
      content.getBoundingClientRect();
      setState("open");
    }

    function finishClose() {
      if (details.dataset.detailsState !== "closing") return;
      cancelPendingClose();
      details.open = false;
      setState("closed");
    }

    function closeDetails() {
      cancelPendingClose();
      closeListener = (event) => {
        if (event.target === content && event.propertyName === "opacity") {
          finishClose();
        }
      };
      content.addEventListener("transitionend", closeListener);
      setState("closing");
      closeTimer = window.setTimeout(finishClose, closeFallbackDuration);
    }

    setState(details.open ? "open" : "closed");
    details.dataset.detailsMotion = "ready";

    summary.addEventListener("click", (event) => {
      if (event.defaultPrevented) return;
      event.preventDefault();

      if (event.detail === 0) {
        toggleDetailsInstantly();
        return;
      }

      if (details.dataset.detailsState === "closing") {
        openDetails();
      } else if (details.open) {
        closeDetails();
      } else {
        openDetails();
      }
    });
  }
})();
