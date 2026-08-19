(() => {
  document.documentElement.classList.add("game-engine-week-seven-root");

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
      // Identity fields still work when session storage is blocked.
    }
  };

  const removeSessionStorage = (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // The visible fields can still be cleared when storage is blocked.
    }
  };

  const armReset = (
    button,
    { status, confirmMessage, cancelMessage, completeMessage, onConfirm },
  ) => {
    if (!button) return;

    const defaultLabel = button.textContent;
    let resetTimer = 0;
    const disarm = () => {
      window.clearTimeout(resetTimer);
      delete button.dataset.confirming;
      button.textContent = defaultLabel;
    };
    const cancelReset = () => {
      disarm();
      if (status) status.textContent = cancelMessage;
    };

    button.addEventListener("click", () => {
      if (button.dataset.confirming !== "true") {
        button.dataset.confirming = "true";
        button.textContent = button.dataset.confirmLabel ?? "한 번 더 눌러 초기화";
        if (status) status.textContent = confirmMessage;
        resetTimer = window.setTimeout(cancelReset, 5000);
        return;
      }

      disarm();
      onConfirm();
      if (status) status.textContent = completeMessage;
    });
  };

  const buildChecklist = document.querySelector("[data-build-checklist]");
  const buildProgressLabel = document.querySelector("[data-build-progress-label]");
  const buildReset = document.querySelector("[data-build-reset]");
  const buildStatusMessage = document.querySelector("[data-build-status-message]");
  const buildStorageKey = "game-engine-1-week-07-build-v1";

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

    armReset(buildReset, {
      status: buildStatusMessage,
      confirmMessage: "체크 8개를 모두 지우려면 버튼을 한 번 더 누르세요.",
      cancelMessage: "초기화 요청을 취소했습니다. 현재 체크는 그대로 남아 있습니다.",
      completeMessage: "이 브라우저의 제출 체크를 초기화했습니다.",
      onConfirm: () => {
        for (const check of checks) check.checked = false;
        removeStorage(buildStorageKey);
        renderBuildProgress();
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
  const testStorageKey = "game-engine-1-week-07-tests-v1";
  const testIdentityKey = "game-engine-1-week-07-identity-v1";

  if (testTable && testProgress && testProgressLabel) {
    const rows = Array.from(testTable.querySelectorAll("[data-test-id]"));
    const savedRecord = readStorage(testStorageKey, {});
    const savedTests = savedRecord.tests ?? savedRecord;
    const savedIdentity = readSessionStorage(testIdentityKey, {});

    if (savedRecord.identity) writeStorage(testStorageKey, savedTests);

    if (studentId) studentId.value = savedIdentity.studentId ?? "";
    if (studentName) studentName.value = savedIdentity.studentName ?? "";

    for (const row of rows) {
      const result = savedTests[row.dataset.testId] ?? {};
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

      return tests;
    };

    const serializeIdentity = () => ({
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
      writeStorage(testStorageKey, serializeTests());
      renderTestProgress();
    };

    const saveIdentity = () => {
      writeSessionStorage(testIdentityKey, serializeIdentity());
    };

    for (const control of testTable.querySelectorAll("select, input")) {
      control.addEventListener("change", saveTests);
      control.addEventListener("input", saveTests);
    }

    studentId?.addEventListener("input", saveIdentity);
    studentName?.addEventListener("input", saveIdentity);

    const spreadsheetSafe = (value) => {
      const text = String(value ?? "");
      return /^[=+\-@\t\r\n]/.test(text) ? `'${text}` : text;
    };

    const csvCell = (value) => `"${spreadsheetSafe(value).replaceAll('"', '""')}"`;

    exportTests?.addEventListener("click", () => {
      const identity = serializeIdentity();
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
      csvRows.push(["수업", "Game Engine I / Week 07 / UI, Audio and Game State"].map(csvCell).join(","));

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
        ? `week07_${identityParts.join("_")}_test.csv`
        : "week07_학번_이름_test.csv";

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

    armReset(resetTests, {
      status: testStatusMessage,
      confirmMessage: "학번, 이름과 테스트 기록을 모두 지우려면 버튼을 한 번 더 누르세요.",
      cancelMessage: "초기화 요청을 취소했습니다. 현재 테스트 기록은 그대로 남아 있습니다.",
      completeMessage: "이 탭의 학생 정보와 이 브라우저의 테스트 기록을 초기화했습니다.",
      onConfirm: () => {
        if (studentId) studentId.value = "";
        if (studentName) studentName.value = "";
        for (const row of rows) {
          const status = row.querySelector("[data-test-status]");
          const note = row.querySelector("[data-test-note]");
          if (status) status.value = "";
          if (note) note.value = "";
        }
        removeStorage(testStorageKey);
        removeSessionStorage(testIdentityKey);
        renderTestProgress();
        studentId?.focus();
      },
    });

    renderTestProgress();
  }

  const stateLab = document.querySelector("[data-state-lab]");

  if (stateLab) {
    const stateScreen = stateLab.querySelector("[data-state-screen]");
    const stateValue = stateLab.querySelector("[data-state-value]");
    const stateReadoutValue = stateLab.querySelector("[data-state-readout-value]");
    const scoreValue = stateLab.querySelector("[data-score-value]");
    const timeValue = stateLab.querySelector("[data-time-value]");
    const stateMessage = stateLab.querySelector("[data-state-message]");
    const stateLog = stateLab.querySelector("[data-state-log]");
    const buttons = Array.from(stateLab.querySelectorAll("[data-state-action]"));
    const labels = {
      ready: { name: "Ready", message: "시작 화면을 보여 주고 게임 시간은 멈춰 있습니다." },
      playing: { name: "Playing", message: "입력, 수집, 타이머가 작동합니다." },
      won: { name: "Won", message: "성공 화면을 보여 주고 더 이상 점수를 받지 않습니다." },
      lost: { name: "Lost", message: "실패 화면을 보여 주고 타이머와 플레이를 멈춥니다." },
    };
    const model = { state: "ready", score: 0, time: 30 };

    const setLog = (message) => {
      if (stateLog) stateLog.textContent = message;
    };

    const renderState = () => {
      const current = labels[model.state];
      if (stateScreen) stateScreen.dataset.state = model.state;
      if (stateValue) stateValue.textContent = current.name;
      if (stateReadoutValue) stateReadoutValue.textContent = current.name;
      if (scoreValue) scoreValue.textContent = `${model.score} / 3`;
      if (timeValue) timeValue.textContent = `${model.time.toFixed(1)}초`;
      if (stateMessage) stateMessage.textContent = current.message;

      for (const button of buttons) {
        const action = button.dataset.stateAction;
        button.disabled =
          (action === "start" && model.state !== "ready") ||
          ((action === "collect" || action === "timeout") && model.state !== "playing") ||
          (action === "restart" && !["won", "lost"].includes(model.state));
      }
    };

    for (const button of buttons) {
      button.addEventListener("click", () => {
        const action = button.dataset.stateAction;

        if (action === "start" && model.state === "ready") {
          model.state = "playing";
          model.score = 0;
          model.time = 30;
          setLog("StartRound: 상태를 Playing으로 바꾸고 HUD를 초기화했습니다.");
        } else if (action === "collect" && model.state === "playing") {
          model.score = Math.min(3, model.score + 1);
          if (model.score === 3) {
            model.state = "won";
            setLog("AddScore: 목표 점수에 도달해 Won으로 한 번만 전환했습니다.");
          } else {
            setLog("AddScore: 점수, HUD와 수집 효과음을 같은 사건에서 갱신했습니다.");
          }
        } else if (action === "timeout" && model.state === "playing") {
          model.time = 0;
          model.state = "lost";
          setLog("Timer: 남은 시간이 0이 되어 Lost로 전환했습니다.");
        } else if (action === "restart" && ["won", "lost"].includes(model.state)) {
          model.state = "ready";
          model.score = 0;
          model.time = 30;
          setLog("RestartScene: 처음 상태와 값으로 돌아왔습니다.");
        }

        renderState();
      });
    }

    renderState();
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
      const copyStatus = button
        .closest(".code-panel")
        ?.querySelector("[data-copy-status]");
      const code = document.getElementById(button.dataset.copyCode)?.textContent ?? "";
      let copied = false;

      try {
        await navigator.clipboard.writeText(code);
        copied = true;
      } catch {
        copied = fallbackCopy(code);
      }

      if (copyStatus) {
        copyStatus.dataset.kind = copied ? "success" : "error";
        copyStatus.textContent = copied
          ? "코드를 복사했습니다. 수업에서는 각 줄의 역할을 확인하며 직접 입력하세요."
          : "복사하지 못했습니다. 코드 영역을 직접 선택해 복사하세요.";
      }
    });
  }

  const navigation = document.querySelector("[data-week-seven-toc]");
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
