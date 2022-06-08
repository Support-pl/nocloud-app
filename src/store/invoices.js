import api from '@/api'

export default {
	namespaced: true,

	state: {
		loading: false,
		invoices: [],
		filter: ['all'],
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
		silentFetch({commit}){
			return new Promise((resolve, reject) => {
				api.sendAsUser('invoices')
				.then(res => {
					const invoices = res?.invoices?.invoice ?? [];
					commit('updateInvoices', invoices);
					commit('makeLoadingIs', false);
					resolve(invoices)
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
		// fetchInvoices(ctx) {
		// 	if (ctx.getters.isLoading) return;
		// 	ctx.commit('makeLoadingIs', true);
		// 	const user = ctx.rootGetters.getUser;

		// 	const close_your_eyes = md5('invoices' + user.id + user.secret);
		// 	const url = `/invoices.php?userid=${user.id}&secret=${close_your_eyes}`;
		// 	// console.log(url)

		// 	axios.get(url)
		// 		.then(resp => {
		// 			// console.log("vuex action invoices responsive: ", resp);
		// 			if (Object.keys(resp.data.invoices).length > 0){
		// 				ctx.commit("updateInvoices", resp.data.invoices.invoice);
		// 			} else {
		// 				ctx.commit("updateInvoices", []);
		// 			}
		// 			ctx.commit('makeLoadingIs', false)
		// 		})
		// },
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
		isLoading(state) {
			return state.loading;
		},
	}
}