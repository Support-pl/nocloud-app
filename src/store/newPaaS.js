import axios from '../axios';
import api from '@/api.js'
export default {
	namespaced: true,

	state: {
		products: [],
		productsLoading: true,
		addons: [],
		addonsLoading: true,
		loadingOS: false,
		dataOS: []
	},
	mutations: {
		setProducts(state, value) {
			state.products = value;
		},
		setProductsLoading(state, value) {
			state.productsLoading = value;
		},
		setAddons(state, value) {
			state.addons = value;
		},
		setAddonsLoading(state, value) {
			state.addonsLoading = value;
		},
		laodingOS(state, value) {
			state.loadingOS = value;
		},
		setOS(state, value) {
			state.dataOS = value;
		},
	},
	actions: {
		fetchProductsSilent({ commit }) {
			const url = `getProducts.php`;

			return axios.get(url)
				.then(resp => {
					commit("setProducts", resp.data)
				})
		},
		fetchProducts({ commit, dispatch }) {
			commit('setProductsLoading', true);
			dispatch('fetchProductsSilent')
				.then(res => {
					commit('setProductsLoading', false);
				})
		},
		fetchOS({ commit }) {
			commit('laodingOS', true);
			api.getWithParams('getTemplates')
				.then(resp => {
					commit("setOS", resp.response)
					commit('laodingOS', false)
				})
		},
		fetchProductsAuto({ state, dispatch }) {
			if (Object.keys(state.products).length > 0) {
				dispatch('fetchProductsSilent')
			} else {
				dispatch('fetchProducts')
			}
		},

		fetchAddonsSilent({ commit }) {
			const url = `getAddons.php`;

			return axios.get(url)
				.then(resp => {
					let data = resp.data;
					data.ssd = data.ssd.sort((a, b) => parseInt(a.description.VALUE) - parseInt(b.description.VALUE));
					data.hdd = data.hdd.sort((a, b) => parseInt(a.description.VALUE) - parseInt(b.description.VALUE));
					data.backup = data.backup.sort((a, b) => parseInt(a.description.VALUE) - parseInt(b.description.VALUE));
					data.os = data.os.sort((a, b) => parseInt(a.description.VALUE) - parseInt(b.description.VALUE));
					data.panel = data.panel.sort((a, b) => parseInt(a.description.VALUE) - parseInt(b.description.VALUE));
					commit("setAddons", data);
				})
		},
		fetchAddons({ commit, dispatch }) {
			commit('setAddonsLoading', true);
			dispatch('fetchAddonsSilent')
				.then(res => {
					commit('setAddonsLoading', false);
				})
		},
		fetchAddonsAuto({ state, dispatch }) {
			if (state.addons.length > 0) {
				dispatch('fetchAddonsSilent')
			} else {
				dispatch('fetchAddons')
			}
		},

		sendOrder(ctx, orderData) {
			return new Promise((resolve, reject) => {
				const user = ctx.rootGetters.getUser;
				const close_your_eyes = btoa('createOrder' + user.id + user.secret);
				const auth = {
					userid: user.id,
					secret: close_your_eyes,
				};
				const query = { ...auth, ...orderData };
				if (orderData.addons.length > 0) {
					query.addons = orderData.addons;
				}
				const url = `/createOrder.php?${URLparameter(query)}`;
				axios.get(url)
					.then(response => {
						resolve(response);
					})
					.catch(err => {
						reject(err);
					})
			})
		}
	},
	getters: {
		getProducts(state) {
			return state.products;
		},
		getAddons(state) {
			return state.addons;
		},

		isProductsLoading(state) {
			return state.productsLoading;
		},
		isAddonsLoading(state) {
			return state.addonsLoading;
		},
		getOS(state) {
			return state.dataOS.sort((a, b) => {
				let nameA = a.name.toLowerCase();
				let nameB = b.name.toLowerCase();
				if (nameA < nameB)
					return -1
				if (nameA > nameB)
					return 1
				return 0
			});
		},
	}
}

function URLparameter(obj, outer = '') {
	var str = "";
	for (var key in obj) {
		if (key == "price") continue;
		if (str != "") {
			str += "&";
		}
		if (typeof obj[key] == 'object') {
			str += URLparameter(obj[key], outer + key);
		} else {
			str += outer + key + "=" + encodeURIComponent(obj[key]);
		}
	}
	return str;
}