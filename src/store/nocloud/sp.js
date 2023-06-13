import api from "@/api.js"

export default {
	namespaced: true,
  state: {
		servicesProviders: [],
		loading: false
  },
  mutations: {
		setServicesProviders(state, servicesProviders){
			state.servicesProviders = servicesProviders;
		},
		setLoading(state, data){
			state.loading = data;
		}
  },
  actions: {
		fetch({commit}, anonymously = false){
			commit("setLoading", true);
			return new Promise((resolve, reject) => {
				api.servicesProviders.list(anonymously)
				.then(response => {
					commit('setServicesProviders', response.pool)
					resolve(response)
				})
				.catch(error => {
					reject(error);
				})
				.finally(()=>{
					commit("setLoading", false);
				})
			})
		}
  },
	getters: {
		getSP(state){
			return state.servicesProviders;
		},
		isLoading(state){
			return state.loading
		}
	}
}
