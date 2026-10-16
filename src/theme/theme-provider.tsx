import { createContext, use, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { usePreferences } from '@/stores/preferences';

import { categoryTints, elevation, palette, type ColorTokens, type ElevationLevel } from './tokens';

export type ColorSchemeName = 'light' | 'dark';

export type Theme = {
  scheme: ColorSchemeName;
  colors: ColorTokens;
  /** Shadow for light mode; dark mode expresses depth with surfaces and borders. */
  shadow: (level: ElevationLevel) => string | undefined;
  categoryTint: (category: keyof typeof categoryTints) => string;
};

function buildTheme(scheme: ColorSchemeName): Theme {
  return {
    scheme,
    colors: palette[scheme],
    shadow: (level) => (scheme === 'dark' ? undefined : elevation[level]),
    categoryTint: (category) => categoryTints[category][scheme === 'dark' ? 1 : 0],
  };
}

const themes = { light: buildTheme('light'), dark: buildTheme('dark') } as const;

const ThemeContext = createContext<Theme>(themes.light);

export function useResolvedScheme(): ColorSchemeName {
  const system = useColorScheme();
  const appearance = usePreferences((s) => s.appearance);
  if (appearance !== 'system') return appearance;
  return system === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useResolvedScheme();
  return <ThemeContext value={themes[scheme]}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  return use(ThemeContext);
}
