import api from "@/api.js"
import Cookies from 'js-cookie'
import router from '@/router'
import config from '@/appconfig'

const COOKIES_NAME = 'noCloudinApp-token';

export default {
	namespaced: true,
	state: {
		token: '',
		userdata: {},
    billingUser: {},
    currencies: [],
    defaultCurrency: 'USD',
    unloginedCurrency: 'USD',
    baseURL: `${config.WHMCSsiteurl}/modules/addons/nocloud/api/index.php`
	},
	mutations: {
		setToken(state, token) {
			state.token = token
      Cookies.set(COOKIES_NAME, token)
		},
		setUserdata(state, data) {
			state.userdata = data
		},
    setBillingUser(state, data) {
      state.billingUser = data
    },
    setCurrencies(state, rates) {
      state.currencies = rates.map((el) => ({ ...el, id: `${el.from} ${el.to}` }));
    },
    setDefaultCurrency(state, currencies) {
      const currency = currencies.find((el) =>
        el.rate === 1 && [el.from, el.to].includes('NCU')
      );

      if (!currency) return;
      state.defaultCurrency = (currency.from === 'NCU') ? currency.to : currency.from;
    },
    setUnloginedCurrency(state, value) {
      state.unloginedCurrency = value;
    }
	},
	actions: {
		login({ commit }, { login, password, type, uuid }) {
			return new Promise((resolve, reject) => {
				api.authorizeCustom({ auth: { type, data: [login, password] }, uuid })
					.then(response => {
            api.applyToken(response.token);
						commit('setToken', response.token);
						resolve(response);
					})
					.catch(error => {
						reject(error)
					})
			})
		},

		logout({ commit }) {
			commit('setToken', '');
			Cookies.remove(COOKIES_NAME);
      location.reload();
		},

		load({ commit }) {
			const token = Cookies.get(COOKIES_NAME);
			if (token) {
				api.axios.defaults.headers.common['Authorization'] = "Bearer " + token;
				commit('setToken', token);
			}
		},

		fetchUserData({ commit }) {
			return new Promise((resolve, reject) => {
				api.accounts.get('me')
					.then(response => {
						commit('setUserdata', response);
						resolve(response);
					})
					.catch(error => {
						reject(error)
					})
			})
		},
    fetchBillingData({ state, commit }) {
      return new Promise((resolve, reject) => {
        if (state.billingUser.id) {
          resolve(state.billingUser);
          return;
        }
        api.get(state.baseURL, { params: { run: 'client_detail' }})
          .then(response => {
            if (!response.id) response.id = 'none';
            commit('setBillingUser', response);
            resolve(response);
          })
          .catch(error => {
            reject(error);
          });
      })
    },
    fetchCurrencies({ commit }) {
      return new Promise((resolve, reject) => {
        api.get('/billing/currencies/rates')
          .then(response => {
            commit('setCurrencies', response.rates)
            commit('setDefaultCurrency', response.rates)
            resolve(response)
          })
          .catch(error => {
            reject(error)
          })
      })
    },
		addSSH({ commit }, data) {
			console.log(data.id, data.body)
			return new Promise((resolve, reject) => {
				// commit("setLoading", true);
				api.accounts.update(data.id, data.body)
					.then(response => {
						commit('setUserdata', response.pool)
						resolve(response)
					})
					.catch(error => {
						reject(error);
					})
					.finally(() => {
						// commit("setLoading", false);
					})
			})
		}
	},
	getters: {
		isLoggedIn(state) {
			return state.token.length > 0;
		},
		userdata(state) {
			return state.userdata;
		},
    billingData(state) {
      return state.billingUser;
    },
    currencies(state) {
      return state.currencies;
    },
    defaultCurrency(state) {
      return state.defaultCurrency;
    },
    unloginedCurrency(state) {
      return state.unloginedCurrency;
    },
    getURL(state) {
      return state.baseURL;
    }
	}
}
