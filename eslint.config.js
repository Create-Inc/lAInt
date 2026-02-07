import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import { createNodeResolver } from 'eslint-plugin-import-x';
import security from 'eslint-plugin-security';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['dist/', 'scripts/', 'node_modules/'],
  },

  // Source files — strict type-checked
  {
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Babel AST types are inherently loose — these fire on every traverse callback
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },

  // Test files — recommended type-checked (less strict)
  {
    files: ['tests/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },

  // Import hygiene (source + test files only)
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    ...importX.flatConfigs.recommended,
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    ...importX.flatConfigs.typescript,
    settings: {
      'import-x/resolver-next': [
        createNodeResolver({ extensions: ['.ts', '.mjs', '.cjs', '.js', '.json', '.node'] }),
      ],
    },
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
        },
      ],
      'import-x/no-duplicates': 'error',
    },
  },

  // Security rules
  security.configs.recommended,
  {
    rules: {
      'security/detect-object-injection': 'off',
    },
  },

  // Prettier — must be last to disable conflicting rules
  prettierConfig,
);
