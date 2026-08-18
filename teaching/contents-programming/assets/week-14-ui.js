(() => {
  const compactViewport = window.matchMedia("(max-width: 980px)");
  const tableOfContents = document.querySelector("details.week-14-toc");

  if (tableOfContents) {
    const currentLabel = tableOfContents.querySelector(".toc-current");
    const links = [
      ...tableOfContents.querySelectorAll('.toc-links a[href^="#"]'),
    ];
    const sections = links
      .map((link) => {
        const id = link.getAttribute("href")?.slice(1);
        const section = id ? document.getElementById(id) : null;
        return section ? { id, link, section } : null;
      })
      .filter(Boolean);

    function setTocState(open) {
      tableOfContents.open = open;
      if (tableOfContents.dataset.detailsMotion === "ready") {
        tableOfContents.dataset.detailsState = open ? "open" : "closed";
      }
    }

    function syncTocToViewport(mediaQuery) {
      setTocState(!mediaQuery.matches);
    }

    function setCurrentSection(id) {
      for (const item of sections) {
        const isCurrent = item.id === id;
        item.link.toggleAttribute("aria-current", isCurrent);
        if (isCurrent) {
          item.link.setAttribute("aria-current", "location");
          if (currentLabel) currentLabel.textContent = item.link.textContent.trim();
        }
      }
    }

    syncTocToViewport(compactViewport);
    if (typeof compactViewport.addEventListener === "function") {
      compactViewport.addEventListener("change", syncTocToViewport);
    } else {
      compactViewport.addListener(syncTocToViewport);
    }

    const initialId = window.location.hash.slice(1);
    setCurrentSection(
      sections.some((item) => item.id === initialId)
        ? initialId
        : sections[0]?.id,
    );

    for (const item of sections) {
      item.link.addEventListener("click", () => {
        setCurrentSection(item.id);
        if (compactViewport.matches) setTocState(false);
      });
    }

    window.addEventListener("hashchange", () => {
      const id = window.location.hash.slice(1);
      if (sections.some((item) => item.id === id)) setCurrentSection(id);
    });

    if ("IntersectionObserver" in window) {
      const visibleSections = new Map();
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              visibleSections.set(entry.target.id, entry.boundingClientRect.top);
            } else {
              visibleSections.delete(entry.target.id);
            }
          }
          const current = [...visibleSections.entries()].sort(
            ([, firstTop], [, secondTop]) =>
              Math.abs(firstTop) - Math.abs(secondTop),
          )[0];
          if (current) setCurrentSection(current[0]);
        },
        { rootMargin: "-86px 0px -65% 0px", threshold: [0, 1] },
      );
      for (const item of sections) observer.observe(item.section);
    }
  }

  const progress = document.querySelector("[data-mission-progress]");
  const checklist = document.querySelector("[data-mission-checklist]");
  const resetButton = document.querySelector("[data-mission-reset]");
  if (!progress || !checklist || !resetButton) return;

  const checkboxes = [...checklist.querySelectorAll(".completion-check")];
  const countLabel = progress.querySelector("[aria-live='polite']");
  const storageKey = "contents-programming-week14-checklist-v1";
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
      checkbox.closest("li")?.setAttribute("data-checked", checkbox.checked);
    }
    countLabel.textContent = `완료 ${checkedBoxes.length}/${checkboxes.length}`;
    progress.dataset.complete = String(
      checkedBoxes.length === checkboxes.length,
    );
    if (!persist) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(checkedBoxes.map((checkbox) => checkbox.id)),
      );
    } catch {
      // 저장소를 사용할 수 없어도 현재 탭의 체크 기능은 유지합니다.
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
