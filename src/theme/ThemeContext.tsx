import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const THEME_STORAGE_KEY = 'matricare_theme_pref';
export const THEME_TIMESTAMP_KEY = 'matricare_theme_updated_at';

const VALID_THEMES: Theme[] = ['light', 'dark', 'system'];

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme;
    if (stored && VALID_THEMES.includes(stored)) {
      return stored;
    }
  } catch {
    // LocalStorage unavailable
  }
  return 'light'; // Light mode must be the default for new users
}

function resolveEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme;
}

function applyThemeToDOM(effective: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (effective === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveEffectiveTheme(theme));

  // Sync theme changes to DOM and listen to OS system changes if in 'system' mode
  useEffect(() => {
    const effective = resolveEffectiveTheme(theme);
    setResolvedTheme(effective);
    applyThemeToDOM(effective);

    if (theme === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const sysEffective = e.matches ? 'dark' : 'light';
        setResolvedTheme(sysEffective);
        applyThemeToDOM(sysEffective);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    if (!VALID_THEMES.includes(newTheme)) return;
    setThemeState(newTheme);

    const effective = resolveEffectiveTheme(newTheme);
    setResolvedTheme(effective);
    applyThemeToDOM(effective);

    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem(THEME_TIMESTAMP_KEY, Date.now().toString());
    } catch {
      // LocalStorage write error fallback
    }

    // Also update saved user account if available in localStorage
    try {
      const rawUser = localStorage.getItem('matricare_auth_user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        parsed.theme = newTheme;
        localStorage.setItem('matricare_auth_user', JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
