
var undefined; // for undefined identifier
const isBrowser = () => window !== undefined;

export const localStorageIO = {
  // localStorageへの読み書きをisBrowserが有効な場合のみ実行(gatsby buildのためのworkaround)
  // localStorageの内容は暗号化する（未実装）

  getItem: (name, defaultValue) => {
    if (isBrowser()) {
      return localStorage.getItem(name) || defaultValue;
    }
    return defaultValue;
  },

  setItem: (name, value) => {
    if (isBrowser()) {
      localStorage.setItem(name, value);
    }
  },

  getJson: (name, defaultValue) => {
    if (isBrowser()) {
      const payload = localStorage.getItem(name) || null;
      let data = null;
      if (payload) {
        try {
          data = JSON.parse(payload);
        } catch (e) {
          return null;
        }
        return data;
      }
    }
    return defaultValue;
  },

  setJson: (name, value) => {
    if (isBrowser()) {
      const payload = JSON.stringify(value);
      localStorage.setItem(name, payload);
    }
  },

  clear: () => {
    if (isBrowser()) {
      localStorage.clear();
    }
  },

  removeItem: (name) => {
    if (isBrowser()) {
      localStorage.removeItem(name);
    }
  }

};
