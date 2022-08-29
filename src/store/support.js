import api from '@/api'

export default {
	namespaced: true,

	state: {
		loading: false,
		tickets: [],
		onlyClosedTickets: false,
		addTicketState: false,
		filter: ['all'],
		departments: [],
    baseURL: 'https://whmcs.demo.support.pl/modules/addons/nocloud/api/index.php',
	},
	mutations: {
		updateTickets(state, value){
			state.tickets = value;
		},
		updateFilter(state, value){
			state.filter = value;
		},
		makeLoadingIs(state, value){
			state.loading = value;
		},
		makeOnlyClosedTicketsIs(state, value){
			state.onlyClosedTickets = value
		},
		inverseAddTicketState(state){
			state.addTicketState = !state.addTicketState;
		},
		setDepartments(state, data){
			state.departments = data;
		}
	},
	actions: {
		silentFetch({state, commit}){
			return new Promise((resolve, reject) => {
				api.get(state.baseURL, { params: { run: "get_tickets" } })
          .then((res) => {
            if (res?.ERROR) throw res.ERROR.toLowerCase();
            commit("updateTickets", res);
            resolve(res);
          })
          .catch((err) => reject(err))
          .finally(() => commit("makeLoadingIs", false));
			});
		},
		fetch({dispatch, commit}){
			commit('makeLoadingIs', true);
			return dispatch('silentFetch');
		},
		autoFetch({state, dispatch}){
			if(state.tickets.length > 0){
				return dispatch('silentFetch');
			} else {
				return dispatch('fetch');
			}
		},
		fetchDepartments({state, commit}){
			return new Promise((resolve, reject) => {
				api.get(state.baseURL, { params: { run: 'get_dept' } })
				.then(res => {
          commit('setDepartments', res);
          resolve(res);
				})
				.catch(err => {
					console.error(err);
					reject(err);
				})
			})
		}
	},
	getters: {
		getAllTickets(state){
			return state.tickets;
		},
		getTickets(state){
			const order = [
				'open',
				'closed'
			];
			// console.log(state.tickets);
			const tickets = state.tickets.sort((a,b) => {
				return order.indexOf(a.status.toLowerCase()) - order.indexOf(b.status.toLowerCase());
			})
			if (state.filter[0] == 'all' || state.filter.length == 0) {
				return tickets;
			} else {
				return tickets.filter(ticket => state.filter.includes(ticket.status))
			}
		},
		isLoading(state){
			return state.loading;
		},
		isOnlyClosedTickets(state){
			return state.onlyClosedTickets;
		},
		isAddTicketState(state){
			return state.addTicketState;
		},
		getDepartments(state){
			return state.departments;
		},
    getURL(state){
      return state.baseURL;
    }
	}
}