import api from "@/api.js"

export default {
    namespaced: true,
    state: {
        transactions: [],
        loading: false,
    },
    mutations: {
        setTransactions(state, data) {
            state.transactions = data;
        },

        setLoading(state, data) {
            state.loading = data;
        },

    },
    actions: {
        fetch({ commit },uuid ) {
            return new Promise((resolve, reject) => {
                commit("setLoading", true);
                api.transactions.get(uuid)
                    .then(response => {
                        commit('setTransactions', response.pool)
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
        getTransactions: state => state.transactions,
        isTransactionsLoading: state => state.loading

    }
}