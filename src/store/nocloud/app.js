export default {
    namespaced: true,
    state: {
        isFromRoute: ''
    },
    mutations: {
        setFromRoute(state, data) {
            state.isFromRoute = data;
        },
    },
    actions: {
        fromRoute({ commit }, data) {
            commit('setFromRoute', data)
        }
    },
    getters: {
        getFromRoute: state => state.isFromRoute
    }
}
