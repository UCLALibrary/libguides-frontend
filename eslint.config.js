const js = require('@eslint/js');
const globals = require('globals');
const cypress = require('eslint-plugin-cypress');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dev/fixtures/**',
      'cypress/downloads/**',
      'cypress/e2e/examples/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['dev/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['cypress.config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  {
    ...cypress.configs.recommended,
    files: ['cypress/**/*.js'],
  },
  prettier,
];
