// const path = require('path')
// const createAliasSetting = require('@vue/eslint-config-standard/createAliasSetting')

/** Разрешенные импорты (с публичными API) */
const ALLOWED_PATH_GROUPS = [
  'pages/**',
  'widgets/**',
  'features/**',
  'entities/**',
  'shared/**'
].map((pattern) => ({
  pattern,
  group: 'internal',
  position: 'after'
}))

/** Для запрета приватных путей */
const DENIED_PATH_GROUPS = [
  // Private imports are prohibited, use public imports instead
  'app/**',
  'pages/*/**',
  'widgets/*/**',
  'features/*/**',
  'entities/*/**',
  'shared/*/*/**',
  // Prefer absolute imports instead of relatives (for root modules)
  '../**/app',
  '../**/pages',
  '../**/widgets',
  '../**/features',
  '../**/entities',
  '../**/shared'
]

module.exports = {
  root: true,
  env: { node: true },
  extends: [
    'plugin:vue/vue3-recommended',
    '@vue/eslint-config-standard',
    'eslint:recommended'
  ],
  parserOptions: { requireConfigFile: false },
  rules: {
    'import/order': [
      2,
      {
        pathGroups: ALLOWED_PATH_GROUPS,
        pathGroupsExcludedImportTypes: ['builtin'],
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']
      }
    ],
    'no-restricted-imports': [2, { patterns: DENIED_PATH_GROUPS }],
    camelcase: [1, { ignoreDestructuring: true, ignoreImports: true, properties: 'never' }],
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unsafe-optional-chaining': 'off',
    // 'import/no-unresolved': 'error',
    'vue/valid-v-slot': 'off',
    'vue/no-v-html': 'off',
    'vue/max-attributes-per-line': 'off',
    'vue/no-deprecated-filter': 'warn'
  // },
  // settings: {
  //   ...createAliasSetting({
  //     '@': `${path.resolve(__dirname, 'src')}`
  //   })
  },
  globals: {
    VUE_APP_BASE_URL: 'readonly',
    VUE_APP_GA_ID: 'readonly',
    VUE_APP_S3_BUCKET: 'readonly'
  }
}
