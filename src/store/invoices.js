import api from '@/api'
import config from '@/appconfig'

export default {
	namespaced: true,

	state: {
		loading: false,
		invoices: [],
		filter: ['all'],
    baseURL: `${config.WHMCSsiteurl}modules/addons/nocloud/api/index.php`,
	},
	mutations: {
		updateInvoices(state, value) {
			state.invoices = value;
		},
		makeLoadingIs(state, value) {
			state.loading = value;
		},
		updateFilter(state, value) {
			state.filter = value;
		},
	},
	actions: {
		silentFetch({state, commit, rootState}){
			return new Promise((resolve, reject) => {
        const account = rootState.nocloud.auth.userdata.uuid;
        const promises = [
          api.get(state.baseURL, { params: { run: 'get_invoices' } }),
          api.transactions.list({ account, type: 'invoice' })
        ];

        function date(timestamp) {
          if (timestamp < 1) return '-';

          const date = new Date(timestamp * 1000);

          const year = date.getFullYear();
          let month = date.getMonth() + 1;
          let day = date.getDate();

          if (`${month}`.length < 2) month = `0${month}`;
          if (`${day}`.length < 2) day = `0${day}`;

          return `${year}-${month}-${day}`;
        }

        Promise.all(promises).then(res => {
          const invoices = res[0]?.invoices?.invoice ?? [];

          res[1].pool.forEach((el) => {
            if (el.meta.invoiceCreate) return;
            invoices.push({
              id: el.uuid,
              date: date(el.proc),
              duedate: date(el.exec),
              total: el.total,
              status: 'Unpaid',
              credit: 0,
              service: el.service,
              currencycode: el.currency,
              meta: el.meta
            });
          });

          invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (!res[0]?.ERROR) commit('updateInvoices', invoices);
          else reject(res[0].ERROR);

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
