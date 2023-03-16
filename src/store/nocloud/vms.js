import api from "@/api.js"
import Cookies from "js-cookie";
import vue from "vue"

export default {
	namespaced: true,
	state: {
		services: [],
		instances: [],
		servicesFull: [],
    searchString: '',
		loading: false,
		loadingInvoke: false,
		stateVM: '',
    socket: null
	},
	mutations: {
		setServices(state, services) {
			state.services = services;
		},
		setInstances(state, data) {
      state.instances = state.instances.filter(({ uuidService }) =>
        uuidService !== data.uuid
      )
			data.instancesGroups.forEach(group => {
				group.instances.forEach(inst => {
					state.instances.push({
						...inst,
						uuidService: data.uuid,
						uuidInstancesGroups: group.uuid,
						type: group.type,
						sp: group.sp
					})
				})
			})
		},
		setServicesFull(state, data) {
			if (state.servicesFull.length) {
				let servicesFull = false;
				state.servicesFull.forEach(item => {
					if (item.uuid === data.uuid) {
						servicesFull = true
					}
				})
				if (!servicesFull) {
					state.servicesFull.push(data)
				}
			} else {
				state.servicesFull.push(data)
			}
		},
		setInstanceInvoke(state, data) {
			const inst = state.instances.find(item => item.uuid === data.uuid);

      data.state.meta.networking = inst.state.meta.networking;
			inst.state = data.state;
		},
		setLoading(state, data) {
			state.loading = data;
		},
		setLoadingInvoke(state, data) {
			state.loadingInvoke = data;
		},
    setSearch(state, data) {
      state.searchString = data;
    }
	},
	actions: {
		fetch({ commit }, silent) {
			return new Promise((resolve, reject) => {
				commit("setLoading", (silent) ? false : true);
				api.services.list()
					.then(response => {
						commit('setServices', response.pool);
            response.pool.forEach((service) => {
              commit("setInstances", service);
              commit('setServicesFull', service);
            });
						resolve(response);
					})
					.catch(error => {
						reject(error);
					})
					.finally(() => {
            commit("setLoading", false);
					})
			})
		},
		createService({ commit }, data) {
			return new Promise((resolve, reject) => {
				api.services._create(data)
					.then(response => {
						commit('setInstances', response)
						resolve(response)
					})
					.catch(error => {
						reject(error);
					})
					.finally(() => {
					})
			})
		},
		updateService({ commit }, data) {
			return new Promise((resolve, reject) => {
				api.services._update(data)
          .then(response => {
            commit('setInstances', response)
            resolve(response)
          })
					.catch(error => {
						reject(error);
					})
			})
		},
		subscribeWebSocket({ commit, state }, uuid) {
      const token = Cookies.get('noCloudinApp-token');

			state.socket = new WebSocket(`${VUE_APP_BASE_URL.replace('https', 'wss')}services/${uuid}/stream`, ['Bearer', token]);

			state.socket.onopen = (event) => {
				console.log(event)
			};
			state.socket.onmessage = (event) => {
				console.log(event)
				let response = JSON.parse(event.data).result
				if (response) {
					commit('setInstanceInvoke', response)
				}
			}
			state.socket.onclose = (event) => {
				console.log(event)
			};
			state.socket.onerror = (event) => {
				console.log(event)
			};

		},
		actionVMInvoke({ commit, dispatch }, data) {
			return new Promise((resolve, reject) => {
				api.instances
					.action(data)
					.then((response) => {
						resolve(response)
					})
					.catch((err) => {
						reject(err);
					})
					.finally(() => {
						commit("setLoadingInvoke", false);
					});
			})
		},
    deleteInstance(_, uuid) {
      return new Promise((resolve, reject) => {
        api.delete(`/instances/${uuid}`)
          .then((response) => {
            resolve(response)
          })
          .catch((err) => {
            reject(err)
          })
      })
    }
	},
	getters: {
		all(state) {
			return state.services;
		},
		isLoading: state => state.loading,

		getInstances(state) {
			if (state.searchString) {
				return state.instances.filter((inst) => {
          const net = inst.state?.meta?.networking
					const rules = [
            inst.state && inst.state.state !== 'DELETED',
            inst.title.toLowerCase().includes(state.searchString),
						inst.state?.state.toLowerCase().includes(state.searchString),
						net?.private?.some((el) => el.includes(state.searchString)),
						net?.public?.some((el) => el.includes(state.searchString)),
					]
					return rules.some(el => !!el)
				})
			}
			return state.instances.filter(({ state }) => state?.state !== 'DELETED');
		},
		getServices(state) {
			if (state.services.length < 0) return []
			return state.services
		},
		getServicesFull(state) {
			if (state.servicesFull.length < 0) return []
			return state.servicesFull
		},
    getString: (state) => state.searchString,
		getActionLoadingInvoke: (state) => state.loadingInvoke,
	}
}
