import api from '@/api'

export default {
	namespaced: true,

	state: {
		loading: false,
		invoices: [],
		filter: ['all'],
    baseURL: 'https://whmcs.demo.support.pl/modules/addons/nocloud/api/index.php',
	},
	mutations: {
		updateInvoices(state, value) {
			state.invoices = value;
		},
		makeLoadingIs(state, value) {
			state.loading = value;
		},
		updateFilter(state, value){
			state.filter = value;
		},
	},
	actions: {
		silentFetch({state, commit}){
			return new Promise((resolve, reject) => {
				api.get(state.baseURL, { params: { run: 'get_invoices' } })
          .then(res => {
					  const invoices = res?.invoices?.invoice ?? [];

            if (!res.ERROR) commit('updateInvoices', invoices);
            commit('makeLoadingIs', false);
            resolve(invoices);
          })
          .catch(err => reject(err));
			});
		},
		fetch({dispatch, commit}){
			commit('makeLoadingIs', true);
			return dispatch('silentFetch');
		},
		autoFetch({state, dispatch}){
			if(state.invoices.length > 0){
				return dispatch('silentFetch');
			} else {
				return dispatch('fetch');
			}
		}
	},
	getters: {
		getAllInvoices(state){
			return state.invoices;
		},
		getInvoices(state) {
			let filtred;

			if (state.filter[0] == 'all' || state.filter.length == 0) {
				filtred = state.invoices;
			} else {
				filtred = state.invoices.filter(ticket => state.filter.includes(ticket.status))
			}

			return filtred.sort((a, b) => {
				const dictionary = {
					Cancelled: 1,
					Paid: 1,
					Unpaid: 2,
				}
				let astatus = dictionary[a.status];
				let bstatus = dictionary[b.status];
				if(astatus != bstatus){
					return bstatus - astatus;
				}
				let aid = parseInt(a.id, 10);
				let bid = parseInt(b.id, 10);
				return bid - aid;
			});
		},
    getURL(state) {
      return state.baseURL;
    },
		isLoading(state) {
			return state.loading;
		},
	}
}