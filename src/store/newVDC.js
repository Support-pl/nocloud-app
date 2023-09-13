import axios from '../axios';

import api from '@/api.js'

export default {
	namespaced: true,

	state: {
		templates: [],
		rates: [],
		loading: false
	},
	mutations: {
		makeLoadingIs(state, value) {
			state.loading = value;
		},
		updateTemplates(state, value){
			state.templates = value;
		},
		updateRates(state, value){
			state.rates = value;
		}
	},
	actions: {
		fetchTemplates(ctx) {
			ctx.commit('makeLoadingIs', true);
			// const user = ctx.rootGetters.getUser;

			// const close_your_eyes = md5('getTemplates' + user.id + user.secret);
			// const url = `getTemplates.php?userid=${user.id}&secret=${close_your_eyes}`;
			// console.log(url)

			// axios.get(url)
			api.getWithParams('getTemplates')
				.then(resp => {
					ctx.commit("updateTemplates", resp.response)
					ctx.commit('makeLoadingIs', false)
				})
		},
		fetchRates(ctx) {
			ctx.commit('makeLoadingIs', true);
			const url = `/getVMSTemplates.php`;

			axios.get(url)
				.then(resp => {
					ctx.commit("updateRates", resp.data)
					ctx.commit('makeLoadingIs', false)
					// console.log(resp);
				})
		},
	},
	getters: {
		getTemplates(state){
			return state.templates.sort((a,b) => {
				let nameA = a.name.toLowerCase();
				let nameB = b.name.toLowerCase();
				if (nameA < nameB)
					return -1
				if (nameA > nameB)
					return 1
				return 0
			});
		},
		getRates(state){
			return state.rates;
		}
	}
}