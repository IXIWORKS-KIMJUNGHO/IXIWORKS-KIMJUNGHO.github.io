const FEEDBACK_DURATION = 2400;

function writeToClipboard(value) {
  const clipboard = globalThis.navigator?.clipboard;

  if (!clipboard?.writeText) {
    return Promise.reject(new Error("Clipboard API unavailable"));
  }

  return clipboard.writeText(value);
}

export function bindEmailAction(
  link,
  {
    status = null,
    writeText = writeToClipboard,
    schedule = globalThis.setTimeout,
    cancelSchedule = globalThis.clearTimeout,
  } = {},
) {
  const email = link?.dataset.email;
  const label = link?.querySelector("[data-email-label]");

  if (!email || !label || link.dataset.emailActionBound === "true") return;

  link.dataset.emailActionBound = "true";
  let resetTimer;

  const reset = () => {
    delete link.dataset.copyState;
    label.textContent = "Email";
    if (status) status.textContent = "";
    resetTimer = undefined;
  };

  const showFeedback = (state, visibleLabel, announcement) => {
    if (resetTimer !== undefined) cancelSchedule(resetTimer);
    link.dataset.copyState = state;
    label.textContent = visibleLabel;
    if (status) status.textContent = announcement;
    resetTimer = schedule(reset, FEEDBACK_DURATION);
  };

  link.addEventListener("click", () => {
    Promise.resolve(writeText(email)).then(
      () => {
        showFeedback(
          "copied",
          "Email copied",
          `${email} copied to clipboard.`,
        );
      },
      () => {
        showFeedback(
          "unavailable",
          "Open email app",
          `Opening the email app for ${email}.`,
        );
      },
    );
  });
}

if (typeof document !== "undefined") {
  const link = document.querySelector("[data-email-action]");
  const status = document.querySelector("[data-email-status]");

  if (link) bindEmailAction(link, { status });
}
