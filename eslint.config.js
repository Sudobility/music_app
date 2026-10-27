import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';

const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  console: 'readonly',
  fetch: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  indexedDB: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  Blob: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  AudioContext: 'readonly',
  performance: 'readonly',
  HTMLElement: 'readonly',
  SVGElement: 'readonly',
  Event: 'readonly',
  CustomEvent: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  structuredClone: 'readonly',
  crypto: 'readonly',
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: browserGlobals,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/unsupported-syntax': 'off',
      'react-hooks/config': 'off',
      'react-hooks/gating': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'preserve-caught-error': 'off',
      'no-useless-assignment': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  eslintConfigPrettier,
);
