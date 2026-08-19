(() => {
  document.documentElement.classList.add("game-engine-week-four-root");
  const undoWindowMs = 8_000;

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

  const readSessionStorage = (key, fallback) => {
    try {
      const parsed = JSON.parse(sessionStorage.getItem(key) ?? "null");
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  };

  const writeSessionStorage = (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Student identity remains usable when session storage is blocked.
    }
  };

  const removeSessionStorage = (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // No additional recovery is required when session storage is blocked.
    }
  };

  const buildChecklist = document.querySelector("[data-build-checklist]");
  const buildProgressLabel = document.querySelector("[data-build-progress-label]");
  const buildReset = document.querySelector("[data-build-reset]");
  const buildUndo = document.querySelector("[data-build-undo]");
  const buildStatusMessage = document.querySelector("[data-build-status-message]");
  const buildStorageKey = "game-engine-1-week-04-build-v1";

  if (buildChecklist && buildProgressLabel) {
    const checks = Array.from(buildChecklist.querySelectorAll("[data-check-id]"));
    const savedChecks = new Set(readSessionStorage(buildStorageKey, []));
    let buildUndoTimer = 0;
    let buildUndoSnapshot = null;

    const renderBuildProgress = () => {
      const completed = checks.filter((check) => check.checked).length;
      buildProgressLabel.textContent = `${completed} / ${checks.length} 완료`;
      buildChecklist.dataset.complete = String(completed === checks.length);

      for (const check of checks) {
        check.closest("li")?.setAttribute("data-checked", String(check.checked));
      }
    };

    const saveBuildProgress = () => {
      writeSessionStorage(
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

    const closeBuildUndo = () => {
      window.clearTimeout(buildUndoTimer);
      buildUndoTimer = 0;
      buildUndoSnapshot = null;
      if (buildUndo) buildUndo.hidden = true;
    };

    const offerBuildUndo = (snapshot) => {
      window.clearTimeout(buildUndoTimer);
      buildUndoSnapshot = snapshot;
      if (buildUndo) {
        buildUndo.hidden = false;
        buildUndo.focus();
      }
      if (buildStatusMessage) {
        buildStatusMessage.textContent = "체크를 초기화했습니다. 8초 동안 되돌릴 수 있습니다.";
      }
      buildUndoTimer = window.setTimeout(() => {
        closeBuildUndo();
        if (buildStatusMessage) buildStatusMessage.textContent = "체크 초기화를 완료했습니다.";
      }, undoWindowMs);
    };

    buildReset?.addEventListener("click", () => {
      const snapshot = checks
        .filter((check) => check.checked)
        .map((check) => check.dataset.checkId);

      if (snapshot.length === 0) {
        if (buildStatusMessage) buildStatusMessage.textContent = "초기화할 체크가 없습니다.";
        return;
      }

      for (const check of checks) check.checked = false;
      removeSessionStorage(buildStorageKey);
      renderBuildProgress();
      offerBuildUndo(snapshot);
    });

    buildUndo?.addEventListener("click", () => {
      if (!buildUndoSnapshot) return;
      const restoredChecks = new Set(buildUndoSnapshot);
      for (const check of checks) check.checked = restoredChecks.has(check.dataset.checkId);
      saveBuildProgress();
      renderBuildProgress();
      closeBuildUndo();
      if (buildStatusMessage) buildStatusMessage.textContent = "체크 상태를 복구했습니다.";
      buildReset?.focus();
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
  const resetIdentity = document.querySelector("[data-reset-identity]");
  const undoTests = document.querySelector("[data-undo-tests]");
  const undoIdentity = document.querySelector("[data-undo-identity]");
  const testStatusMessage = document.querySelector("[data-test-status-message]");
  const testStorageKey = "game-engine-1-week-04-tests-v1";
  const identityStorageKey = "game-engine-1-week-04-identity-v1";

  if (testTable && testProgress && testProgressLabel) {
    const rows = Array.from(testTable.querySelectorAll("[data-test-id]"));
    const saved = readStorage(testStorageKey, { identity: {}, tests: {} });
    const savedIdentity = readSessionStorage(identityStorageKey, saved.identity ?? {});
    let testUndoTimer = 0;
    let testUndoSnapshot = null;
    let identityUndoTimer = 0;
    let identityUndoSnapshot = null;

    if (studentId) studentId.value = savedIdentity.studentId ?? "";
    if (studentName) studentName.value = savedIdentity.studentName ?? "";

    if (saved.identity) {
      writeSessionStorage(identityStorageKey, savedIdentity);
      writeStorage(testStorageKey, { tests: saved.tests ?? {} });
    }

    const applyTestResults = (tests) => {
      for (const row of rows) {
        const result = tests?.[row.dataset.testId] ?? {};
        const status = row.querySelector("[data-test-status]");
        const note = row.querySelector("[data-test-note]");
        if (status) status.value = result.status ?? "";
        if (note) note.value = result.note ?? "";
      }
    };

    applyTestResults(saved.tests);

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
      const data = serializeTests();
      writeStorage(testStorageKey, { tests: data.tests });
      writeSessionStorage(identityStorageKey, data.identity);
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
      csvRows.push(["수업", "Game Engine I / Week 04 / Input and Physics"].map(csvCell).join(","));

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
        ? `week04_${identityParts.join("_")}_test.csv`
        : "week04_학번_이름_test.csv";

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

    const closeTestUndo = () => {
      window.clearTimeout(testUndoTimer);
      testUndoTimer = 0;
      testUndoSnapshot = null;
      if (undoTests) undoTests.hidden = true;
    };

    const offerTestUndo = (snapshot, message) => {
      window.clearTimeout(testUndoTimer);
      testUndoSnapshot = snapshot;
      if (undoTests) {
        undoTests.hidden = false;
        undoTests.focus();
      }
      if (testStatusMessage) testStatusMessage.textContent = message;
      testUndoTimer = window.setTimeout(() => {
        closeTestUndo();
        if (testStatusMessage) testStatusMessage.textContent = "테스트 기록 초기화를 완료했습니다.";
      }, undoWindowMs);
    };

    const closeIdentityUndo = () => {
      window.clearTimeout(identityUndoTimer);
      identityUndoTimer = 0;
      identityUndoSnapshot = null;
      if (undoIdentity) undoIdentity.hidden = true;
    };

    const offerIdentityUndo = (snapshot) => {
      window.clearTimeout(identityUndoTimer);
      identityUndoSnapshot = snapshot;
      if (undoIdentity) {
        undoIdentity.hidden = false;
        undoIdentity.focus();
      }
      if (testStatusMessage) {
        testStatusMessage.textContent = "학생 정보를 지웠습니다. 8초 동안 되돌릴 수 있습니다.";
      }
      identityUndoTimer = window.setTimeout(() => {
        closeIdentityUndo();
        if (testStatusMessage) testStatusMessage.textContent = "학생 정보 삭제를 완료했습니다.";
      }, undoWindowMs);
    };

    resetTests?.addEventListener("click", () => {
      const data = serializeTests();
      const hasRecordedResult = Object.values(data.tests).some(
        (result) => result.status || result.note,
      );

      if (!hasRecordedResult) {
        if (testStatusMessage) testStatusMessage.textContent = "초기화할 테스트 기록이 없습니다.";
        return;
      }

      applyTestResults({});
      writeStorage(testStorageKey, { tests: {} });
      renderTestProgress();
      offerTestUndo(data.tests, "테스트 기록을 초기화했습니다. 8초 동안 되돌릴 수 있습니다.");
    });

    resetIdentity?.addEventListener("click", () => {
      const identity = serializeTests().identity;
      if (!identity.studentId && !identity.studentName) {
        if (testStatusMessage) testStatusMessage.textContent = "지울 학생 정보가 없습니다.";
        return;
      }

      if (studentId) studentId.value = "";
      if (studentName) studentName.value = "";
      removeSessionStorage(identityStorageKey);
      offerIdentityUndo(identity);
    });

    undoTests?.addEventListener("click", () => {
      if (!testUndoSnapshot) return;

      applyTestResults(testUndoSnapshot);
      writeStorage(testStorageKey, { tests: testUndoSnapshot });
      renderTestProgress();

      closeTestUndo();
      if (testStatusMessage) testStatusMessage.textContent = "테스트 기록을 복구했습니다.";
      resetTests?.focus();
    });

    undoIdentity?.addEventListener("click", () => {
      if (!identityUndoSnapshot) return;

      if (studentId) studentId.value = identityUndoSnapshot.studentId ?? "";
      if (studentName) studentName.value = identityUndoSnapshot.studentName ?? "";
      writeSessionStorage(identityStorageKey, identityUndoSnapshot);

      closeIdentityUndo();
      if (testStatusMessage) testStatusMessage.textContent = "학생 정보를 복구했습니다.";
      resetIdentity?.focus();
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
    let copied = false;
    try {
      if (typeof document.execCommand === "function") {
        copied = document.execCommand("copy");
      }
    } catch {
      copied = false;
    }
    textarea.remove();
    return copied;
  };

  for (const button of document.querySelectorAll("[data-copy-code]")) {
    const defaultLabel = button.textContent;
    let copyFeedbackTimer = 0;

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

      window.clearTimeout(copyFeedbackTimer);
      button.textContent = copied ? "복사됨" : "복사 실패";
      button.dataset.copyState = copied ? "success" : "error";
      copyFeedbackTimer = window.setTimeout(() => {
        button.textContent = defaultLabel;
        delete button.dataset.copyState;
      }, 1_600);
    });
  }

  const navigation = document.querySelector("[data-week-four-toc]");
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
  const revealNavigationEntry = (link) => {
    const navigationBounds = navigation.getBoundingClientRect();
    const linkBounds = link.getBoundingClientRect();
    const isFullyVisible =
      linkBounds.left >= navigationBounds.left && linkBounds.right <= navigationBounds.right;

    if (isFullyVisible) return;

    const left =
      navigation.scrollLeft +
      linkBounds.left -
      navigationBounds.left -
      (navigation.clientWidth - linkBounds.width) / 2;

    navigation.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  };

  const setCurrent = (id, reveal = false) => {
    if (id === currentId) return;
    currentId = id;

    for (const entry of entries) {
      if (entry.id === id) {
        entry.link.setAttribute("aria-current", "location");
        if (reveal && matchMedia("(max-width: 980px)").matches) {
          revealNavigationEntry(entry.link);
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
