import api from "@/api.js"
export default {
    namespaced: true,
    state: {
        plans: [],
        custom: {
            "uuid": "3805b400-9601-4425-ae78-673024dffc31",
            "title": "VDC Sample",
            "type": "ione",
            "public": true,
            "resources": [
                {
                    "key": "cpu",
                    "kind": 1,
                    "price": 1,
                    "period": 60,
                    "on": [
                        3,
                        7,
                        6,
                        4
                    ]
                },
                {
                    "key": "ram",
                    "kind": 1,
                    "price": 1,
                    "period": 60,
                    "on": [
                        3,
                        4,
                        6,
                        7
                    ]
                },
                {
                    "key": "ip",
                    "kind": 2,
                    "price": 1,
                    "period": 86400,
                    "except": true,
                    "on": [
                        5,
                        0
                    ]
                }
            ]
        }
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
        fetch({ commit }) {
            commit("setLoading", true);
            return new Promise((resolve, reject) => {
                api.plans.list()
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
        getCustom: state => state.custom
    }
}
