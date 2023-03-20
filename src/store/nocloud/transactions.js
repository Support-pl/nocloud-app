import api from "@/api.js"

export default {
  namespaced: true,
  state: {
    allTransactions: {},
    transactions: [],
    total: 10,
    size: 10,
    page: 1,
    tab: 'Invoice',
    loading: false,
    filter: []
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
    setActiveTab(state, data) {
      state.tab = data
    },
    setLoading(state, data) {
      state.loading = data
    },
    updateFilter(state, data) {
      state.filter = data
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
    all(state) {
      return state.transactions.filter(({ proc }) => {
        if (state.filter.length < 1) return true

        const startOf = state.filter[0]._d.getTime() / 1000
        const endOf = state.filter[1]._d.getTime() / 1000

        return proc > startOf && proc < endOf
      })
    },
    total: state => state.total,
    size: state => state.size,
    page: state => state.page,
    activeTab: state => state.tab,
    isLoading: state => state.loading
  }
}
