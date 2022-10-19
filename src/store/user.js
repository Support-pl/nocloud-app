import api from "../api";
import config from "@/appconfig.js";

export default {
	state: {
		user: null,
		logged: false,
		userData: null,

		onlogin: {
			redirect: null,
			action: null,
			info: null
		},

		domain: {
      settings: {
        avaliable: Object.keys(config.services)
      }
    }
	},
	mutations: {
		setUser(state, value){
			state.user = value
			state.logged = true
			setCookie('CloudUser', JSON.stringify(value), {
				'max-age': '2592000'
			})
		},
		setBalance(state, {value, getters}){
			state.user.balance = value
			setCookie('CloudUser', JSON.stringify(getters.getUser), {
				'max-age': '2592000'
			}) // странная штука, вероятно потом надо будет переделать, но пока побудет так 08.10.2020
		},
		setCurrency(state, {value, getters}){
			state.user.currency_code = value
			setCookie('CloudUser', JSON.stringify(getters.getUser), {
				'max-age': '2592000'
			}) // странная штука, вероятно потом надо будет переделать, но пока побудет так 08.10.2020
		},
		logout(state){
			state.user = null
			state.logged = false
			deleteCookie('CloudUser')
		},
		setUserData(state, data){
			state.userData = data
		},
		setOnloginRedirect(state, data){
			state.onlogin.redirect = data;
		},
		setOnloginInfo(state, data){
			state.onlogin.info = data;
		},
		_setOnloginAction(state, data){
			state.onlogin.action = data
		},
		clearOnlogin(state){
			state.onlogin = {
				redirect: null,
				action: null,
				info: null
			}
		},
		setDomain(state, data){
			state.domain = data
		}
	},
	actions: {
		onLoadUser(ctx, value){
			ctx.commit("setUser", value)
		},
		setCookie(ctx, object) {
			setCookie(object.name, object.value, object.options)
		},
		deleteCookie(ctx, name) {
			deleteCookie(name)
		},
		updateBalance(ctx, value){
			const getters = ctx.getters;
			ctx.commit("setBalance", {value, getters})
		},
		updateCurrency(ctx, value){
			const getters = ctx.getters;
			ctx.commit("setCurrency", {value, getters})
		},
		setOnloginAction({commit}, data){
			commit('_setOnloginAction', () => {
				data();
				commit('clearOnlogin');
			})
		},
		fetchDomainInfo({commit}){
			api.getWithParams("domain.test")
			.then(res => {
				commit('setDomain', res)
			})
		}
	},
	getters: {
		getUserBalance(state){
			return state.user.balance
		},
		getUser(state){
			return state.user
		},
		isLogged(state){
			return state.logged
		},
		getCookie: state => name => {
			return getCookie(name);
		},
		getUserData(state){
			return state.userData;
		},
		getOnloginRedirect(state){
			return state.onlogin.redirect;
		},
		getOnloginAction(state){
			return state.onlogin.action;
		},
		getOnloginInfo(state){
			return state.onlogin.info;
		},
		getOnlogin(state){
			return state.onlogin;
		},
		getDomainInfo(state){
			return state.domain?.settings ?? {}
		}
	}
}

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}
function setCookie(name, value, options = {}) {
	options = {
		path: '/',
		...options
	};

	if (options.expires instanceof Date) {
		options.expires = options.expires.toUTCString();
	}

	let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

	for (let optionKey in options) {
		updatedCookie += "; " + optionKey;
		let optionValue = options[optionKey];
		if (optionValue !== true) {
			updatedCookie += "=" + optionValue;
		}
	}

	document.cookie = updatedCookie;
}
function deleteCookie(name) {
	setCookie(name, "", {
		'max-age': -1
	})
}