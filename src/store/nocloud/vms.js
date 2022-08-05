import api from "@/api.js"
import vue from "vue"

export default {
	namespaced: true,
	state: {
		services: [],
		instances: [],
		servicesFull: [],
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
	},
	actions: {
		fetch({ commit }) {
			return new Promise((resolve, reject) => {
				commit("setLoading", true);
				api.services.list()
					.then(response => {
						commit('setServices', response.pool)
						for (let srv of response.pool) {
							api.services.get(srv.uuid).then((response) => {
								commit("setInstances", response);
								commit('setServicesFull', response)
								resolve(response);
							})
								.catch((error) => {
									reject(error);
								})
								.finally(() => {
									commit("setLoading", false);
								});

						}
						resolve(response)
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
			state.socket = new WebSocket(`wss://api.nocloud.ione-cloud.net/services/${uuid}/stream`);

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



	},
	getters: {
		all(state) {
			return state.services;
		},
		isLoading: state => state.loading,

		getInstances(state) {
			if (state.instances.length < 0) return []
			return state.instances
		},
		getServices(state) {
			if (state.services.length < 0) return []
			return state.services
		},
		getServicesFull(state) {
			if (state.servicesFull.length < 0) return []
			return state.servicesFull
		},
		getActionLoadingInvoke: state => state.loadingInvoke,
	}
}