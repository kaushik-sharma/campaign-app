import { StyleSheet } from 'react-native';

import { useTheme, type Theme } from './theme-provider';

type NamedStyles<T> = StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>;

/**
 * Themed StyleSheet factory. Styles are created once per color scheme and cached,
 * so components stay cheap to render.
 */
export function makeStyles<T extends NamedStyles<T>>(factory: (theme: Theme) => T) {
  const cache = new Map<string, T>();
  return function useStyles(): T {
    const theme = useTheme();
    let styles = cache.get(theme.scheme);
    if (!styles) {
      styles = StyleSheet.create(factory(theme));
      cache.set(theme.scheme, styles);
    }
    return styles;
  };
}
