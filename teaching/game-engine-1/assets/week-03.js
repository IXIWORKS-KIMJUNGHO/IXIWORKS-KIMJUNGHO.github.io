(() => {
  document.documentElement.classList.add("game-engine-week-three-root");

  const setupToc = () => {
    const navigation = document.querySelector("[data-week-three-toc]");
    if (!navigation) return;

    const entries = Array.from(navigation.querySelectorAll('a[href^="#"]'))
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

    const hashId = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
    setCurrent(entries.some((entry) => entry.id === hashId) ? hashId : entries[0].id);

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
      { rootMargin: "-16% 0px -72% 0px", threshold: [0, 1] },
    );

    for (const entry of entries) observer.observe(entry.target);
  };

  const setupQuizzes = () => {
    for (const quiz of document.querySelectorAll("[data-quiz]")) {
      const answer = quiz.dataset.answer;
      const feedback = quiz.querySelector("[data-quiz-feedback]");
      const options = Array.from(quiz.querySelectorAll("[data-choice]"));

      for (const option of options) {
        option.addEventListener("click", () => {
          const isCorrect = option.dataset.choice === answer;
          for (const candidate of options) {
            candidate.dataset.state = candidate === option
              ? (isCorrect ? "correct" : "incorrect")
              : "idle";
            candidate.setAttribute("aria-pressed", String(candidate === option));
          }

          if (feedback) {
            feedback.textContent = isCorrect
              ? quiz.dataset.correctFeedback
              : quiz.dataset.incorrectFeedback;
          }
        });
      }
    }
  };

  const setupCodeCopy = () => {
    const writeText = async (value) => {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return;
      }

      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    };

    for (const button of document.querySelectorAll("[data-copy-code]")) {
      const card = button.closest(".code-card");
      const code = card?.querySelector("pre code");
      if (!code) continue;

      button.addEventListener("click", async () => {
        try {
          await writeText(code.textContent.trim());
          button.dataset.copied = "true";
          button.textContent = "복사 완료";
          window.setTimeout(() => {
            button.dataset.copied = "false";
            button.textContent = "코드 복사";
          }, 1800);
        } catch {
          button.textContent = "직접 선택";
        }
      });
    }
  };

  const setupChecklists = () => {
    for (const checklist of document.querySelectorAll("[data-persistent-checklist]")) {
      const checks = Array.from(checklist.querySelectorAll("[data-check-id]"));
      const progress = checklist.parentElement?.querySelector("[data-checklist-progress]");
      const reset = checklist.parentElement?.querySelector("[data-checklist-reset]");
      const storageKey = checklist.dataset.storageKey;
      let resetConfirmationTimer = 0;

      const readSavedChecks = () => {
        if (!storageKey) return new Set();
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
          return new Set(Array.isArray(saved) ? saved : []);
        } catch {
          return new Set();
        }
      };

      const saveChecks = () => {
        if (!storageKey) return;
        const checkedIds = checks
          .filter((check) => check.checked)
          .map((check) => check.dataset.checkId);
        try {
          localStorage.setItem(storageKey, JSON.stringify(checkedIds));
        } catch {
          // The checklist remains usable when storage is unavailable.
        }
      };

      const clearResetConfirmation = () => {
        window.clearTimeout(resetConfirmationTimer);
        resetConfirmationTimer = 0;
        if (!reset) return;
        delete reset.dataset.confirming;
        reset.textContent = "체크 초기화";
      };

      const render = () => {
        const completed = checks.filter((check) => check.checked).length;
        if (progress) progress.textContent = `${completed} / ${checks.length} 완료`;
        if (reset) {
          reset.disabled = completed === 0;
          if (completed === 0) clearResetConfirmation();
        }
        for (const check of checks) {
          check.closest("li")?.setAttribute("data-checked", String(check.checked));
        }
      };

      const saved = readSavedChecks();
      for (const check of checks) {
        check.checked = saved.has(check.dataset.checkId);
        check.addEventListener("change", () => {
          clearResetConfirmation();
          render();
          saveChecks();
        });
      }

      reset?.addEventListener("click", () => {
        if (reset.dataset.confirming !== "true") {
          reset.dataset.confirming = "true";
          reset.textContent = "다시 눌러 초기화";
          resetConfirmationTimer = window.setTimeout(clearResetConfirmation, 4000);
          return;
        }

        clearResetConfirmation();
        for (const check of checks) check.checked = false;
        if (storageKey) {
          try {
            localStorage.removeItem(storageKey);
          } catch {
            // No further action is needed.
          }
        }
        render();
        checks[0]?.focus();
      });

      render();
    }
  };

  const setupMotionLab = () => {
    const lab = document.querySelector("[data-motion-lab]");
    if (!lab) return;

    const stage = lab.querySelector("[data-motion-stage]");
    const object = lab.querySelector("[data-motion-object]");
    const moveSpeed = lab.querySelector("[data-motion-speed]");
    const rotationSpeed = lab.querySelector("[data-rotation-speed]");
    const shouldRotate = lab.querySelector("[data-should-rotate]");
    const moveOutput = lab.querySelector("[data-motion-speed-output]");
    const rotationOutput = lab.querySelector("[data-rotation-speed-output]");
    const toggle = lab.querySelector("[data-motion-toggle]");
    if (!stage || !object || !moveSpeed || !rotationSpeed || !shouldRotate) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let userPaused = false;
    let inViewport = true;
    let position = 14;
    let rotation = 0;
    let previousTime = performance.now();
    let frameRequest = 0;

    const updateLabels = () => {
      if (moveOutput) moveOutput.textContent = `${Number(moveSpeed.value).toFixed(1)} u/s`;
      if (rotationOutput) rotationOutput.textContent = `${Math.round(Number(rotationSpeed.value))}°/s`;
    };

    const render = () => {
      object.style.transform = `translateX(${position}px) rotate(${rotation}deg)`;
    };

    const updateToggle = () => {
      if (!toggle) return;
      toggle.textContent = reduceMotion.matches
        ? "동작 줄이기 설정으로 정지"
        : (userPaused ? "재생" : "일시 정지");
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.disabled = reduceMotion.matches;
    };

    const shouldAnimate = () => (
      !userPaused
      && !reduceMotion.matches
      && !document.hidden
      && inViewport
    );

    const stopAnimation = () => {
      if (!frameRequest) return;
      cancelAnimationFrame(frameRequest);
      frameRequest = 0;
    };

    const tick = (now) => {
      frameRequest = 0;
      if (!shouldAnimate()) return;

      const deltaTime = Math.min((now - previousTime) / 1000, 0.05);
      previousTime = now;

      const maxPosition = Math.max(stage.clientWidth - object.offsetWidth - 18, 0);
      position += Number(moveSpeed.value) * 54 * deltaTime;
      if (position > maxPosition) position = 14;
      if (shouldRotate.checked) {
        rotation += Number(rotationSpeed.value) * deltaTime;
      }
      render();
      frameRequest = requestAnimationFrame(tick);
    };

    const syncAnimation = () => {
      if (!shouldAnimate()) {
        stopAnimation();
        return;
      }

      if (!frameRequest) {
        previousTime = performance.now();
        frameRequest = requestAnimationFrame(tick);
      }
    };

    moveSpeed.addEventListener("input", updateLabels);
    rotationSpeed.addEventListener("input", updateLabels);
    shouldRotate.addEventListener("change", render);
    toggle?.addEventListener("click", () => {
      userPaused = !userPaused;
      updateToggle();
      syncAnimation();
    });
    reduceMotion.addEventListener?.("change", () => {
      updateToggle();
      syncAnimation();
    });
    document.addEventListener("visibilitychange", syncAnimation);

    if ("IntersectionObserver" in window) {
      const visibilityObserver = new IntersectionObserver(([entry]) => {
        inViewport = Boolean(entry?.isIntersecting);
        syncAnimation();
      }, { rootMargin: "120px 0px" });
      visibilityObserver.observe(lab);
    }

    updateLabels();
    updateToggle();
    render();
    syncAnimation();
  };

  setupToc();
  setupQuizzes();
  setupCodeCopy();
  setupChecklists();
  setupMotionLab();
})();
