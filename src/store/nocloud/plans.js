import api from "@/api.js"
export default {
    namespaced: true,
    state: {
        plans: [],
        loading:false
    },
    mutations: {
        setPlans(state, data) {
            state.plans = data;
        },

        setLoading(state, data) {
            state.loading = data;
        },
    },
    actions: {
        fetch({ commit }, params) {
            commit("setLoading", true);
            return new Promise((resolve, reject) => {
                api.plans.list(params)
                    .then(response => {
                        commit('setPlans', response.pool)
                        resolve(response)
                    })
                    .catch(error => {
                        reject(error);
                    })
                    .finally(() => {
                        commit("setLoading", false);
                    })
            })
        }
    },
    getters: {
        getPlans: state => state.plans,
        isPlansLoading: state => state.loading,
    }
}
