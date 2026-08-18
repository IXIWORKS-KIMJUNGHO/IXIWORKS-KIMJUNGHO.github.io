(() => {
  const progress = document.querySelector("[data-mission-progress]");
  const checklist = document.querySelector("[data-mission-checklist]");
  const resetButton = document.querySelector("[data-mission-reset]");

  if (!progress || !checklist || !resetButton) return;

  const checkboxes = [...checklist.querySelectorAll(".completion-check")];
  const countLabel = progress.querySelector("[aria-live='polite']");
  const storageKey = "contents-programming-week10-checklist-v1";

  if (!countLabel || checkboxes.length === 0) return;

  let storedIds = [];
  try {
    const storedValue = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(storedValue)) storedIds = storedValue;
  } catch {
    storedIds = [];
  }

  for (const checkbox of checkboxes) {
    checkbox.checked = storedIds.includes(checkbox.id);
  }

  function updateProgress({ persist = true } = {}) {
    const checkedBoxes = checkboxes.filter((checkbox) => checkbox.checked);

    for (const checkbox of checkboxes) {
      checkbox
        .closest("li")
        ?.setAttribute("data-checked", String(checkbox.checked));
    }

    countLabel.textContent = `완료 ${checkedBoxes.length}/${checkboxes.length}`;
    progress.setAttribute(
      "data-complete",
      String(checkedBoxes.length === checkboxes.length),
    );

    if (!persist) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(checkedBoxes.map((checkbox) => checkbox.id)),
      );
    } catch {
      // The checklist remains usable when browser storage is unavailable.
    }
  }

  for (const checkbox of checkboxes) {
    checkbox.addEventListener("change", () => updateProgress());
  }

  resetButton.addEventListener("click", () => {
    for (const checkbox of checkboxes) checkbox.checked = false;
    updateProgress();
    checkboxes[0]?.focus();
  });

  updateProgress({ persist: false });
})();
