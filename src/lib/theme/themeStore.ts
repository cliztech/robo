export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeState {
    themeMode: ThemeMode;
    activeSkinId: string;
}

interface PersistedThemePayload {
    version: number;
    state: ThemeState;
}

export const THEME_STORAGE_VERSION = 1;
export const THEME_STORAGE_KEY_BASE = 'dgn-dj:theme';
export const THEME_STORAGE_KEY = `${THEME_STORAGE_KEY_BASE}:v${THEME_STORAGE_VERSION}`;
const LEGACY_THEME_KEYS = [THEME_STORAGE_KEY_BASE, 'dgn-dj-theme'];

export const DEFAULT_THEME_STATE: ThemeState = {
    themeMode: 'system',
    activeSkinId: 'aether',
};

export const THEME_SKINS = [
    { id: 'aether', label: 'Aether' },
    { id: 'neon', label: 'Neon' },
    { id: 'sunset', label: 'Sunset' },
] as const;

const THEME_MODES: ThemeMode[] = ['dark', 'light', 'system'];

const isThemeMode = (value: unknown): value is ThemeMode =>
    typeof value === 'string' && THEME_MODES.includes(value as ThemeMode);

const normalizeSkin = (value: unknown): string => {
    if (typeof value !== 'string') {
        return DEFAULT_THEME_STATE.activeSkinId;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : DEFAULT_THEME_STATE.activeSkinId;
};

const normalizeThemeState = (value: unknown): ThemeState => {
    if (!value || typeof value !== 'object') {
        return DEFAULT_THEME_STATE;
    }

    const candidate = value as Partial<ThemeState>;

    return {
        themeMode: isThemeMode(candidate.themeMode) ? candidate.themeMode : DEFAULT_THEME_STATE.themeMode,
        activeSkinId: normalizeSkin(candidate.activeSkinId),
    };
};

export const resolveTheme = (mode: ThemeMode, prefersDark: boolean): 'dark' | 'light' => {
    if (mode === 'system') {
        return prefersDark ? 'dark' : 'light';
    }

    return mode;
};

export const loadThemeState = (storage: Storage | null): ThemeState => {
    if (!storage) {
        return DEFAULT_THEME_STATE;
    }

    const serialized = storage.getItem(THEME_STORAGE_KEY);
    if (serialized) {
        try {
            const parsed = JSON.parse(serialized) as PersistedThemePayload;
            if (parsed.version === THEME_STORAGE_VERSION) {
                return normalizeThemeState(parsed.state);
            }
        } catch {
            return DEFAULT_THEME_STATE;
        }
    }

    for (const legacyKey of LEGACY_THEME_KEYS) {
        const legacyValue = storage.getItem(legacyKey);
        if (!legacyValue) {
            continue;
        }

        try {
            return normalizeThemeState(JSON.parse(legacyValue));
        } catch {
            return DEFAULT_THEME_STATE;
        }
    }

    return DEFAULT_THEME_STATE;
};

export const saveThemeState = (storage: Storage | null, state: ThemeState): void => {
    if (!storage) {
        return;
    }

    const payload: PersistedThemePayload = {
        version: THEME_STORAGE_VERSION,
        state,
    };

    storage.setItem(THEME_STORAGE_KEY, JSON.stringify(payload));
};

export const getThemeBootstrapScript = (): string => `
(function () {
  var storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  var defaults = ${JSON.stringify(DEFAULT_THEME_STATE)};

  var mode = defaults.themeMode;
  var skin = defaults.activeSkinId;

  try {
    var raw = window.localStorage.getItem(storageKey);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.state) {
        var state = parsed.state;
        if (state.themeMode === 'dark' || state.themeMode === 'light' || state.themeMode === 'system') {
          mode = state.themeMode;
        }
        if (typeof state.activeSkinId === 'string' && state.activeSkinId.trim().length > 0) {
          skin = state.activeSkinId;
        }
      }
    }
  } catch (error) {
    void error;
  }

  var prefersDark = false;
  try {
    prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    void error;
  }

  var activeTheme = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
  var root = document.documentElement;
  root.setAttribute('data-theme', activeTheme);
  root.setAttribute('data-skin', skin);
})();
`;
