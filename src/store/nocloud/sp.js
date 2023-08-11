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
    setShowcases(state, showcases) {
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
            commit("setShowcases", response.showcases);
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
      const showcases = {};

      state.showcases.forEach((showcase) => {
        showcase.items.forEach((item) => {
          const { plans = [] } = showcases[item.servicesProvider] ?? {};

          showcases[item.servicesProvider] = {
            locations: showcase.locations.filter((location) =>
              item.locations.includes(location.id)
            ),
            plans: [...plans, item.plan],
            title: showcase.title,
            uuid: showcase.uuid,
            icon: showcase.icon,
            promo: showcase.promo
          };
        });
      });

      return Object.entries(showcases).map(([key, showcase]) =>
        ({ ...showcase, servicesProvider: key })
      );
    },
		isLoading(state) {
			return state.loading;
		},
    isShowcasesLoading(state) {
      return state.showcasesLoading;
    }
	}
}
