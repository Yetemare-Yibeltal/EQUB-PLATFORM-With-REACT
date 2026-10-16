const PREFIX = "equb.";

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(`${PREFIX}${key}`);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key) {
    try {
      window.localStorage.removeItem(`${PREFIX}${key}`);
      return true;
    } catch {
      return false;
    }
  },
};
