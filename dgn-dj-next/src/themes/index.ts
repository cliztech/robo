// ═══════════════════════════════════════════════════════════════
//  DGN-DJ — Theme System
// ═══════════════════════════════════════════════════════════════

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
}

export interface ThemeColors {
  // Backgrounds
  bgMaster: string;
  bgPanel: string;
  bgElevated: string;
  bgSubtle: string;
  
  // Borders
  borderDefault: string;
  borderDim: string;
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  
  // Accents (per deck)
  deckA: string;
  deckB: string;
  deckC: string;
  deckD: string;
  
  // Status
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Interactive
  focus: string;
  hover: string;
}

export const THEMES: Record<string, Theme> = {
  default: {
    id: 'default',
    name: 'Default Dark',
    colors: {
      bgMaster: '#09090b',
      bgPanel: '#18181b',
      bgElevated: '#27272a',
      bgSubtle: '#3f3f46',
      borderDefault: '#3f3f46',
      borderDim: '#27272a',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      deckA: '#0091FF',
      deckB: '#FF5500',
      deckC: '#22C55E',
      deckD: '#A855F7',
      success: '#22C55E',
      warning: '#EAB308',
      error: '#EF4444',
      info: '#3B82F6',
      focus: '#6366F1',
      hover: '#52525B',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Blue',
    colors: {
      bgMaster: '#0a0f1a',
      bgPanel: '#111827',
      bgElevated: '#1e293b',
      bgSubtle: '#334155',
      borderDefault: '#1e293b',
      borderDim: '#0f172a',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      deckA: '#06b6d4',
      deckB: '#f97316',
      deckC: '#10b981',
      deckD: '#8b5cf6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0ea5e9',
      focus: '#0ea5e9',
      hover: '#1e293b',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neon Night',
    colors: {
      bgMaster: '#0d0d0d',
      bgPanel: '#1a1a1a',
      bgElevated: '#262626',
      bgSubtle: '#404040',
      borderDefault: '#262626',
      borderDim: '#171717',
      textPrimary: '#ffffff',
      textSecondary: '#a3a3a3',
      textMuted: '#737373',
      deckA: '#00ffff',
      deckB: '#ff00ff',
      deckC: '#00ff00',
      deckD: '#ffff00',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
      info: '#00ffff',
      focus: '#ff00ff',
      hover: '#333333',
    },
  },
  light: {
    id: 'light',
    name: 'Clean Light',
    colors: {
      bgMaster: '#f8fafc',
      bgPanel: '#f1f5f9',
      bgElevated: '#e2e8f0',
      bgSubtle: '#cbd5e1',
      borderDefault: '#e2e8f0',
      borderDim: '#f1f5f9',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      deckA: '#0284c7',
      deckB: '#ea580c',
      deckC: '#16a34a',
      deckD: '#7c3aed',
      success: '#16a34a',
      warning: '#ca8a04',
      error: '#dc2626',
      info: '#0284c7',
      focus: '#6366f1',
      hover: '#e2e8f0',
    },
  },
};

// CSS variables generator
export function generateCSSVariables(theme: ThemeColors): string {
  return `
    --bg-master: ${theme.bgMaster};
    --bg-panel: ${theme.bgPanel};
    --bg-elevated: ${theme.bgElevated};
    --bg-subtle: ${theme.bgSubtle};
    --border-default: ${theme.borderDefault};
    --border-dim: ${theme.borderDim};
    --text-primary: ${theme.textPrimary};
    --text-secondary: ${theme.textSecondary};
    --text-muted: ${theme.textMuted};
    --deck-a: ${theme.deckA};
    --deck-b: ${theme.deckB};
    --deck-c: ${theme.deckC};
    --deck-d: ${theme.deckD};
    --success: ${theme.success};
    --warning: ${theme.warning};
    --error: ${theme.error};
    --info: ${theme.info};
    --focus: ${theme.focus};
    --hover: ${theme.hover};
  `;
}

// Apply theme to document
export function applyTheme(themeId: string) {
  const theme = THEMES[themeId] || THEMES.default;
  const cssVars = generateCSSVariables(theme.colors);
  
  // Create or update style element
  let styleEl = document.getElementById('dgn-dj-theme');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dgn-dj-theme';
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = `:root { ${cssVars} }`;
  
  return theme;
}
