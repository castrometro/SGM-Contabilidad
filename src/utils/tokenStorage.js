const ACCESS_STORAGE_KEY = "tokenData";
const REFRESH_STORAGE_KEY = "refreshToken";
const REMEMBER_FLAG_KEY = "recordarSesion";
const DEFAULT_ACCESS_TTL_SECONDS = 3600; // 1 hora

const getStorageAreas = () => [sessionStorage, localStorage];

const removeFromAll = (key) => {
  getStorageAreas().forEach((storage) => storage.removeItem(key));
};

const readJson = (storage, key) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    storage.removeItem(key);
    return null;
  }
};

export const clearAuthState = () => {
  removeFromAll(ACCESS_STORAGE_KEY);
  removeFromAll(REFRESH_STORAGE_KEY);
  removeFromAll(REMEMBER_FLAG_KEY);
};

export const persistTokens = ({
  accessToken,
  refreshToken,
  remember = false,
  accessTtlSeconds = DEFAULT_ACCESS_TTL_SECONDS,
}) => {
  const expiresAt = Date.now() + accessTtlSeconds * 1000;
  const storage = remember ? localStorage : sessionStorage;

  clearAuthState();

  storage.setItem(
    ACCESS_STORAGE_KEY,
    JSON.stringify({ token: accessToken, expiresAt })
  );

  if (refreshToken) {
    storage.setItem(REFRESH_STORAGE_KEY, refreshToken);
  }

  if (remember) {
    storage.setItem(REMEMBER_FLAG_KEY, "true");
  }
};

export const getAccessToken = () => {
  for (const storage of getStorageAreas()) {
    const tokenData = readJson(storage, ACCESS_STORAGE_KEY);
    if (!tokenData?.token || !tokenData?.expiresAt) {
      continue;
    }

    if (Date.now() >= tokenData.expiresAt) {
      storage.removeItem(ACCESS_STORAGE_KEY);
      storage.removeItem(REFRESH_STORAGE_KEY);
      continue;
    }

    return tokenData.token;
  }

  return null;
};

export const getRefreshToken = () => {
  for (const storage of getStorageAreas()) {
    const token = storage.getItem(REFRESH_STORAGE_KEY);
    if (token) {
      return token;
    }
  }
  return null;
};

export const shouldRememberSession = () =>
  localStorage.getItem(REMEMBER_FLAG_KEY) === "true";
