(() => {
  document.documentElement.classList.add("game-engine-week-ten-root");

  const readStorage = (key, fallback) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? "null");
      return { value: parsed ?? fallback, available: true };
    } catch {
      return { value: fallback, available: false };
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

  const announceStorageFailure = (statusMessage) => {
    if (!statusMessage) return;
    statusMessage.dataset.storageError = "true";
    statusMessage.textContent =
      "브라우저 저장을 사용할 수 없습니다. 현재 화면은 계속 사용할 수 있지만 새로 고치면 기록이 사라질 수 있습니다.";
  };

  const announceStorageRecovery = (statusMessage, message) => {
    if (statusMessage?.dataset.storageError !== "true") return;
    delete statusMessage.dataset.storageError;
    statusMessage.textContent = message;
  };

  const attachConfirmingReset = ({ button, statusMessage, onConfirm }) => {
    if (!button) return;

    const defaultLabel = button.textContent.trim();
    let confirmationTimeout = 0;

    const cancelConfirmation = (message = "") => {
      window.clearTimeout(confirmationTimeout);
      confirmationTimeout = 0;
      delete button.dataset.confirming;
      button.textContent = defaultLabel;
      button.removeAttribute("aria-label");
      if (message && statusMessage) statusMessage.textContent = message;
    };

    button.addEventListener("click", () => {
      if (button.dataset.confirming !== "true") {
        button.dataset.confirming = "true";
        button.textContent = "한 번 더 눌러 초기화";
        button.setAttribute("aria-label", "기록을 초기화하려면 한 번 더 누르세요");
        if (statusMessage) {
          statusMessage.textContent = "초기화하려면 5초 안에 버튼을 한 번 더 누르세요.";
        }
        confirmationTimeout = window.setTimeout(
          () => cancelConfirmation("초기화가 취소되었습니다."),
          5000,
        );
        return;
      }

      cancelConfirmation();
      onConfirm();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && button.dataset.confirming === "true") {
        cancelConfirmation("초기화가 취소되었습니다.");
      }
    });
  };

  const buildChecklist = document.querySelector("[data-build-checklist]");
  const buildProgressLabel = document.querySelector("[data-build-progress-label]");
  const buildReset = document.querySelector("[data-build-reset]");
  const buildStatusMessage = document.querySelector("[data-build-status-message]");
  const buildStorageKey = "game-engine-1-week-10-build-v1";

  if (buildChecklist && buildProgressLabel) {
    const checks = Array.from(buildChecklist.querySelectorAll("[data-check-id]"));
    const savedBuild = readStorage(buildStorageKey, []);
    const savedChecks = new Set(Array.isArray(savedBuild.value) ? savedBuild.value : []);

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
      if (!stored) announceStorageFailure(buildStatusMessage);
      else announceStorageRecovery(buildStatusMessage, "브라우저 저장을 다시 사용할 수 있습니다. 체크 결과를 저장했습니다.");
    };

    for (const check of checks) {
      check.checked = savedChecks.has(check.dataset.checkId);
      check.addEventListener("change", () => {
        renderBuildProgress();
        saveBuildProgress();
      });
    }

    attachConfirmingReset({
      button: buildReset,
      statusMessage: buildStatusMessage,
      onConfirm: () => {
        for (const check of checks) check.checked = false;
        const removed = removeStorage(buildStorageKey);
        renderBuildProgress();
        if (removed && buildStatusMessage) {
          delete buildStatusMessage.dataset.storageError;
          buildStatusMessage.textContent = "체크 기록을 초기화했습니다.";
        } else if (!removed) {
          announceStorageFailure(buildStatusMessage);
        }
        checks[0]?.focus();
      },
    });

    renderBuildProgress();
    if (!savedBuild.available) announceStorageFailure(buildStatusMessage);
  }

  const testTable = document.querySelector("[data-test-table]");
  const studentId = document.querySelector("[data-student-id]");
  const studentName = document.querySelector("[data-student-name]");
  const testProgress = document.querySelector("[data-test-progress]");
  const testProgressLabel = document.querySelector("[data-test-progress-label]");
  const exportTests = document.querySelector("[data-export-tests]");
  const resetTests = document.querySelector("[data-reset-tests]");
  const testStatusMessage = document.querySelector("[data-test-status-message]");
  const testStorageKey = "game-engine-1-week-10-tests-v1";

  if (testTable && testProgress && testProgressLabel) {
    const rows = Array.from(testTable.querySelectorAll("[data-test-id]"));
    const savedTests = readStorage(testStorageKey, { identity: {}, tests: {} });
    const saved = savedTests.value;

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
      const stored = writeStorage(testStorageKey, serializeTests());
      if (!stored) announceStorageFailure(testStatusMessage);
      else announceStorageRecovery(testStatusMessage, "브라우저 저장을 다시 사용할 수 있습니다. 테스트 기록을 저장했습니다.");
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
      const header = ["ID", "필수", "조작, 조건", "기대 결과", "판정", "관찰, 수정 기록"];
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
      csvRows.push(["수업", "Game Engine I / Week 10 / Sprite and UI Asset Integration"].map(csvCell).join(","));

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
        ? `week10_${identityParts.join("_")}_test.csv`
        : "week10_학번_이름_test.csv";

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

    attachConfirmingReset({
      button: resetTests,
      statusMessage: testStatusMessage,
      onConfirm: () => {
        if (studentId) studentId.value = "";
        if (studentName) studentName.value = "";
        for (const row of rows) {
          const status = row.querySelector("[data-test-status]");
          const note = row.querySelector("[data-test-note]");
          if (status) status.value = "";
          if (note) note.value = "";
        }
        const removed = removeStorage(testStorageKey);
        renderTestProgress();
        if (removed && testStatusMessage) {
          delete testStatusMessage.dataset.storageError;
          testStatusMessage.textContent = "이 브라우저의 테스트 기록을 초기화했습니다.";
        } else if (!removed) {
          announceStorageFailure(testStatusMessage);
        }
        studentId?.focus();
      },
    });

    renderTestProgress();
    if (!savedTests.available) announceStorageFailure(testStatusMessage);
  }

  const ppuLab = document.querySelector("[data-ppu-lab]");

  if (ppuLab) {
    const pixelInput = ppuLab.querySelector("[data-sprite-pixels]");
    const ppuInput = ppuLab.querySelector("[data-ppu]");
    const worldOutput = ppuLab.querySelector("[data-world-size]");
    const explanation = ppuLab.querySelector("[data-ppu-explanation]");

    const renderPpu = () => {
      const pixels = Number(pixelInput?.value);
      const ppu = Number(ppuInput?.value);

      if (!Number.isFinite(pixels) || !Number.isFinite(ppu) || pixels <= 0 || ppu <= 0) {
        if (worldOutput) worldOutput.textContent = "값 확인";
        if (explanation) explanation.textContent = "두 값에는 0보다 큰 수를 입력합니다.";
        return;
      }

      const units = pixels / ppu;
      const formattedUnits = new Intl.NumberFormat("ko-KR", {
        maximumFractionDigits: 3,
      }).format(units);
      if (worldOutput) worldOutput.textContent = `${formattedUnits} unit`;
      if (explanation) {
        explanation.textContent = `${pixels}px ÷ ${ppu} PPU = ${formattedUnits} Unity unit입니다.`;
      }
    };

    pixelInput?.addEventListener("input", renderPpu);
    ppuInput?.addEventListener("input", renderPpu);
    renderPpu();
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

  const navigation = document.querySelector("[data-week-ten-toc]");
  if (!navigation) return;

  const tocToggle = navigation.querySelector("[data-toc-toggle]");
  const tocCurrent = navigation.querySelector("[data-toc-current]");
  const setTocOpen = (open) => {
    navigation.classList.toggle("is-open", open);
    tocToggle?.setAttribute("aria-expanded", String(open));
    tocToggle?.setAttribute("aria-label", open ? "이 페이지 목차 닫기" : "이 페이지 목차 열기");
  };

  setTocOpen(false);

  tocToggle?.addEventListener("click", () => {
    setTocOpen(tocToggle.getAttribute("aria-expanded") !== "true");
  });

  navigation.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && tocToggle?.getAttribute("aria-expanded") === "true") {
      setTocOpen(false);
      tocToggle.focus();
    }
  });

  const entries = Array.from(navigation.querySelectorAll('a[href^="#"]'))
    .map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      const target = document.getElementById(id);
      const label = link.childNodes[link.childNodes.length - 1]?.textContent.trim() ?? "";
      return target ? { id, label, link, target } : null;
    })
    .filter(Boolean);

  if (entries.length === 0) return;

  let currentId = "";
  const setCurrent = (id) => {
    if (id === currentId) return;
    currentId = id;

    for (const entry of entries) {
      if (entry.id === id) {
        entry.link.setAttribute("aria-current", "location");
        if (tocCurrent) tocCurrent.textContent = entry.label;
      } else {
        entry.link.removeAttribute("aria-current");
      }
    }
  };

  const initialId = location.hash ? decodeURIComponent(location.hash.slice(1)) : entries[0].id;
  setCurrent(entries.some((entry) => entry.id === initialId) ? initialId : entries[0].id);

  for (const entry of entries) {
    entry.link.addEventListener("click", () => {
      setCurrent(entry.id);
      if (matchMedia("(max-width: 980px)").matches) {
        const hadTabindex = entry.target.hasAttribute("tabindex");
        entry.target.setAttribute("tabindex", "-1");
        entry.target.focus({ preventScroll: true });
        if (!hadTabindex) {
          entry.target.addEventListener("blur", () => entry.target.removeAttribute("tabindex"), {
            once: true,
          });
        }
      }
      setTocOpen(false);
    });
  }

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (observedEntries) => {
      const visible = observedEntries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible[0]?.target.id) setCurrent(visible[0].target.id);
    },
    { rootMargin: "-18% 0px -70% 0px", threshold: [0, 1] },
  );

  for (const entry of entries) observer.observe(entry.target);
})();
