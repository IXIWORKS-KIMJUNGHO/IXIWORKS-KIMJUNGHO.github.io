(() => {
  document.documentElement.classList.add("game-engine-week-thirteen-root");

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

  const resetConfirmationWindow = 5_000;
  const createResetConfirmation = ({ button, statusNode, onConfirm }) => {
    if (!button) return;

    let confirmationDeadline = 0;
    let confirmationTimer;

    const clearConfirmation = () => {
      confirmationDeadline = 0;
      delete button.dataset.confirming;
      clearTimeout(confirmationTimer);
    };

    const cancelConfirmation = () => {
      clearConfirmation();
      if (statusNode) statusNode.textContent = "시간이 지나 초기화를 취소했습니다.";
    };

    button.addEventListener("click", () => {
      if (Date.now() <= confirmationDeadline) {
        clearConfirmation();
        onConfirm();
        return;
      }

      confirmationDeadline = Date.now() + resetConfirmationWindow;
      button.dataset.confirming = "true";
      if (statusNode) {
        statusNode.textContent = "5초 안에 한 번 더 누르면 이 브라우저 기록을 초기화합니다.";
      }
      confirmationTimer = setTimeout(cancelConfirmation, resetConfirmationWindow);
    });
  };

  const buildChecklist = document.querySelector("[data-build-checklist]");
  const buildProgressLabel = document.querySelector("[data-build-progress-label]");
  const buildReset = document.querySelector("[data-build-reset]");
  const buildStatus = document.querySelector("[data-build-status]");

  if (buildChecklist && buildProgressLabel) {
    const buildStorageKey =
      buildChecklist.dataset.storageKey ?? "game-engine-1-week-13-build-v1";
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
      const saved = writeStorage(
        buildStorageKey,
        checks
          .filter((check) => check.checked)
          .map((check) => check.dataset.checkId),
      );
      if (!saved && buildStatus) {
        buildStatus.textContent =
          "체크는 반영했지만 브라우저 저장소에 기록하지 못했습니다.";
      }
    };

    for (const check of checks) {
      check.checked = savedChecks.has(check.dataset.checkId);
      check.addEventListener("change", () => {
        saveBuildProgress();
        renderBuildProgress();
      });
    }

    createResetConfirmation({
      button: buildReset,
      statusNode: buildStatus,
      onConfirm: () => {
        for (const check of checks) check.checked = false;
        const removed = removeStorage(buildStorageKey);
        renderBuildProgress();
        if (buildStatus) {
          buildStatus.textContent = removed
            ? "이 브라우저의 제출 체크를 초기화했습니다."
            : "체크는 지웠지만 브라우저 저장 기록을 삭제하지 못했습니다.";
        }
        checks[0]?.focus();
      },
    });

    renderBuildProgress();
  }

  const testTable = document.querySelector("[data-test-table]");
  const observationLog = document.querySelector("[data-observation-log]");
  const issueRecord = document.querySelector("[data-issue-record]");
  const studentId = document.querySelector("[data-student-id]");
  const studentName = document.querySelector("[data-student-name]");
  const testProgress = document.querySelector("[data-test-progress]");
  const testProgressLabel = document.querySelector("[data-test-progress-label]");
  const evidenceProgressLabel = document.querySelector("[data-evidence-progress-label]");
  const exportTests = document.querySelector("[data-export-tests]");
  const resetTests = document.querySelector("[data-reset-tests]");
  const testStatusMessage = document.querySelector("[data-test-status-message]");

  if (testTable && observationLog && issueRecord && testProgress && testProgressLabel) {
    const testStorageKey =
      testTable.dataset.storageKey ?? "game-engine-1-week-13-tests-v1";
    const observationStorageKey =
      observationLog.dataset.storageKey ?? "game-engine-1-week-13-observations-v1";
    const issueStorageKey =
      issueRecord.dataset.storageKey ?? "game-engine-1-week-13-issue-v1";
    const testRows = Array.from(testTable.querySelectorAll("[data-test-id]"));
    const observationRows = Array.from(
      observationLog.querySelectorAll("[data-observation-id]"),
    );
    const issueControls = Array.from(issueRecord.querySelectorAll("[data-issue-field]"));
    const savedTests = readStorage(testStorageKey, { tests: {} });
    const savedObservations = readStorage(observationStorageKey, {});
    const savedIssue = readStorage(issueStorageKey, {});

    if (
      savedTests &&
      typeof savedTests === "object" &&
      Object.hasOwn(savedTests, "identity")
    ) {
      const migrated = writeStorage(testStorageKey, { tests: savedTests.tests ?? {} });
      if (!migrated && testStatusMessage) {
        testStatusMessage.textContent =
          "이전 개인정보는 사용하지 않았지만 브라우저 저장소에서 정리하지 못했습니다.";
      }
    }

    for (const row of testRows) {
      const result = savedTests.tests?.[row.dataset.testId] ?? {};
      const status = row.querySelector("[data-test-status]");
      const note = row.querySelector("[data-test-note]");
      if (status) status.value = result.status ?? "";
      if (note) note.value = result.note ?? "";
    }

    for (const row of observationRows) {
      const savedRow = savedObservations[row.dataset.observationId] ?? {};
      for (const control of row.querySelectorAll("[data-observation-field]")) {
        control.value = savedRow[control.dataset.observationField] ?? "";
      }
    }

    for (const control of issueControls) {
      control.value = savedIssue[control.dataset.issueField] ?? "";
    }

    const serializeIdentity = () => ({
      studentId: studentId?.value.trim() ?? "",
      studentName: studentName?.value.trim() ?? "",
    });

    const serializeTests = () => {
      const tests = {};
      for (const row of testRows) {
        tests[row.dataset.testId] = {
          status: row.querySelector("[data-test-status]")?.value ?? "",
          note: row.querySelector("[data-test-note]")?.value.trim() ?? "",
        };
      }
      return { tests };
    };

    const serializeObservations = () => {
      const observations = {};
      for (const row of observationRows) {
        const fields = {};
        for (const control of row.querySelectorAll("[data-observation-field]")) {
          fields[control.dataset.observationField] = control.value.trim();
        }
        observations[row.dataset.observationId] = fields;
      }
      return observations;
    };

    const serializeIssue = () => {
      const issue = {};
      for (const control of issueControls) {
        issue[control.dataset.issueField] = control.value.trim();
      }
      return issue;
    };

    const renderTestProgress = () => {
      const requiredRows = testRows.filter((row) => row.dataset.required === "true");
      const passed = requiredRows.filter(
        (row) => row.querySelector("[data-test-status]")?.value === "pass",
      ).length;
      const recorded = requiredRows.filter(
        (row) => (row.querySelector("[data-test-note]")?.value.trim() ?? "").length > 0,
      ).length;
      const completedTests = requiredRows.filter((row) => {
        const status = row.querySelector("[data-test-status]")?.value ?? "";
        const note = row.querySelector("[data-test-note]")?.value.trim() ?? "";
        return status === "pass" && note.length > 0;
      }).length;
      const completedObservations = observationRows.filter((row) =>
        Array.from(row.querySelectorAll("[data-observation-field]")).every(
          (control) => control.value.trim().length > 0,
        ),
      ).length;
      const completedIssueFields = issueControls.filter(
        (control) => control.value.trim().length > 0,
      ).length;
      const testsComplete = completedTests === requiredRows.length;
      const observationsComplete = completedObservations === observationRows.length;
      const issueComplete = completedIssueFields === issueControls.length;

      for (const row of testRows) {
        const result = row.querySelector("[data-test-status]")?.value ?? "";
        if (result) row.dataset.result = result;
        else delete row.dataset.result;
      }

      testProgressLabel.textContent =
        `${passed} / ${requiredRows.length} PASS · ${recorded} / ${requiredRows.length} 기록`;
      if (evidenceProgressLabel) {
        evidenceProgressLabel.textContent =
          `관찰 ${completedObservations} / ${observationRows.length} · 결정 ${completedIssueFields} / ${issueControls.length}`;
      }
      testProgress.dataset.complete = String(
        testsComplete && observationsComplete && issueComplete,
      );
    };

    const createEvidenceSaver = ({ storageKey, serialize, failureMessage }) => () => {
      const saved = writeStorage(storageKey, serialize());
      renderTestProgress();
      if (!saved && testStatusMessage) {
        testStatusMessage.textContent = failureMessage;
      }
    };

    const saveTests = createEvidenceSaver({
      storageKey: testStorageKey,
      serialize: serializeTests,
      failureMessage:
        "입력은 유지했지만 브라우저 저장소에 기록하지 못했습니다. 지금 CSV를 저장해 주세요.",
    });
    const saveObservations = createEvidenceSaver({
      storageKey: observationStorageKey,
      serialize: serializeObservations,
      failureMessage:
        "관찰은 유지했지만 브라우저 저장소에 기록하지 못했습니다. 지금 CSV를 저장해 주세요.",
    });
    const saveIssue = createEvidenceSaver({
      storageKey: issueStorageKey,
      serialize: serializeIssue,
      failureMessage:
        "결정은 유지했지만 브라우저 저장소에 기록하지 못했습니다. 지금 CSV를 저장해 주세요.",
    });

    const bindAutosave = (controls, save) => {
      for (const control of controls) {
        control.addEventListener("change", save);
        control.addEventListener("input", save);
      }
    };

    bindAutosave(testTable.querySelectorAll("select, input"), saveTests);
    bindAutosave(observationLog.querySelectorAll("select, input"), saveObservations);
    bindAutosave(issueControls, saveIssue);

    const spreadsheetSafe = (value) => {
      const raw = String(value ?? "");
      return /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
    };

    const csvCell = (value) =>
      `"${spreadsheetSafe(value).replaceAll('"', '""')}"`;

    exportTests?.addEventListener("click", () => {
      const identity = serializeIdentity();
      const observations = serializeObservations();
      const issue = serializeIssue();
      const tests = serializeTests().tests;
      const csvRows = [];

      csvRows.push(["Game Engine I", "Week 13 / Alpha Playtest"].map(csvCell).join(","));
      csvRows.push(["학번", identity.studentId].map(csvCell).join(","));
      csvRows.push(["이름", identity.studentName].map(csvCell).join(","));
      csvRows.push("");
      csvRows.push(
        ["테스터", "완료 결과", "완료·중단 시간", "첫 망설임", "막힌 지점·도움", "목표 해석·피드백 응답"]
          .map(csvCell)
          .join(","),
      );

      for (const tester of ["A", "B", "C"]) {
        const row = observations[tester] ?? {};
        const resultLabels = { complete: "완료", blocked: "막힘", crash: "오류 종료" };
        csvRows.push(
          [
            tester,
            resultLabels[row.result] ?? row.result ?? "",
            row.time,
            row.hesitation,
            row.stuck,
            row.answer,
          ]
            .map(csvCell)
            .join(","),
        );
      }

      csvRows.push("");
      csvRows.push(["문제 선택 항목", "기록"].map(csvCell).join(","));
      const issueLabels = {
        question: "학습 질문",
        evidence: "선택한 관찰",
        impact: "영향·우선순위",
        frequency: "관찰 빈도",
        fix: "최소 수정",
        scope: "예상 변경 범위",
        retest: "재검사 기준",
        regression: "회귀 범위",
      };
      for (const field of Object.keys(issueLabels)) {
        csvRows.push([issueLabels[field], issue[field] ?? ""].map(csvCell).join(","));
      }

      csvRows.push("");
      csvRows.push(
        ["ID", "필수", "조작·조건", "기대 결과", "판정", "관찰·수정 기록"]
          .map(csvCell)
          .join(","),
      );
      for (const row of testRows) {
        const cells = row.querySelectorAll("th, td");
        const status = tests[row.dataset.testId]?.status ?? "";
        csvRows.push(
          [
            cells[0]?.textContent.trim() ?? "",
            "필수",
            cells[1]?.textContent.trim() ?? "",
            cells[2]?.textContent.trim() ?? "",
            status ? status.toUpperCase() : "미실행",
            tests[row.dataset.testId]?.note ?? "",
          ]
            .map(csvCell)
            .join(","),
        );
      }

      const filePart = (value) =>
        value
          .normalize("NFC")
          .replace(/[^\p{L}\p{N}_-]+/gu, "_")
          .replace(/^_+|_+$/g, "");
      const identityParts = [filePart(identity.studentId), filePart(identity.studentName)].filter(
        Boolean,
      );
      const filename = identityParts.length
        ? `week13_${identityParts.join("_")}_playtest.csv`
        : "week13_학번_이름_playtest.csv";
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
      statusNode: testStatusMessage,
      onConfirm: () => {
        if (studentId) studentId.value = "";
        if (studentName) studentName.value = "";

        for (const row of testRows) {
          const status = row.querySelector("[data-test-status]");
          const note = row.querySelector("[data-test-note]");
          if (status) status.value = "";
          if (note) note.value = "";
        }

        for (const control of observationLog.querySelectorAll("select, input")) {
          control.value = "";
        }
        for (const control of issueControls) control.value = "";

        const removed = [
          removeStorage(testStorageKey),
          removeStorage(observationStorageKey),
          removeStorage(issueStorageKey),
        ].every(Boolean);
        renderTestProgress();
        if (testStatusMessage) {
          testStatusMessage.textContent = removed
            ? "이 브라우저의 플레이테스트 기록을 초기화했습니다."
            : "입력은 지웠지만 브라우저 저장 기록 일부를 삭제하지 못했습니다.";
        }
        studentId?.focus();
      },
    });

    renderTestProgress();
  }

  const navigation = document.querySelector("[data-week-thirteen-toc]");
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
