(() => {
  "use strict";

  const storageKeys = {
    tests: "game-engine-1-week-14-tests-v1",
    checkpoint: "game-engine-1-week-14-checkpoint-v1",
    triage: "game-engine-1-week-14-triage-v1",
  };

  const routeTestCopy = Object.freeze({
    fix: Object.freeze({
      label: "FIX 경로",
      action: "수정 전과 같은 정상 조건 재검사",
      expected: "기대 결과가 실제 화면과 상태에 나타남",
      placeholder: "입력, before와 after 결과",
    }),
    diagnose: Object.freeze({
      label: "DIAGNOSE 경로",
      action: "재현 조건에서 최초로 다른 상태 확인",
      expected: "원인 가설, 확인 결과와 다음 진단 행동이 기록됨",
      placeholder: "최초 다른 상태, 근거, 다음 검사",
    }),
    defer: Object.freeze({
      label: "DEFER 경로",
      action: "보류 항목과 핵심 범위를 다시 비교",
      expected: "baseline을 바꾸지 않고 보류 위치와 근거가 기록됨",
      placeholder: "보류 위치, 이유, 보존한 baseline",
    }),
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
      // The visible controls still work when storage is unavailable.
    }
  };

  const setupTableOfContents = () => {
    const links = [...document.querySelectorAll("[data-toc-link]")];
    if (!links.length || !("IntersectionObserver" in window)) return;

    const sections = links
      .map((link) => {
        const id = link.getAttribute("href")?.slice(1);
        const section = id ? document.getElementById(id) : null;
        return section ? { link, section } : null;
      })
      .filter(Boolean);

    const activate = (id) => {
      for (const item of sections) {
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

    sections.forEach(({ section }) => observer.observe(section));
  };

  const updateRouteTestCopy = (routeKey) => {
    const copy = routeTestCopy[routeKey];
    const table = document.querySelector("[data-test-table]");
    if (!copy || !table) return;

    const previousRoute = table.dataset.route;
    const row = table.querySelector('[data-test-id="T05"]');
    const note = row?.querySelector("[data-test-note]");

    row?.querySelector("[data-route-test-action]")?.replaceChildren(copy.action);
    row?.querySelector("[data-route-test-expected]")?.replaceChildren(copy.expected);
    if (note) note.placeholder = copy.placeholder;

    const routeLabel = document.querySelector("[data-test-route-label]");
    if (routeLabel) routeLabel.textContent = copy.label;

    table.dataset.route = routeKey;
    if (previousRoute && previousRoute !== routeKey) {
      const routeDependentRows = ["T04", "T05"]
        .map((testId) => table.querySelector(`[data-test-id="${testId}"]`))
        .filter(Boolean);

      for (const routeRow of routeDependentRows) {
        routeRow.querySelector("[data-test-result]").value = "";
        routeRow.querySelector("[data-test-note]").value = "";
      }

      routeDependentRows.at(-1)?.querySelector("[data-test-result]")
        .dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const setupTriageLab = () => {
    const lab = document.querySelector("[data-triage-lab]");
    if (!lab) return;

    const priorityInput = lab.querySelector("[data-triage-priority]");
    const minutesInput = lab.querySelector("[data-triage-minutes]");
    const riskInput = lab.querySelector("[data-triage-risk]");
    const output = lab.querySelector("[data-triage-output]");
    const route = lab.querySelector("[data-triage-route]");
    const message = lab.querySelector("[data-triage-message]");
    const saved = readStorage(storageKeys.triage, null);

    if (saved) {
      if ([...priorityInput.options].some((option) => option.value === saved.priority)) priorityInput.value = saved.priority;
      if (Number.isFinite(saved.minutes)) minutesInput.value = saved.minutes;
      if ([...riskInput.options].some((option) => option.value === saved.risk)) riskInput.value = saved.risk;
    }

    const calculate = () => {
      const priority = priorityInput.value;
      const minutes = Math.max(1, Number(minutesInput.value) || 1);
      const risk = riskInput.value;
      const important = priority === "p0" || priority === "p1";
      let routeKey;

      if (important && minutes <= 20 && risk === "low") {
        routeKey = "fix";
        route.textContent = "FIX / 제한 수정";
        message.textContent = "승인 범위 안에서 수정한 뒤 같은 조건과 회귀 테스트를 실행합니다.";
        output.dataset.state = "fix";
      } else if (important || risk === "high" || minutes > 20) {
        routeKey = "diagnose";
        route.textContent = "DIAGNOSE / 원인 확정";
        message.textContent = "안전한 build를 보존하고 재현, 최초 다른 상태와 다음 진단 행동을 기록합니다.";
        output.dataset.state = "diagnose";
      } else {
        routeKey = "defer";
        route.textContent = "DEFER / 범위 밖 보류";
        message.textContent = "핵심 loop와 제출 준비를 먼저 확인하고 이 항목은 15주차 목록 또는 Drop으로 옮깁니다.";
        output.dataset.state = "defer";
      }

      updateRouteTestCopy(routeKey);
      writeStorage(storageKeys.triage, { priority, minutes, risk });
    };

    [priorityInput, minutesInput, riskInput].forEach((input) => input.addEventListener("input", calculate));
    calculate();
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
      counter.textContent = `${passed} / ${rows.length} PASS`;
      counter.dataset.complete = String(passed === rows.length);
      writeStorage(storageKeys.tests, state);
    };

    for (const row of rows) {
      const state = saved[row.dataset.testId];
      if (state) {
        row.querySelector("[data-test-result]").value = state.result ?? "";
        row.querySelector("[data-test-note]").value = state.note ?? "";
      }
      row.querySelectorAll("select, input").forEach((control) => control.addEventListener("input", update));
    }

    exportButton?.addEventListener("click", () => {
      const lines = [
        ["course", "week", "test_id", "action", "expected", "result", "evidence"],
        ...rows.map((row) => {
          const cells = row.querySelectorAll("th, td");
          return [
            "Game Engine I",
            "14",
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
      anchor.download = "week14_학번_이름_mentoring-tests.csv";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    });

    resetButton?.addEventListener("click", () => {
      if (!window.confirm("이 기기에 저장된 14주차 테스트 기록을 초기화할까요?")) return;
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
    const checklist = document.querySelector("[data-build-checklist]");
    if (!checklist) return;

    const checks = [...checklist.querySelectorAll("[data-check-id]")];
    const counter = checklist.querySelector("[data-build-count]");
    const status = checklist.querySelector("[data-build-status]");
    const resetButton = checklist.querySelector("[data-build-reset]");
    const saved = readStorage(storageKeys.checkpoint, {});

    checks.forEach((check) => {
      check.checked = Boolean(saved[check.dataset.checkId]);
    });

    const update = () => {
      const state = Object.fromEntries(checks.map((check) => [check.dataset.checkId, check.checked]));
      const completed = checks.filter((check) => check.checked).length;
      counter.textContent = `${completed} / ${checks.length}`;
      status.textContent = completed === checks.length ? "체크포인트 제출 준비가 끝났습니다" : "아직 제출할 수 없습니다";
      status.dataset.complete = String(completed === checks.length);
      writeStorage(storageKeys.checkpoint, state);
    };

    checks.forEach((check) => check.addEventListener("change", update));
    resetButton?.addEventListener("click", () => {
      if (!window.confirm("이 기기에 저장된 14주차 체크 상태를 초기화할까요?")) return;
      checks.forEach((check) => {
        check.checked = false;
      });
      removeStorage(storageKeys.checkpoint);
      update();
    });

    update();
  };

  setupTableOfContents();
  setupTriageLab();
  setupTestTable();
  setupCheckpoint();
})();
