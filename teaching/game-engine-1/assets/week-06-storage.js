(() => {
  const getBrowserStorage = (scope = globalThis) => {
    try {
      return scope.localStorage ?? null;
    } catch {
      return null;
    }
  };

  const readJsonStorage = (storage, key, fallback) => {
    if (!storage) return { state: "unavailable", value: fallback };

    try {
      const stored = storage.getItem(key);
      if (stored === null) return { state: "empty", value: fallback };
      return { state: "loaded", value: JSON.parse(stored) ?? fallback };
    } catch {
      return { state: "error", value: fallback };
    }
  };

  const writeJsonStorage = (storage, key, value) => {
    if (!storage) return false;

    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  const removeStorage = (storage, key) => {
    if (!storage) return false;

    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  };

  const reportStorageResult = (status, saved, successMessage, errorMessage) => {
    if (!status) return;
    status.dataset.state = saved ? "saved" : "error";
    status.textContent = saved ? successMessage : errorMessage;
  };

  globalThis.GameEngineWeek6Storage = Object.freeze({
    getBrowserStorage,
    readJsonStorage,
    writeJsonStorage,
    removeStorage,
    reportStorageResult,
  });
})();
