// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Screens and components reach data only through `src/features` hooks and the
    // `@/services` facade, never the mock implementation, so the backend can be swapped.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/services/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/services/mock', '@/services/mock/*', '**/services/mock/*'],
              message: 'Use src/features hooks or the @/services facade instead of mock internals.',
            },
            {
              group: ['phosphor-react-native'],
              message: 'Import icons from @/components/ui/icons.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/components/ui/icons.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);
