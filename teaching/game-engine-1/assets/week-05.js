(() => {
  document.documentElement.classList.add("game-engine-week-five-root");

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
      // Controls remain usable when storage is unavailable.
    }
  };

  const removeStorage = (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // No recovery is required when storage is unavailable.
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
      // Controls remain usable when storage is unavailable.
    }
  };

  const removeSessionStorage = (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // No recovery is required when storage is unavailable.
    }
  };

  const setupGuardedReset = ({
    button,
    defaultLabel,
    statusTarget,
    onConfirm,
  }) => {
    if (!button) return;

    let confirmationTimer;
    const clearConfirmation = ({ clearStatus = true } = {}) => {
      window.clearTimeout(confirmationTimer);
      delete button.dataset.confirm;
      button.textContent = defaultLabel;
      if (clearStatus && statusTarget) statusTarget.textContent = "";
    };

    button.addEventListener("click", () => {
      if (button.dataset.confirm !== "true") {
        window.clearTimeout(confirmationTimer);
        button.dataset.confirm = "true";
        button.textContent = "한 번 더 눌러 초기화";
        if (statusTarget) {
          statusTarget.textContent =
            "기록은 아직 유지됩니다. 초기화하려면 같은 버튼을 한 번 더 누르세요.";
        }
        confirmationTimer = window.setTimeout(clearConfirmation, 4000);
        return;
      }

      clearConfirmation({ clearStatus: false });
      onConfirm();
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || button.dataset.confirm !== "true") return;
      clearConfirmation();
      if (statusTarget) statusTarget.textContent = "초기화를 취소했습니다.";
    });

    button.addEventListener("blur", () => {
      if (button.dataset.confirm === "true") clearConfirmation();
    });
  };

  const setupToc = () => {
    const navigation = document.querySelector("[data-week-five-toc]");
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
          if (reveal && matchMedia("(max-width: 1040px)").matches) {
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
    const fallbackCopy = (value) => {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.append(field);
      field.select();
      const copied = document.execCommand("copy");
      field.remove();
      return copied;
    };

    for (const button of document.querySelectorAll("[data-copy-code]")) {
      const code = button.closest(".code-card")?.querySelector("pre code");
      if (!code) continue;

      button.addEventListener("click", async () => {
        let copied = false;
        try {
          await navigator.clipboard.writeText(code.textContent.trim());
          copied = true;
        } catch {
          copied = fallbackCopy(code.textContent.trim());
        }

        button.dataset.copied = String(copied);
        button.textContent = copied ? "복사 완료" : "직접 선택";
        window.setTimeout(() => {
          button.dataset.copied = "false";
          button.textContent = "교수자 시연용 복사";
        }, 1800);
      });
    }
  };

  const setupChecklist = () => {
    const checklist = document.querySelector("[data-build-checklist]");
    if (!checklist) return;

    const checks = Array.from(checklist.querySelectorAll("[data-check-id]"));
    const progress = document.querySelector("[data-build-progress-label]");
    const reset = document.querySelector("[data-build-reset]");
    const statusMessage = document.querySelector("[data-build-status-message]");
    const storageKey = checklist.dataset.storageKey || "game-engine-1-week-05-build-v1";
    const saved = new Set(readStorage(storageKey, []));

    const render = () => {
      const completed = checks.filter((check) => check.checked).length;
      if (progress) progress.textContent = completed + " / " + checks.length + " 완료";
      checklist.dataset.complete = String(completed === checks.length);

      for (const check of checks) {
        check.closest("li")?.setAttribute("data-checked", String(check.checked));
      }
    };

    const save = () => {
      writeStorage(
        storageKey,
        checks
          .filter((check) => check.checked)
          .map((check) => check.dataset.checkId),
      );
    };

    for (const check of checks) {
      check.checked = saved.has(check.dataset.checkId);
      check.addEventListener("change", () => {
        render();
        save();
      });
    }

    setupGuardedReset({
      button: reset,
      defaultLabel: "체크 초기화",
      statusTarget: statusMessage,
      onConfirm: () => {
        for (const check of checks) check.checked = false;
        removeStorage(storageKey);
        render();
        if (statusMessage) statusMessage.textContent = "체크 항목을 초기화했습니다.";
        checks[0]?.focus();
      },
    });

    render();
  };

  const setupTestTable = () => {
    const table = document.querySelector("[data-test-table]");
    if (!table) return;

    const rows = Array.from(table.querySelectorAll("[data-test-id]"));
    const studentId = document.querySelector("[data-student-id]");
    const studentName = document.querySelector("[data-student-name]");
    const progress = document.querySelector("[data-test-progress]");
    const exportButton = document.querySelector("[data-export-tests]");
    const resetButton = document.querySelector("[data-reset-tests]");
    const statusMessage = document.querySelector("[data-test-status-message]");
    const storageKey = table.dataset.storageKey || "game-engine-1-week-05-tests-v1";
    const identityStorageKey = storageKey + "-identity";
    const saved = readStorage(storageKey, { tests: {} });
    const savedIdentity = readSessionStorage(identityStorageKey, {});

    if (saved && typeof saved === "object" && "identity" in saved) {
      writeStorage(storageKey, { tests: saved.tests ?? {} });
    }

    if (studentId) studentId.value = savedIdentity.studentId ?? "";
    if (studentName) studentName.value = savedIdentity.studentName ?? "";

    for (const row of rows) {
      const result = saved.tests?.[row.dataset.testId] ?? {};
      const status = row.querySelector("[data-test-status]");
      const note = row.querySelector("[data-test-note]");
      if (status) status.value = result.status ?? "";
      if (note) note.value = result.note ?? "";
    }

    const serialize = () => {
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

    const render = () => {
      const requiredRows = rows.filter((row) => row.dataset.required === "true");
      const passed = requiredRows.filter(
        (row) => row.querySelector("[data-test-status]")?.value === "pass",
      ).length;

      for (const row of rows) {
        const result = row.querySelector("[data-test-status]")?.value ?? "";
        if (result) row.dataset.result = result;
        else delete row.dataset.result;
      }

      if (progress) {
        progress.textContent = passed + " / " + requiredRows.length + " PASS";
        progress.dataset.complete = String(passed === requiredRows.length);
      }
    };

    const save = () => {
      const data = serialize();
      writeStorage(storageKey, { tests: data.tests });
      writeSessionStorage(identityStorageKey, data.identity);
      render();
    };

    for (const control of table.querySelectorAll("select, input")) {
      control.addEventListener("change", save);
      control.addEventListener("input", save);
    }

    studentId?.addEventListener("input", save);
    studentName?.addEventListener("input", save);

    const spreadsheetSafe = (value) => {
      const text = String(value ?? "");
      return /^[=+\-@]/.test(text) ? "'" + text : text;
    };

    const csvCell = (value) =>
      '"' + spreadsheetSafe(value).replaceAll('"', '""') + '"';

    exportButton?.addEventListener("click", () => {
      const data = serialize();
      const header = ["ID", "필수", "조작과 조건", "기대 결과", "판정", "관찰과 수정 기록"];
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
      csvRows.push(["수업", "Game Engine I / Week 05 / Interaction and Level"].map(csvCell).join(","));

      const filePart = (value) =>
        value
          .normalize("NFC")
          .replace(/[^\p{L}\p{N}_-]+/gu, "_")
          .replace(/^_+|_+$/g, "");
      const identity = [
        filePart(data.identity.studentId),
        filePart(data.identity.studentName),
      ].filter(Boolean);
      const filename = identity.length
        ? "week05_" + identity.join("_") + "_test.csv"
        : "week05_학번_이름_test.csv";

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

      if (statusMessage) {
        statusMessage.textContent = filename + " 파일을 저장했습니다.";
      }
    });

    setupGuardedReset({
      button: resetButton,
      defaultLabel: "기록 초기화",
      statusTarget: statusMessage,
      onConfirm: () => {
        if (studentId) studentId.value = "";
        if (studentName) studentName.value = "";

        for (const row of rows) {
          const status = row.querySelector("[data-test-status]");
          const note = row.querySelector("[data-test-note]");
          if (status) status.value = "";
          if (note) note.value = "";
        }

        removeStorage(storageKey);
        removeSessionStorage(identityStorageKey);
        render();
        if (statusMessage) {
          statusMessage.textContent = "테스트와 현재 탭의 신원 기록을 초기화했습니다.";
        }
        studentId?.focus();
      },
    });

    render();
  };

  setupToc();
  setupQuizzes();
  setupCodeCopy();
  setupChecklist();
  setupTestTable();
})();
