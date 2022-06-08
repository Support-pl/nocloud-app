import Vue from 'vue'
import config from './appconfig.js'
import VueI18n, { LocaleMessages } from 'vue-i18n'

Vue.use(VueI18n)

function loadLocaleMessages() {
	const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
	const messages = {}
	locales.keys().forEach(key => {
		const matched = key.match(/([A-Za-z0-9-_]+)\./i)
		if (matched && matched.length > 1) {
			const locale = matched[1]
			messages[locale] = locales(key)
		}
	})
	return messages
}

const AppLangs = config.languages;
const SystemLangs = navigator.languages;

const lang = AppLangs.find(el => ~SystemLangs.map(el => el.replace(/-[a-z]{2}/i, '')).indexOf(el));

export default new VueI18n({
	// locale: process.env.VUE_APP_I18N_LOCALE || 'en',
	locale: lang,
	fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
	messages: loadLocaleMessages(),
	pluralizationRules: {
		'ru': function (choice, choicesLength) {
			// this === VueI18n instance, so the locale property also exists here
			if (choice === 0) {
				return 0;
			}
			const teen = choice > 10 && choice < 20;
			const endsWithOne = choice % 10 === 1;
			if (choicesLength < 4) {
				return (!teen && endsWithOne) ? 1 : 2;
			}
			if (!teen && endsWithOne) {
				return 1;
			}
			if (!teen && choice % 10 >= 2 && choice % 10 <= 4) {
				return 2;
			}
			return (choicesLength < 4) ? 2 : 3;
		}
	}
})
