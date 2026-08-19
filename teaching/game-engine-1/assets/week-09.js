(() => {
  document.documentElement.classList.add("game-engine-week-nine-root");

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
      return true;
    } catch {
      return false;
    }
  };

  const removeStorage = (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  };

  const createResetConfirmation = ({ button, status, prompt, onConfirm }) => {
    if (!button) return;

    const defaultLabel = button.textContent;
    let resetTimer = 0;

    const disarm = (message = "") => {
      window.clearTimeout(resetTimer);
      resetTimer = 0;
      delete button.dataset.confirming;
      button.textContent = defaultLabel;
      if (message && status) status.textContent = message;
    };

    button.addEventListener("click", () => {
      if (button.dataset.confirming !== "true") {
        button.dataset.confirming = "true";
        button.textContent = "정말 초기화";
        if (status) status.textContent = `${prompt} 5초 안에 한 번 더 눌러 주세요.`;
        resetTimer = window.setTimeout(
          () => disarm("초기화하지 않았습니다. 기존 기록을 유지합니다."),
          5_000,
        );
        return;
      }

      disarm();
      onConfirm();
    });
  };

  const buildChecklist = document.querySelector("[data-build-checklist]");
  const buildProgressLabel = document.querySelector("[data-build-progress-label]");
  const buildReset = document.querySelector("[data-build-reset]");
  const buildStatus = document.querySelector("[data-build-status]");
  const buildStorageKey = "game-engine-1-week-09-build-v1";

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
      const stored = writeStorage(
        buildStorageKey,
        checks
          .filter((check) => check.checked)
          .map((check) => check.dataset.checkId),
      );
      if (!stored && buildStatus) {
        buildStatus.textContent = "체크 상태를 브라우저에 저장할 수 없습니다. 제출 전 현재 화면을 별도로 남기세요.";
      }
    };

    for (const check of checks) {
      check.checked = savedChecks.has(check.dataset.checkId);
      check.addEventListener("change", () => {
        renderBuildProgress();
        saveBuildProgress();
      });
    }

    createResetConfirmation({
      button: buildReset,
      status: buildStatus,
      prompt: "제출 전 체크 상태를 모두 지우려면",
      onConfirm: () => {
        for (const check of checks) check.checked = false;
        const cleared = removeStorage(buildStorageKey);
        renderBuildProgress();
        if (buildStatus) {
          buildStatus.textContent = cleared
            ? "제출 전 체크 상태를 초기화했습니다."
            : "화면의 체크는 지웠지만 브라우저 저장 기록은 지우지 못했습니다. 사이트 데이터를 직접 삭제하세요.";
        }
        checks[0]?.focus();
      },
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
  const testStorageKey = "game-engine-1-week-09-tests-v1";

  if (testTable && testProgress && testProgressLabel) {
    const rows = Array.from(testTable.querySelectorAll("[data-test-id]"));
    const saved = readStorage(testStorageKey, { tests: {} });

    if (
      Object.hasOwn(saved, "identity") &&
      !writeStorage(testStorageKey, { tests: saved.tests ?? {} }) &&
      testStatusMessage
    ) {
      testStatusMessage.textContent = "이전 버전의 개인정보 기록을 지우지 못했습니다. 브라우저의 사이트 데이터를 직접 삭제하세요.";
    }

    for (const row of rows) {
      const result = saved.tests?.[row.dataset.testId] ?? {};
      const status = row.querySelector("[data-test-status]");
      const note = row.querySelector("[data-test-note]");
      if (status) status.value = result.status ?? "";
      if (note) note.value = result.note ?? "";
    }

    const serializeTests = () => {
      const tests = {};
      for (const row of rows) {
        tests[row.dataset.testId] = {
          status: row.querySelector("[data-test-status]")?.value ?? "",
          note: row.querySelector("[data-test-note]")?.value.trim() ?? "",
        };
      }

      return {
        identity: {
          studentId: studentId?.value.trim() ?? "",
          studentName: studentName?.value.trim() ?? "",
        },
        tests,
      };
    };

    const serializeStoredTests = () => {
      const { tests } = serializeTests();
      return { tests };
    };

    const isRequiredTestComplete = (row) => {
      const status = row.querySelector("[data-test-status]")?.value ?? "";
      const note = row.querySelector("[data-test-note]")?.value.trim() ?? "";
      return status === "pass" && note.length > 0;
    };

    const renderTestProgress = () => {
      const requiredRows = rows.filter((row) => row.dataset.required === "true");
      const passed = requiredRows.filter(
        (row) => row.querySelector("[data-test-status]")?.value === "pass",
      ).length;
      const recorded = requiredRows.filter(
        (row) => (row.querySelector("[data-test-note]")?.value.trim() ?? "").length > 0,
      ).length;

      for (const row of rows) {
        const result = row.querySelector("[data-test-status]")?.value ?? "";
        if (result) row.dataset.result = result;
        else delete row.dataset.result;
      }

      testProgressLabel.textContent = `${passed} / ${requiredRows.length} PASS · ${recorded} / ${requiredRows.length} 기록`;
      testProgress.dataset.complete = String(requiredRows.every(isRequiredTestComplete));
    };

    const saveTests = () => {
      const stored = writeStorage(testStorageKey, serializeStoredTests());
      renderTestProgress();
      if (!stored && testStatusMessage) {
        testStatusMessage.textContent = "브라우저에 기록을 저장할 수 없습니다. 작업을 잃지 않도록 지금 CSV를 저장하세요.";
      }
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
      const data = serializeTests();
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
      csvRows.push(["학번", data.identity.studentId].map(csvCell).join(","));
      csvRows.push(["이름", data.identity.studentName].map(csvCell).join(","));
      csvRows.push(["수업", "Game Engine I / Week 09 / AI Art Direction and Candidate Selection"].map(csvCell).join(","));

      const filePart = (value) =>
        value
          .normalize("NFC")
          .replace(/[^\p{L}\p{N}_-]+/gu, "_")
          .replace(/^_+|_+$/g, "");
      const identityParts = [
        filePart(data.identity.studentId),
        filePart(data.identity.studentName),
      ].filter(Boolean);
      const filename = identityParts.length
        ? `week09_${identityParts.join("_")}_test.csv`
        : "week09_학번_이름_test.csv";

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

    createResetConfirmation({
      button: resetTests,
      status: testStatusMessage,
      prompt: "이 브라우저의 테스트 판정과 관찰 기록을 모두 지우려면",
      onConfirm: () => {
        if (studentId) studentId.value = "";
        if (studentName) studentName.value = "";
        for (const row of rows) {
          const status = row.querySelector("[data-test-status]");
          const note = row.querySelector("[data-test-note]");
          if (status) status.value = "";
          if (note) note.value = "";
        }
        const cleared = removeStorage(testStorageKey);
        renderTestProgress();
        if (testStatusMessage) {
          testStatusMessage.textContent = cleared
            ? "이 브라우저의 테스트 기록을 초기화했습니다."
            : "화면 기록은 지웠지만 브라우저 저장 기록은 지우지 못했습니다. 사이트 데이터를 직접 삭제하세요.";
        }
        studentId?.focus();
      },
    });

    renderTestProgress();
  }

  const copyStatus = document.querySelector("[data-copy-status]");

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

      if (copyStatus) {
        copyStatus.textContent = copied
          ? "코드를 복사했습니다. 수업에서는 각 줄의 역할을 확인하며 직접 입력하세요."
          : "복사하지 못했습니다. 코드 영역을 직접 선택해 복사하세요.";
      }
    });
  }

  const navigation = document.querySelector("[data-week-nine-toc]");
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
