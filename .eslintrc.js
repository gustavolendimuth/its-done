/* eslint-env node */
module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'out/',
    'coverage/',
    'logs/',
    '*.log',
    'cypress/videos/',
    'cypress/screenshots/',
    'prisma/migrations/',
    'apps/backend/uploads/',
  ],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
      ],
    },
    {
      files: ['apps/backend/**/*'],
      env: {
        node: true,
        jest: true,
      },
    },
    {
      files: ['apps/frontend/**/*'],
      env: {
        browser: true,
        es2020: true,
      },
      extends: ['next/core-web-vitals'],
    },
  ],
};
