export function loadLocalValue(key, fallbackValue) {
  try {
    if (typeof globalThis.localStorage === "undefined") return fallbackValue;
    const rawValue = globalThis.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallbackValue;
  } catch (error) {
    return fallbackValue;
  }
}

export function saveLocalValue(key, value) {
  try {
    if (typeof globalThis.localStorage === "undefined") return;
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Local persistence should never block calculation.
  }
}
