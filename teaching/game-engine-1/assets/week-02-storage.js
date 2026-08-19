(() => {
  const getBrowserStorage = (scope = globalThis) => {
    try {
      return scope.localStorage ?? null;
    } catch {
      return null;
    }
  };

  const readJsonStorage = (storage, key, fallback) => {
    if (!storage) return fallback;

    try {
      const stored = storage.getItem(key);
      return stored === null ? fallback : (JSON.parse(stored) ?? fallback);
    } catch {
      return fallback;
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

  const reportStorageResult = (
    status,
    saved,
    successMessage,
    errorMessage,
  ) => {
    if (!status) return;
    status.dataset.state = saved ? "saved" : "error";
    status.textContent = saved ? successMessage : errorMessage;
  };

  const persistJsonWithStatus = ({
    storage,
    key,
    value,
    status,
    successMessage,
    errorMessage,
  }) => {
    const saved = writeJsonStorage(storage, key, value);
    reportStorageResult(status, saved, successMessage, errorMessage);
    return saved;
  };

  globalThis.GameEngineWeek2Storage = Object.freeze({
    getBrowserStorage,
    persistJsonWithStatus,
    readJsonStorage,
  });
})();
