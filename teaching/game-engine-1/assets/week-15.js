(() => {
  "use strict";

  const storageKeys = Object.freeze({
    tests: "game-engine-1-week-15-tests-v1",
    checkpoint: "game-engine-1-week-15-checkpoint-v1",
  });

  const readStorage = (key, fallback) => {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeStorage = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  const removeStorage = (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Controls continue to work when storage is unavailable.
    }
  };

  const setupTableOfContents = () => {
    const links = [...document.querySelectorAll('[data-week-fifteen-toc] a[href^="#"]')];
    if (!links.length || !("IntersectionObserver" in window)) return;

    const items = links
      .map((link) => {
        const id = link.getAttribute("href")?.slice(1);
        const section = id ? document.getElementById(id) : null;
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    const activate = (id) => {
      for (const item of items) {
        if (item.section.id === id) item.link.setAttribute("aria-current", "location");
        else item.link.removeAttribute("aria-current");
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) activate(visible[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.2] },
    );

    items.forEach(({ section }) => observer.observe(section));
  };

  const spreadsheetSafe = (value) => {
    const normalized = String(value ?? "").replace(/\r?\n/g, " ").trim();
    return /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  };

  const csvCell = (value) => `"${spreadsheetSafe(value).replace(/"/g, '""')}"`;

  const setupTestTable = () => {
    const table = document.querySelector("[data-test-table]");
    if (!table) return;

    const rows = [...table.querySelectorAll("[data-test-id]")];
    const counter = document.querySelector("[data-test-count]");
    const progress = document.querySelector("[data-test-progress]");
    const exportButton = document.querySelector("[data-export-tests]");
    const resetButton = document.querySelector("[data-reset-tests]");
    const saved = readStorage(storageKeys.tests, {});

    const serialize = () =>
      Object.fromEntries(
        rows.map((row) => [
          row.dataset.testId,
          {
            result: row.querySelector("[data-test-result]").value,
            note: row.querySelector("[data-test-note]").value,
          },
        ]),
      );

    const update = () => {
      const state = serialize();
      const passed = Object.values(state).filter((item) => item.result === "PASS").length;

      for (const row of rows) {
        const result = state[row.dataset.testId].result.toLowerCase();
        if (result) row.dataset.result = result;
        else delete row.dataset.result;
      }

      if (counter) counter.textContent = `${passed} / ${rows.length} PASS`;
      if (progress) progress.dataset.complete = String(passed === rows.length);
      writeStorage(storageKeys.tests, state);
    };

    for (const row of rows) {
      const state = saved[row.dataset.testId];
      const result = row.querySelector("[data-test-result]");
      const note = row.querySelector("[data-test-note]");

      if (state) {
        result.value = state.result ?? "";
        note.value = state.note ?? "";
      }

      result.addEventListener("input", update);
      note.addEventListener("input", update);
    }

    exportButton?.addEventListener("click", () => {
      const lines = [
        ["course", "week", "test_id", "action", "expected", "result", "evidence"],
        ...rows.map((row) => {
          const cells = row.querySelectorAll("th, td");
          return [
            "Game Engine I",
            "15",
            row.dataset.testId,
            cells[1].textContent,
            cells[2].textContent,
            row.querySelector("[data-test-result]").value,
            row.querySelector("[data-test-note]").value,
          ];
        }),
      ];
      const csv = `\uFEFF${lines.map((line) => line.map(csvCell).join(",")).join("\r\n")}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "week15_release-tests.csv";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    });

    resetButton?.addEventListener("click", () => {
      if (!window.confirm("이 기기에 저장된 15주차 테스트 기록을 초기화할까요?")) return;
      rows.forEach((row) => {
        row.querySelector("[data-test-result]").value = "";
        row.querySelector("[data-test-note]").value = "";
      });
      removeStorage(storageKeys.tests);
      update();
    });

    update();
  };

  const setupCheckpoint = () => {
    const panel = document.querySelector("[data-build-checklist]");
    if (!panel) return;

    const checks = [...panel.querySelectorAll("[data-check-id]")];
    const counter = panel.querySelector("[data-build-count]");
    const status = panel.querySelector("[data-build-status]");
    const resetButton = panel.querySelector("[data-build-reset]");
    const saved = readStorage(storageKeys.checkpoint, {});

    checks.forEach((check) => {
      check.checked = Boolean(saved[check.dataset.checkId]);
    });

    const update = () => {
      const state = Object.fromEntries(checks.map((check) => [check.dataset.checkId, check.checked]));
      const completed = checks.filter((check) => check.checked).length;
      const isComplete = completed === checks.length;

      checks.forEach((check) => {
        const item = check.closest("li");
        if (item) item.dataset.checked = String(check.checked);
      });
      panel.dataset.complete = String(isComplete);
      if (counter) counter.textContent = `${completed} / ${checks.length}`;
      if (status) status.textContent = isComplete ? "릴리스 체크포인트가 준비되었습니다" : "아직 제출할 수 없습니다";
      writeStorage(storageKeys.checkpoint, state);
    };

    checks.forEach((check) => check.addEventListener("change", update));
    resetButton?.addEventListener("click", () => {
      if (!window.confirm("이 기기에 저장된 15주차 체크 상태를 초기화할까요?")) return;
      checks.forEach((check) => {
        check.checked = false;
      });
      removeStorage(storageKeys.checkpoint);
      update();
    });

    update();
  };

  setupTableOfContents();
  setupTestTable();
  setupCheckpoint();
})();
