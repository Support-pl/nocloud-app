import api from "@/api.js"
import config from "@/appconfig.js"
export default {
	namespaced: true,
	state: {

	},
	mutations: {

	},
	actions: {
		createTicket(ctx, {subject, message}){
			return new Promise((resolve, reject) => {
				api.sendAsUser('openticket', {
					subject,
					message,
					department: config.autoTicketDepartment
				})
				.then(resolve)
				.catch(reject)
			})
		},
	},
	getters: {

	}
}