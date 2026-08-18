(() => {
  const compactViewport = window.matchMedia("(max-width: 980px)");
  const tableOfContents = document.querySelectorAll("details.week-13-toc");

  if (compactViewport.matches) {
    for (const toc of tableOfContents) toc.removeAttribute("open");
  }

  const progress = document.querySelector("[data-mission-progress]");
  const checklist = document.querySelector("[data-mission-checklist]");
  const resetButton = document.querySelector("[data-mission-reset]");

  if (!progress || !checklist || !resetButton) return;

  const checkboxes = [...checklist.querySelectorAll(".completion-check")];
  const countLabel = progress.querySelector("[aria-live='polite']");
  const storageKey = "contents-programming-week13-checklist-v1";

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
      // 브라우저 저장소를 사용할 수 없어도 현재 탭의 체크 기능은 유지합니다.
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
