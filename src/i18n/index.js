import { createI18n } from 'vue-i18n'
import config from '@/appconfig.js'

function loadLocaleMessages () {
  const locales = import.meta.globEager('./locales/*.json')
  const messages = {}

  Object.values(locales).forEach((lang) => {
    const prefix = Object.keys(lang).find((key) => key !== 'default')

    messages[prefix] = lang[prefix]
  })
  return messages
}

const AppLangs = config.languages
const SystemLangs = navigator.languages

const lang = AppLangs.find(el => ~SystemLangs.map(el => el.replace(/-[a-z]{2}/i, '')).indexOf(el))

export default createI18n({
  // locale: import.meta.env.VUE_APP_I18N_LOCALE ?? 'en',
  locale: lang,
  allowComposition: true,
  fallbackLocale: import.meta.env.VUE_APP_I18N_FALLBACK_LOCALE ?? 'en',
  messages: loadLocaleMessages(),
  pluralizationRules: {
    ru: function (choice, choicesLength) {
      // this === VueI18n instance, so the locale property also exists here
      if (choice === 0) {
        return 0
      }
      const teen = choice > 10 && choice < 20
      const endsWithOne = choice % 10 === 1
      if (choicesLength < 4) {
        return (!teen && endsWithOne) ? 1 : 2
      }
      if (!teen && endsWithOne) {
        return 1
      }
      if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
        return 2
      }
      return (choicesLength < 4) ? 2 : 3
    }
  }
})
