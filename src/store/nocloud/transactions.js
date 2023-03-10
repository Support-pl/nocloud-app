import api from "@/api.js"

export default {
  namespaced: true,
  state: {
    allTransactions: {},
    transactions: [],
    total: 5,
    size: 5,
    page: 1,
    loading: false
  },
  mutations: {
    setTransactions(state, data) {
      state.transactions = data
    },
    setAll(state, { pool, page, size }) {
      for (let i = page; i <= size / 5 * page; i++) {
        state.allTransactions[i] = pool.slice(i * 5 / page - 5, i * 5 / page)
      }
    },
    setTotal(state, data) {
      state.total = data
    },
    setSize(state, data) {
      state.size = data
    },
    setPage(state, data) {
      state.page = data
    },
    setLoading(state, data) {
      state.loading = data
    }
  },
  actions: {
    fetch({ commit, state }, params) {
      return new Promise((resolve, reject) => {
        const transactions = []

        for (let i = params.limit / 5 * params.page; i >= params.page; i--) {
          if (!state.allTransactions[i]) break;

          transactions.push(...state.allTransactions[i])
        }

        if (transactions.length > 0) {
          commit('setTransactions', transactions)
          resolve({ pool: transactions })
          return
        }

        commit("setLoading", true);
        api.transactions.get(params)
          .then(response => {
            response.page = params.page
            response.size = params.limit

            commit('setTransactions', response.pool)
            commit('setAll', response)
            resolve(response)
          })
          .catch(error => {
            reject(error)
          })
          .finally(() => {
            commit("setLoading", false)
          })
      })
    }
  },
  getters: {
    all: state => state.transactions,
    total: state => state.total,
    size: state => state.size,
    page: state => state.page,
    isLoading: state => state.loading
  }
}
