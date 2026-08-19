(() => {
  const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
  const sections = [
    ...new Set(
      sectionLinks
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean),
    ),
  ];

  if (sectionLinks.length && sections.length && "IntersectionObserver" in window) {
    const setCurrent = (id) => {
      sectionLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${id}`) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0.05, 0.25, 0.55] },
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const missionChecks = [...document.querySelectorAll("[data-mission-check]")];
  const progressText = document.querySelector("[data-progress-text]");
  const progressBar = document.querySelector("[data-progress-bar]");
  const resetButton = document.querySelector("[data-reset-checks]");
  const checklistSaveState = document.querySelector("[data-check-save-state]");
  const lessonKey = document.body.dataset.lessonKey || "game-engine-1-week-02";
  const checklistKey = `${lessonKey}:checks`;
  const storageApi = globalThis.GameEngineWeek2Storage;
  const browserStorage = storageApi?.getBrowserStorage(globalThis) ?? null;
  const reportStorageError = (status, message) => {
    if (!status) return;
    status.dataset.state = "error";
    status.textContent = message;
  };
  const persistJsonWithStatus =
    storageApi?.persistJsonWithStatus ??
    (({ status, errorMessage }) => {
      reportStorageError(status, errorMessage);
      return false;
    });
  const readJsonWithStatus =
    storageApi?.readJsonWithStatus ??
    (({ fallback, status, unavailableMessage }) => {
      reportStorageError(status, unavailableMessage);
      return fallback;
    });

  if (missionChecks.length) {
    const savedChecks = readJsonWithStatus({
      storage: browserStorage,
      key: checklistKey,
      fallback: {},
      status: checklistSaveState,
      unavailableMessage: "이 브라우저의 저장 공간에 접근할 수 없습니다. 제출 전 통과 화면을 캡처하세요.",
      errorMessage: "이전에 저장한 통과 확인을 읽을 수 없어 빈 상태로 시작했습니다. 새 확인을 저장하면 상태를 다시 만듭니다.",
    });

    missionChecks.forEach((check) => {
      check.checked = Boolean(savedChecks[check.dataset.missionCheck]);
    });

    const updateProgress = ({ persist = true } = {}) => {
      const completed = missionChecks.filter((check) => check.checked).length;

      if (progressText) progressText.textContent = `${completed} / ${missionChecks.length}`;
      if (progressBar) {
        progressBar.max = missionChecks.length;
        progressBar.value = completed;
        progressBar.setAttribute("aria-valuetext", `${missionChecks.length}개 중 ${completed}개 완료`);
      }

      if (persist) {
        const snapshot = Object.fromEntries(
          missionChecks.map((check) => [check.dataset.missionCheck, check.checked]),
        );
        persistJsonWithStatus({
          storage: browserStorage,
          key: checklistKey,
          value: snapshot,
          status: checklistSaveState,
          successMessage: "통과 확인을 이 기기에 저장했습니다. Unity 프로젝트 파일과는 별개입니다.",
          errorMessage: "이 브라우저에서는 저장할 수 없습니다. 제출 전 통과 화면을 캡처하세요.",
        });
      }
    };

    missionChecks.forEach((check) => check.addEventListener("change", updateProgress));
    updateProgress({ persist: false });

    resetButton?.addEventListener("click", () => {
      const shouldReset = window.confirm("이 기기에 저장된 통과 확인을 모두 지울까요?");
      if (!shouldReset) return;
      missionChecks.forEach((check) => {
        check.checked = false;
      });
      updateProgress();
      missionChecks[0]?.focus();
    });
  }

  const missionNote = document.querySelector("[data-mission-note]");
  const saveState = document.querySelector("[data-save-state]");

  if (missionNote) {
    const noteKey = `${lessonKey}:note`;
    missionNote.value = readJsonWithStatus({
      storage: browserStorage,
      key: noteKey,
      fallback: "",
      status: saveState,
      unavailableMessage: "이 브라우저의 저장 공간에 접근할 수 없습니다. 제출 전에 문장을 따로 복사하세요.",
      errorMessage: "이전에 저장한 문장을 읽을 수 없어 빈 상태로 시작했습니다. 새로 입력하면 저장 상태를 다시 만듭니다.",
    });

    missionNote.addEventListener("input", () => {
      persistJsonWithStatus({
        storage: browserStorage,
        key: noteKey,
        value: missionNote.value,
        status: saveState,
        successMessage: "이 기기에 저장됨",
        errorMessage: "이 브라우저에서는 저장할 수 없습니다. 제출 전에 문장을 복사하세요.",
      });
    });
  }
})();
