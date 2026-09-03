(() => {
  document.documentElement.classList.add("game-engine-ot-root");

  const checklist = document.querySelector("[data-install-checklist]");
  const progress = document.querySelector("[data-install-progress]");
  const progressLabel = document.querySelector("[data-progress-label]");
  const resetButton = document.querySelector("[data-progress-reset]");
  const storageKey = "game-engine-1-week-01-install-v1";

  if (checklist && progress && progressLabel) {
    const checks = Array.from(checklist.querySelectorAll("[data-check-id]"));

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
        .map((check) => check.dataset.checkId);

      try {
        localStorage.setItem(storageKey, JSON.stringify(checkedIds));
      } catch {
        // The checklist still works when browser storage is unavailable.
      }
    };

    const renderProgress = () => {
      const completed = checks.filter((check) => check.checked).length;
      progressLabel.textContent = `${completed} / ${checks.length} 완료`;
      progress.dataset.complete = String(completed === checks.length);

      for (const check of checks) {
        check.closest("li")?.setAttribute("data-checked", String(check.checked));
      }
    };

    const savedChecks = readSavedChecks();
    for (const check of checks) {
      check.checked = savedChecks.has(check.dataset.checkId);
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

  const videoGrid = document.querySelector("[data-mwu-videos]");
  if (videoGrid) {
    videoGrid.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-youtube-id]");
      if (!trigger || !videoGrid.contains(trigger)) return;

      event.preventDefault();
      const id = trigger.dataset.youtubeId;
      if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;

      const shell = document.createElement("div");
      shell.className = "mwu-frame";
      const frame = document.createElement("iframe");
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
      frame.title = trigger.getAttribute("aria-label") ?? "YouTube";
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      frame.allowFullscreen = true;
      frame.referrerPolicy = "strict-origin-when-cross-origin";
      shell.append(frame);
      trigger.replaceWith(shell);
    });
  }

  const navigation = document.querySelector("[data-orientation-toc]");
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
