import api from "@/api.js"

export default {
	namespaced: true,
  state: {
		servicesProviders: [],
    showcases: [],
		loading: false,
    showcasesLoading: false
  },
  mutations: {
		setServicesProviders(state, servicesProviders) {
			state.servicesProviders = servicesProviders;
		},
    setShocases(state, showcases) {
      state.showcases = showcases;
    },
		setLoading(state, data) {
			state.loading = data;
		},
    setShowcasesLoading(state, data) {
      state.showcasesLoading = data;
    }
  },
  actions: {
		fetch({ commit }, anonymously = false){
			commit("setLoading", true);
			return new Promise((resolve, reject) => {
				api.servicesProviders.list(anonymously)
          .then(response => {
            commit('setServicesProviders', response.pool);
            resolve(response);
          })
          .catch(error => {
            reject(error);
          })
          .finally(() => {
            commit("setLoading", false);
          });
			});
		},
    fetchShowcases({ commit }) {
      commit("setShowcasesLoading", true);
      return new Promise((resolve, reject) => {
        api.showcases.list()
          .then((response) => {
            commit("setShocases", response.showcases);
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          })
          .finally(() => {
            commit("setShowcasesLoading", false);
          });
      });
    }
  },
	getters: {
		getSP(state) {
			return state.servicesProviders;
		},
    getShowcases(state) {
      return state.showcases;
    },
		isLoading(state) {
			return state.loading;
		},
    isShowcasesLoading(state) {
      return state.showcasesLoading;
    }
	}
}
