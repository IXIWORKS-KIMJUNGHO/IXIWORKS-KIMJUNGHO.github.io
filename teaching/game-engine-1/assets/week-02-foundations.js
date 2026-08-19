(() => {
  document.documentElement.classList.add(
    "game-engine-ot-root",
    "game-engine-foundations-root",
  );

  const checklist = document.querySelector("[data-lab-checklist]");
  const progress = document.querySelector("[data-lab-progress]");
  const progressLabel = document.querySelector("[data-progress-label]");
  const progressMessage = document.querySelector("[data-progress-message]");
  const resetButton = document.querySelector("[data-progress-reset]");
  const storageKey = "game-engine-1-week-02-foundations-v1";

  if (checklist && progress && progressLabel && progressMessage) {
    const checks = Array.from(checklist.querySelectorAll("[data-lab-check-id]"));
    const messages = [
      "프로젝트 생성부터 시작합니다.",
      "프로젝트가 열렸습니다. 저장 구조를 만듭니다.",
      "Scene을 저장했습니다. 화면의 바닥을 만듭니다.",
      "배경이 준비됐습니다. Player 구조를 조립합니다.",
      "Player 계층이 생겼습니다. Scene을 그룹으로 정리합니다.",
      "Hierarchy가 정리됐습니다. Sprite 순서를 설정합니다.",
      "렌더 순서가 정해졌습니다. Prefab 원본을 만듭니다.",
      "Prefab 재사용까지 완료했습니다. 실행 상태를 검증합니다.",
      "장면 검증 완료. 저장 상태와 Console을 마지막으로 확인합니다.",
    ];

    const readSavedChecks = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        return new Set(Array.isArray(saved) ? saved : []);
      } catch {
        return new Set();
      }
    };

    const saveChecks = () => {
      const checkedIds = checks
        .filter((check) => check.checked)
        .map((check) => check.dataset.labCheckId);

      try {
        localStorage.setItem(storageKey, JSON.stringify(checkedIds));
      } catch {
        // The checklist remains usable when browser storage is unavailable.
      }
    };

    const renderProgress = () => {
      const completed = checks.filter((check) => check.checked).length;
      progressLabel.textContent = `${completed} / ${checks.length} 완료`;
      progressMessage.textContent = messages[completed] ?? messages.at(-1);
      progress.dataset.complete = String(completed === checks.length);

      for (const check of checks) {
        check.closest("li")?.setAttribute("data-checked", String(check.checked));
      }
    };

    const savedChecks = readSavedChecks();
    for (const check of checks) {
      check.checked = savedChecks.has(check.dataset.labCheckId);
      check.addEventListener("change", () => {
        renderProgress();
        saveChecks();
      });
    }

    resetButton?.addEventListener("click", () => {
      for (const check of checks) check.checked = false;

      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Nothing else is required when browser storage is unavailable.
      }

      renderProgress();
      checks[0]?.focus();
    });

    renderProgress();
  }

  const navigation = document.querySelector("[data-foundations-toc]");
  if (!navigation) return;

  const links = Array.from(navigation.querySelectorAll('a[href^="#"]'));
  const entries = links
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const target = document.getElementById(id);
      return target ? { id, link, target } : null;
    })
    .filter(Boolean);

  if (entries.length === 0) return;

  let currentId = "";

  const setCurrent = (id, reveal = false) => {
    if (currentId === id) return;
    currentId = id;

    for (const entry of entries) {
      if (entry.id === id) {
        entry.link.setAttribute("aria-current", "location");
        if (reveal && matchMedia("(max-width: 980px)").matches) {
          entry.link.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      } else {
        entry.link.removeAttribute("aria-current");
      }
    }
  };

  const initialId = location.hash
    ? decodeURIComponent(location.hash.slice(1))
    : entries[0].id;
  setCurrent(entries.some((entry) => entry.id === initialId) ? initialId : entries[0].id);

  for (const entry of entries) {
    entry.link.addEventListener("click", () => setCurrent(entry.id, true));
  }

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (observedEntries) => {
      const visible = observedEntries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible[0]?.target.id) setCurrent(visible[0].target.id, true);
    },
    {
      rootMargin: "-18% 0px -70% 0px",
      threshold: [0, 1],
    },
  );

  for (const entry of entries) observer.observe(entry.target);
})();
