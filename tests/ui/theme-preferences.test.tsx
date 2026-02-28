import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useThemePreferences } from '@/lib/theme/ThemeProvider';
import {
  DEFAULT_THEME_STATE,
  THEME_STORAGE_KEY,
  loadThemeState,
  saveThemeState,
} from '@/lib/theme/themeStore';

const matchMediaStub = (prefersDark: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: prefersDark,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

const ThemeHarness = () => {
  const { themeMode, activeSkinId, setThemeMode, setActiveSkinId, resetThemePreferences } = useThemePreferences();

  return (
    <div>
      <div data-testid="mode">{themeMode}</div>
      <div data-testid="skin">{activeSkinId}</div>
      <button onClick={() => setThemeMode('light')}>Light</button>
      <button onClick={() => setThemeMode('system')}>System</button>
      <button onClick={() => setActiveSkinId('sunset')}>Sunset</button>
      <button onClick={resetThemePreferences}>Reset</button>
    </div>
  );
};

describe('theme preferences', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-skin');
    matchMediaStub(true);
  });

  it('loads and saves persisted preferences with versioned storage', () => {
    saveThemeState(window.localStorage, {
      themeMode: 'dark',
      activeSkinId: 'neon',
    });

    const parsed = JSON.parse(window.localStorage.getItem(THEME_STORAGE_KEY) ?? '{}');
    expect(parsed.version).toBe(1);

    const loaded = loadThemeState(window.localStorage);
    expect(loaded).toEqual({ themeMode: 'dark', activeSkinId: 'neon' });
  });

  it('applies html attributes and supports reset flow', async () => {
    const user = userEvent.setup();

    render(
      <ThemeProvider>
        <ThemeHarness />
      </ThemeProvider>
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-skin', DEFAULT_THEME_STATE.activeSkinId);

    await user.click(screen.getByRole('button', { name: 'Light' }));
    await user.click(screen.getByRole('button', { name: 'Sunset' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(document.documentElement).toHaveAttribute('data-skin', 'sunset');

    await user.click(screen.getByRole('button', { name: 'Reset' }));

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).toHaveAttribute('data-skin', DEFAULT_THEME_STATE.activeSkinId);
    expect(screen.getByTestId('mode')).toHaveTextContent('system');
  });
});
