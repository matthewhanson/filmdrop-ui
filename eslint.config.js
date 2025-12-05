const { defineConfig, globalIgnores } = require('eslint/config')

const globals = require('globals')
const react = require('eslint-plugin-react')
const js = require('@eslint/js')

const { FlatCompat } = require('@eslint/eslintrc')

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

module.exports = defineConfig([
  {
    settings: {
      react: {
        version: 'detect'
      }
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {}
    },

    extends: compat.extends(
      'plugin:react/recommended',
      'plugin:jsx-a11y/recommended',
      'prettier'
    ),

    plugins: {
      react
    },

    rules: {}
  },
  {
    files: ['**/src/?(*.)+test.[jt]s?(x)'],
    extends: compat.extends('plugin:testing-library/react')
  },
  globalIgnores(['**/node_modules/**/*', '**/build/**/*'])
])
