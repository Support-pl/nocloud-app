import api from '@/api'
export default {
	namespaced: true,

	state: {
		products: [],
		productsLoading: false
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
		fetch({commit, dispatch}){
			commit('setProductsLoading', true);
			return dispatch('silentFetch');
		},
		silentFetch({commit}){
			return new Promise((resolve, reject) => {
				api.sendAsUser('get.user.products')
				.then(res => {
					commit('setProducts', res);
					commit('setProductsLoading', false);
					resolve(res);
				})
				.catch(error => reject(error))
			})
		},
		autoFetch({dispatch, state}){
			if(state.products.length > 0){
				return dispatch('silentFetch');
			} else {
				return dispatch('fetch');
			}
		}
	},
	getters: {
		getProducts(state){
			return state.products;
		},
		getProductsLoading(state){
			return state.productsLoading;
		}
	}
}