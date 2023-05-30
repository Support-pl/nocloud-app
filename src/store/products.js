import api from '@/api'
import config from '@/appconfig'

export default {
	namespaced: true,

	state: {
		products: [],
    services: {},
    total: 10,
    size: 10,
    page: 1,
		productsLoading: false,
    baseURL: `${config.WHMCSsiteurl}${config.sharedFolder}`
	},
	mutations: {
		setProducts(state, data) {
			state.products = data;
		},
    setServices(state, data) {
      state.services = data;
    },
    setTotal(state, data) {
      state.total = data;
    },
    setSize(state, data) {
      state.size = data;
    },
    setPage(state, data) {
      state.page = data;
    },
		setProductsLoading(state, data) {
			state.productsLoading = data;
		}
	},
	actions: {
		fetch({ commit, dispatch }, userid) {
			commit('setProductsLoading', true);
			return dispatch('silentFetch', userid);
		},
		silentFetch({ commit, rootState }, userid) {
			return new Promise((resolve, reject) => {
				api.get(rootState.nocloud.auth.baseURL, { params: { userid, run: 'get_active_products' } })
          .then(res => {
            const products = Object.values(res ?? []);

            commit('setProducts', products);
            commit('setProductsLoading', false);
            resolve(products);
          })
          .catch(error => reject(error))
			})
		},
		autoFetch({ dispatch, state }, userid) {
			if (state.products.length > 0) {
				return dispatch('silentFetch', userid);
			} else {
				return dispatch('fetch', userid);
			}
		},
    fetchServices({ commit, rootState }) {
      return new Promise((resolve, reject) => {
        api.get(rootState.nocloud.auth.baseURL, { params: { run: 'get_product_list' } })
          .then((res) => {
            const services = {};

            Object.values(res).forEach(({ group_name, prod }) => {
              services[group_name] = prod;
            });

            commit('setServices', services);
            resolve(res)
          })
          .catch((error) => reject(error));
      });
    }
	},
	getters: {
		getProducts: state => state.products,
    getServices: state => state.services,
    total: state => state.total,
    size: state => state.size,
    page: state => state.page,
		getProductsLoading: state => state.productsLoading,
    getURL: state => state.baseURL
	}
}
