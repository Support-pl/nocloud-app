// @ts-check

import path from 'node:path'
import url from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'
import eslint from '@eslint/js'
import vue from 'eslint-plugin-vue'

export default [
  eslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...new FlatCompat({
    baseDirectory: path.dirname(url.fileURLToPath(import.meta.url))
  }).extends('eslint-config-standard'),

  {
    plugins: { vue },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        VUE_APP_BASE_URL: 'readonly',
        VUE_APP_GA_ID: 'readonly',
        VUE_APP_S3_BUCKET: 'readonly'
      }
    },
    rules: {
      camelcase: [1, { ignoreDestructuring: true, ignoreImports: true, properties: 'never' }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unsafe-optional-chaining': 'off',
      'vue/valid-v-slot': 'off',
      'vue/no-v-html': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/no-deprecated-filter': 'warn'
    }
  }
]
