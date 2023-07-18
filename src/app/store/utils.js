import api from '@/shared/api/api.js'
import config from '@/shared/config/appconfig.js'
export default {
  namespaced: true,
  state: {

  },
  mutations: {

  },
  actions: {
    createTicket (ctx, { subject, message }) {
      return new Promise((resolve, reject) => {
        api.sendAsUser('openticket', {
          subject,
          message,
          department: config.autoTicketDepartment
        })
          .then(resolve)
          .catch(reject)
      })
    }
  },
  getters: {

  }
}
