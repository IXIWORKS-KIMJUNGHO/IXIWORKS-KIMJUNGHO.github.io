(() => {
  document.documentElement.classList.add("game-engine-week-twelve-root");

  const readStorage = (key, fallback) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "null");
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Every control remains usable when storage is blocked.
    }
  };

  const removeStorage = (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // No additional recovery is required when storage is blocked.
    }
  };

  const buildChecklist = document.querySelector("[data-build-checklist]");
  const buildProgressLabel = document.querySelector("[data-build-progress-label]");
  const buildReset = document.querySelector("[data-build-reset]");
  const buildStorageKey = "game-engine-1-week-12-build-v1";

  if (buildChecklist && buildProgressLabel) {
    const checks = Array.from(buildChecklist.querySelectorAll("[data-check-id]"));
    const savedChecks = new Set(readStorage(buildStorageKey, []));

    const renderBuildProgress = () => {
      const completed = checks.filter((check) => check.checked).length;
      buildProgressLabel.textContent = `${completed} / ${checks.length} 완료`;
      buildChecklist.dataset.complete = String(completed === checks.length);

      for (const check of checks) {
        check.closest("li")?.setAttribute("data-checked", String(check.checked));
      }
    };

    const saveBuildProgress = () => {
      writeStorage(
        buildStorageKey,
        checks
          .filter((check) => check.checked)
          .map((check) => check.dataset.checkId),
      );
    };

    for (const check of checks) {
      check.checked = savedChecks.has(check.dataset.checkId);
      check.addEventListener("change", () => {
        renderBuildProgress();
        saveBuildProgress();
      });
    }

    buildReset?.addEventListener("click", () => {
      if (!window.confirm("제출 전 체크 기록을 초기화할까요?")) return;
      for (const check of checks) check.checked = false;
      removeStorage(buildStorageKey);
      renderBuildProgress();
      checks[0]?.focus();
    });

    renderBuildProgress();
  }

  const testTable = document.querySelector("[data-test-table]");
  const studentId = document.querySelector("[data-student-id]");
  const studentName = document.querySelector("[data-student-name]");
  const testProgress = document.querySelector("[data-test-progress]");
  const testProgressLabel = document.querySelector("[data-test-progress-label]");
  const exportTests = document.querySelector("[data-export-tests]");
  const resetTests = document.querySelector("[data-reset-tests]");
  const testStatusMessage = document.querySelector("[data-test-status-message]");
  const testStorageKey = "game-engine-1-week-12-tests-v1";

  if (testTable && testProgress && testProgressLabel) {
    const rows = Array.from(testTable.querySelectorAll("[data-test-id]"));
    const saved = readStorage(testStorageKey, { tests: {} });

    if (saved && typeof saved === "object" && Object.hasOwn(saved, "identity")) {
      writeStorage(testStorageKey, { tests: saved.tests ?? {} });
    }

    for (const row of rows) {
      const result = saved.tests?.[row.dataset.testId] ?? {};
      const status = row.querySelector("[data-test-status]");
      const note = row.querySelector("[data-test-note]");
      if (status) status.value = result.status ?? "";
      if (note) note.value = result.note ?? "";
    }

    const serializeTestResults = () => {
      const tests = {};
      for (const row of rows) {
        tests[row.dataset.testId] = {
          status: row.querySelector("[data-test-status]")?.value ?? "",
          note: row.querySelector("[data-test-note]")?.value.trim() ?? "",
        };
      }

      return { tests };
    };

    const readIdentity = () => ({
      studentId: studentId?.value.trim() ?? "",
      studentName: studentName?.value.trim() ?? "",
    });

    const renderTestProgress = () => {
      const requiredRows = rows.filter((row) => row.dataset.required === "true");
      const passed = requiredRows.filter(
        (row) => row.querySelector("[data-test-status]")?.value === "pass",
      ).length;

      for (const row of rows) {
        const result = row.querySelector("[data-test-status]")?.value ?? "";
        if (result) row.dataset.result = result;
        else delete row.dataset.result;
      }

      testProgressLabel.textContent = `${passed} / ${requiredRows.length} PASS`;
      testProgress.dataset.complete = String(passed === requiredRows.length);
    };

    const saveTests = () => {
      writeStorage(testStorageKey, serializeTestResults());
      renderTestProgress();
    };

    for (const control of testTable.querySelectorAll("select, input")) {
      control.addEventListener("change", saveTests);
      control.addEventListener("input", saveTests);
    }

    const spreadsheetSafe = (value) => {
      const text = String(value ?? "");
      return /^[=+\-@]/.test(text) ? `'${text}` : text;
    };

    const csvCell = (value) => `"${spreadsheetSafe(value).replaceAll('"', '""')}"`;

    exportTests?.addEventListener("click", () => {
      const identity = readIdentity();
      const header = ["ID", "필수", "조작·조건", "기대 결과", "판정", "관찰·수정 기록"];
      const csvRows = [header.map(csvCell).join(",")];

      for (const row of rows) {
        const cells = row.querySelectorAll("th, td");
        const status = row.querySelector("[data-test-status]")?.value ?? "";
        const note = row.querySelector("[data-test-note]")?.value.trim() ?? "";
        csvRows.push(
          [
            cells[0]?.textContent.trim() ?? "",
            row.dataset.required === "true" ? "필수" : "선택",
            cells[1]?.textContent.trim() ?? "",
            cells[2]?.textContent.trim() ?? "",
            status ? status.toUpperCase() : "미실행",
            note,
          ]
            .map(csvCell)
            .join(","),
        );
      }

      csvRows.push("");
      csvRows.push(["학번", identity.studentId].map(csvCell).join(","));
      csvRows.push(["이름", identity.studentName].map(csvCell).join(","));
      csvRows.push(["수업", "Game Engine I / Week 12 / MCP and CLI Automation Readiness"].map(csvCell).join(","));

      const filePart = (value) =>
        value
          .normalize("NFC")
          .replace(/[^\p{L}\p{N}_-]+/gu, "_")
          .replace(/^_+|_+$/g, "");
      const identityParts = [
        filePart(identity.studentId),
        filePart(identity.studentName),
      ].filter(Boolean);
      const filename = identityParts.length
        ? `week12_${identityParts.join("_")}_test.csv`
        : "week12_학번_이름_test.csv";

      const blob = new Blob(["\ufeff", csvRows.join("\r\n")], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url;
      download.download = filename;
      document.body.append(download);
      download.click();
      download.remove();
      URL.revokeObjectURL(url);

      if (testStatusMessage) {
        testStatusMessage.textContent = `${filename} 파일을 저장했습니다.`;
      }
    });

    resetTests?.addEventListener("click", () => {
      if (!window.confirm("학번, 이름과 테스트 기록을 초기화할까요?")) return;
      if (studentId) studentId.value = "";
      if (studentName) studentName.value = "";
      for (const row of rows) {
        const status = row.querySelector("[data-test-status]");
        const note = row.querySelector("[data-test-note]");
        if (status) status.value = "";
        if (note) note.value = "";
      }
      removeStorage(testStorageKey);
      renderTestProgress();
      if (testStatusMessage) {
        testStatusMessage.textContent = "이 브라우저의 테스트 기록을 초기화했습니다.";
      }
      studentId?.focus();
    });

    renderTestProgress();
  }

  const permissionLab = document.querySelector("[data-permission-lab]");

  if (permissionLab) {
    const operation = permissionLab.querySelector("[data-permission-operation]");
    const result = permissionLab.querySelector("[data-permission-result]");
    const reason = permissionLab.querySelector("[data-permission-reason]");
    const cards = {
      console: {
        label: "READ / 바로 관찰 가능",
        reason: "Console을 읽고 요약합니다. 프로젝트 상태를 바꾸지 않으므로 baseline 확인 뒤 허용할 수 있습니다.",
        level: "read",
      },
      component: {
        label: "READ / 대상 고정 후 허용",
        reason: "이름이 지정된 GameObject의 Component 목록만 읽습니다. 검색 범위와 출력 형식을 먼저 고정합니다.",
        level: "read",
      },
      probe: {
        label: "WRITE / 계약·승인·복구 필요",
        reason: "AutomationProbe의 Position X 한 값만 바꾸고 즉시 전후 차이와 원상복구를 검증해야 합니다.",
        level: "write",
      },
      delete: {
        label: "BLOCK / 이번 주 금지",
        reason: "삭제는 범위와 의존성을 되돌리기 어렵습니다. 12주차 실습에서는 허용하지 않습니다.",
        level: "block",
      },
      package: {
        label: "BLOCK / 수업 중 금지",
        reason: "Package 설치는 프로젝트 전체와 재컴파일에 영향을 줍니다. 교수자가 수업 전에만 준비합니다.",
        level: "block",
      },
    };

    const renderPermission = () => {
      const card = cards[operation?.value] ?? cards.console;
      if (result) result.textContent = card.label;
      if (reason) reason.textContent = card.reason;
      permissionLab.dataset.permissionLevel = card.level;
    };

    operation?.addEventListener("change", renderPermission);
    renderPermission();
  }

  const fallbackCopy = (text) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  };

  for (const button of document.querySelectorAll("[data-copy-code]")) {
    button.addEventListener("click", async () => {
      const code = document.getElementById(button.dataset.copyCode)?.textContent ?? "";
      let copied = false;

      try {
        await navigator.clipboard.writeText(code);
        copied = true;
      } catch {
        copied = fallbackCopy(code);
      }

      const copyStatus = button.closest(".code-panel")?.querySelector("[data-copy-status]");
      const idleLabel = button.textContent;
      button.textContent = copied ? "복사됨" : "복사 실패";

      if (copyStatus) {
        copyStatus.textContent = copied
          ? "코드를 복사했습니다. 수업에서는 각 줄의 역할을 확인하며 직접 입력하세요."
          : "복사하지 못했습니다. 코드 영역을 직접 선택해 복사하세요.";
      }

      window.setTimeout(() => {
        button.textContent = idleLabel;
      }, 1800);
    });
  }

  const navigation = document.querySelector("[data-week-twelve-toc]");
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
    if (id === currentId) return;
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

  const initialId = location.hash ? decodeURIComponent(location.hash.slice(1)) : entries[0].id;
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
    { rootMargin: "-18% 0px -70% 0px", threshold: [0, 1] },
  );

  for (const entry of entries) observer.observe(entry.target);
})();
