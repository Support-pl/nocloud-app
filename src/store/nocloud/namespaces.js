import api from "@/api.js"

export default {
    namespaced: true,
    state: {
        namespaces: [],
        loading: false,
    },
    mutations: {
        setNameSpaces(state, data) {
            state.namespaces = data;
        },

        setLoading(state, data) {
            state.loading = data;
        },

    },
    actions: {
        fetch({ commit }) {
            return new Promise((resolve, reject) => {
                commit("setLoading", true);
                api.namespaces.list()
                    .then(response => {
                        commit('setNameSpaces', response.pool)
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
        getNameSpaces: state => state.namespaces

    }
}