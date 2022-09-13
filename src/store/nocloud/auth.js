import api from "@/api.js"
import Cookies from 'js-cookie'
import router from '@/router'

const COOKIES_NAME = 'noCloudinApp-token';

export default {
	namespaced: true,
	state: {
		token: '',
		userdata: {},
    billingUser: {},
    baseURL: 'https://whmcs.demo.support.pl/modules/addons/nocloud/api/index.php'
	},
	mutations: {
		setToken(state, token) {
			state.token = token
		},
		setUserdata(state, data) {
			state.userdata = data
		},
    setBillingUser(state, data) {
      state.billingUser = data
    },
		setAddSSH(state, data) {
			state.userdata = data
		}
	},
	actions: {
		login({ commit }, { login, password }) {
			return new Promise((resolve, reject) => {
				api.auth(login, password)
					.then(response => {
						Cookies.set(COOKIES_NAME, response.token)
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
			router.push({ name: "Login" });
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
        api.get(state.baseURL, { params: { run: 'client_detail' }})
          .then(response => {
            commit('setBillingUser', response);
            resolve(response);
          })
          .catch(error => {
            reject(error);
          });
      })
    },
		addSSH({ commit }, data) {
			console.log(data.id, data.body)
			return new Promise((resolve, reject) => {
				// commit("setLoading", true);
				api.accounts.update(data.id, data.body)
					.then(response => {
						commit('setAddSSH', response.pool)
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
    getURL(state) {
      return state.baseURL;
    }
	}
}
