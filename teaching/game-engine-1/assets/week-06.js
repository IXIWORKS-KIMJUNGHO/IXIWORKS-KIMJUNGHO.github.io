(() => {
  document.documentElement.classList.add("game-engine-week-six-root");

  const storageApi = globalThis.GameEngineWeek6Storage ?? {
    getBrowserStorage: () => null,
    readJsonStorage: (_storage, _key, fallback) => ({
      state: "unavailable",
      value: fallback,
    }),
    writeJsonStorage: () => false,
    removeStorage: () => false,
    reportStorageResult: (status, saved, successMessage, errorMessage) => {
      if (!status) return;
      status.dataset.state = saved ? "saved" : "error";
      status.textContent = saved ? successMessage : errorMessage;
    },
  };
  const browserStorage = storageApi.getBrowserStorage();

  const reportReadFailure = (result, status) => {
    if (result.state === "unavailable") {
      storageApi.reportStorageResult(
        status,
        false,
        "",
        "브라우저 저장 기능을 사용할 수 없습니다. 현재 화면에서는 계속 작업할 수 있지만 새로고침하면 기록이 사라집니다.",
      );
    } else if (result.state === "error") {
      storageApi.reportStorageResult(
        status,
        false,
        "",
        "저장된 기록을 읽지 못했습니다. 현재 입력은 사용할 수 있지만 새로고침 전에 CSV를 저장하세요.",
      );
    }
  };

  const buildChecklist = document.querySelector("[data-build-checklist]");
  const buildProgressLabel = document.querySelector("[data-build-progress-label]");
  const buildReset = document.querySelector("[data-build-reset]");
  const buildStorageStatus = document.querySelector("[data-build-storage-status]");
  const buildStorageKey = "game-engine-1-week-06-build-v1";

  if (buildChecklist && buildProgressLabel) {
    const checks = Array.from(buildChecklist.querySelectorAll("[data-check-id]"));
    const savedBuildResult = storageApi.readJsonStorage(
      browserStorage,
      buildStorageKey,
      [],
    );
    reportReadFailure(savedBuildResult, buildStorageStatus);
    const savedChecks = new Set(
      Array.isArray(savedBuildResult.value) ? savedBuildResult.value : [],
    );

    const renderBuildProgress = () => {
      const completed = checks.filter((check) => check.checked).length;
      buildProgressLabel.textContent = `${completed} / ${checks.length} 완료`;
      buildChecklist.dataset.complete = String(completed === checks.length);

      for (const check of checks) {
        check.closest("li")?.setAttribute("data-checked", String(check.checked));
      }
    };

    const saveBuildProgress = () => {
      const saved = storageApi.writeJsonStorage(
        browserStorage,
        buildStorageKey,
        checks
          .filter((check) => check.checked)
          .map((check) => check.dataset.checkId),
      );
      storageApi.reportStorageResult(
        buildStorageStatus,
        saved,
        "체크 결과를 이 브라우저에 저장했습니다.",
        "체크 결과를 저장하지 못했습니다. 현재 화면에서는 계속 확인할 수 있습니다.",
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
      for (const check of checks) check.checked = false;
      const removed = storageApi.removeStorage(browserStorage, buildStorageKey);
      storageApi.reportStorageResult(
        buildStorageStatus,
        removed,
        "저장된 체크 결과를 초기화했습니다.",
        "저장된 체크 결과를 지우지 못했습니다. 체크 표시는 현재 화면에서만 초기화했습니다.",
      );
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
  const testStorageKey = "game-engine-1-week-06-tests-v1";

  if (testTable && testProgress && testProgressLabel) {
    const rows = Array.from(testTable.querySelectorAll("[data-test-id]"));
    const savedTestResult = storageApi.readJsonStorage(browserStorage, testStorageKey, {
      identity: {},
      tests: {},
    });
    reportReadFailure(savedTestResult, testStatusMessage);
    const saved = savedTestResult.value;

    if (studentId) studentId.value = saved.identity?.studentId ?? "";
    if (studentName) studentName.value = saved.identity?.studentName ?? "";

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
      const previouslyFailed = testStatusMessage?.dataset.state === "error";
      const stored = storageApi.writeJsonStorage(
        browserStorage,
        testStorageKey,
        serializeTests(),
      );

      if (!stored || previouslyFailed) {
        storageApi.reportStorageResult(
          testStatusMessage,
          stored,
          "브라우저 저장 기능이 다시 작동합니다. 입력한 테스트 결과를 저장했습니다.",
          "테스트 결과를 브라우저에 저장하지 못했습니다. 새로고침 전에 CSV를 저장하세요.",
        );
      } else if (testStatusMessage) {
        testStatusMessage.dataset.state = "saved";
      }
      renderTestProgress();
    };

    for (const control of testTable.querySelectorAll("select, input")) {
      control.addEventListener("change", saveTests);
      control.addEventListener("input", saveTests);
    }

    studentId?.addEventListener("input", saveTests);
    studentName?.addEventListener("input", saveTests);

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
      csvRows.push(["수업", "Game Engine I / Week 06 / Animation and Camera"].map(csvCell).join(","));

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
        ? `week06_${identityParts.join("_")}_test.csv`
        : "week06_학번_이름_test.csv";

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
        testStatusMessage.dataset.state = "exported";
        testStatusMessage.textContent = `${filename} 파일을 저장했습니다.`;
      }
    });

    resetTests?.addEventListener("click", () => {
      if (studentId) studentId.value = "";
      if (studentName) studentName.value = "";
      for (const row of rows) {
        const status = row.querySelector("[data-test-status]");
        const note = row.querySelector("[data-test-note]");
        if (status) status.value = "";
        if (note) note.value = "";
      }
      const removed = storageApi.removeStorage(browserStorage, testStorageKey);
      renderTestProgress();
      storageApi.reportStorageResult(
        testStatusMessage,
        removed,
        "이 브라우저의 테스트 기록을 초기화했습니다.",
        "화면의 입력은 지웠지만 브라우저에 저장된 기록은 지우지 못했습니다.",
      );
      studentId?.focus();
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

  const navigation = document.querySelector("[data-week-six-toc]");
  if (!navigation) return;

  const tocDisclosure = navigation.querySelector("[data-week-six-toc-disclosure]");
  const compactNavigationQuery = matchMedia("(max-width: 980px)");
  const setTocDisclosureOpen = (open) => {
    if (!tocDisclosure) return;
    tocDisclosure.open = open;
    if (tocDisclosure.dataset.detailsMotion === "ready") {
      tocDisclosure.dataset.detailsState = open ? "open" : "closed";
    }
  };
  const syncTocDisclosure = (compact = compactNavigationQuery.matches) => {
    setTocDisclosureOpen(!compact);
  };

  syncTocDisclosure();
  compactNavigationQuery.addEventListener?.("change", (event) => {
    syncTocDisclosure(event.matches);
  });

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
        if (reveal && compactNavigationQuery.matches && tocDisclosure?.open) {
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
    entry.link.addEventListener("click", () => {
      setCurrent(entry.id, true);
      if (compactNavigationQuery.matches && tocDisclosure) {
        setTocDisclosureOpen(false);
      }
    });
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
