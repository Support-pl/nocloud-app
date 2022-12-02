import api from '@/api'
import config from '@/appconfig'

export default {
	namespaced: true,

	state: {
		products: [],
		productsLoading: false,
    baseURL: `${config.WHMCSsiteurl}${config.sharedFolder}`
	},
	mutations: {
		setProducts(state, data){
			state.products = data;
		},
		setProductsLoading(state, data){
			state.productsLoading = data;
		}
	},
	actions: {
		fetch({ commit, dispatch }, userid){
			commit('setProductsLoading', true);
			return dispatch('silentFetch', userid);
		},
		silentFetch({ state, commit }, userid){
			return new Promise((resolve, reject) => {
				api.get(`${state.baseURL}/get.user.products.php`, { params: { userid } })
          .then(res => {
            commit('setProducts', res);
            commit('setProductsLoading', false);
            resolve(res);
          })
          .catch(error => reject(error))
			})
		},
		autoFetch({ dispatch, state }, userid){
			if(state.products.length > 0){
				return dispatch('silentFetch', userid);
			} else {
				return dispatch('fetch', userid);
			}
		}
	},
	getters: {
		getProducts(state){
			return state.products;
		},
		getProductsLoading(state){
			return state.productsLoading;
		},
    getURL(state){
      return state.baseURL;
    }
	}
}