import api from "@/api.js"

export default {
    namespaced: true,
    state: {
        accounts: [],
        loading: false,
    },
    mutations: {
        setAccounts(state, data) {
            state.accounts = data;
        },

        setLoading(state, data) {
            state.loading = data;
        },

    },
    actions: {
        fetch({ commit }) {
            return new Promise((resolve, reject) => {
                commit("setLoading", true);
                api.accounts.list()
                    .then(response => {
                        commit('setAccounts', response.pool)
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
        getAccounts: state => state.accounts

    }
}