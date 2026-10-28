/**
 * BookLeaf Author Support Portal - Token Storage
 *
 * Uses `sessionStorage` to isolate user sessions per browser tab.
 * This guarantees that an Admin session in one tab (e.g. /admin) and an Author session
 * in another tab (e.g. /dashboard) do not overwrite or collide with each other's tokens,
 * preventing cross-tab "Access Denied" errors and unwanted portal redirects.
 */

const TOKEN_KEY = 'bl_token';

// In-memory fallback if sessionStorage is unavailable (e.g. strict security policies)
let inMemoryToken = null;

function isStorageAvailable() {
  try {
    const testKey = '__bl_test__';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return true;
  } catch (_) {
    return false;
  }
}

const storageAvailable = typeof window !== 'undefined' && isStorageAvailable();

export const tokenStorage = {
  /**
   * Retrieve the active authentication token for this browser tab context.
   * Also cleans up any legacy shared localStorage token to prevent session leakage.
   */
  get: () => {
    if (!storageAvailable) {
      return inMemoryToken;
    }
    try {
      // Prioritize tab-isolated sessionStorage
      const sessionToken = window.sessionStorage.getItem(TOKEN_KEY);
      if (sessionToken) {
        return sessionToken;
      }
      return null;
    } catch (_) {
      return inMemoryToken;
    }
  },

  /**
   * Save the authentication token exclusively to this tab's sessionStorage.
   * Also cleans up legacy localStorage to prevent cross-tab contamination.
   */
  set: (token) => {
    inMemoryToken = token;
    if (storageAvailable) {
      try {
        window.sessionStorage.setItem(TOKEN_KEY, token);
      } catch (_) {}
    }
    // Explicitly purge legacy shared localStorage token
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } catch (_) {}
  },

  /**
   * Remove the authentication token for this browser tab context.
   */
  remove: () => {
    inMemoryToken = null;
    if (storageAvailable) {
      try {
        window.sessionStorage.removeItem(TOKEN_KEY);
      } catch (_) {}
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
      }
    } catch (_) {}
  },
};
