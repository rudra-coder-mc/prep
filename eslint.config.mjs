import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import next from 'eslint-config-next'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      'apps/web/drizzle/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/coverage/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...next,
  prettier,
  {
    // The Next app is one workspace member rather than the repository, so the
    // config that looks for its routes has to be told where it lives.
    settings: { next: { rootDir: 'apps/web' } },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // The packages are shared with the phone, so nothing in them may reach into
    // the web app. See
    // docs/decisions/0035-the-repository-is-a-workspace-and-the-logic-is-shared-once.md.
    files: ['packages/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/*', '**/apps/*'],
              message: 'A shared package cannot import from an app.',
            },
          ],
        },
      ],
    },
  },
)
