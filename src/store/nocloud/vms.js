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
	},
	mutations: {
		setCreateInstance(state, data) {
			data.instancesGroups.forEach(item => {
				item.instances.forEach(el => {
					const instanceItem = {
						uuidService: data.uuid,
						uuidInstancesGroups: item.uuid,
						type: item.type,
						sp: item.sp,
						...el
					}
					state.instances.push(instanceItem)
				})
			})
		},
		setServices(state, services) {
			state.services = services;
		},
		// setInstances(state, services) {
		// 	const instances = [];
		// 	services.forEach(service => {
		// 		Object.keys(service.instancesGroups).forEach(groupName => {
		// 			service.instancesGroups[groupName].instances.forEach(instance => {
		// 				instance.status = service.status
		// 				instance.meta = {
		// 					serviceUUID: service.uuid,
		// 					groupName,
		// 					groupUUID: service.instancesGroups[groupName].uuid
		// 				}
		// 				vue.set(instances, instances.length, instance);
		// 			})
		// 		})
		// 	})
		// 	state.instances = instances
		// },
		setInstances(state, data) {
			data.instancesGroups.forEach(item => {
				item.instances.forEach(el => {
					const instanceItem = {
						uuidService: data.uuid,
						uuidInstancesGroups: item.uuid,
						type: item.type,
						sp: item.sp,
						...el
					}
					const index = state.instances.findIndex(item => item.uuid === instanceItem.uuid)
					if (index == -1) {
						state.instances.push(instanceItem)
					}
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
		setUpdateInstanceInvoke(state, data) {
			state.instances.find(item => {
				if (item.state.meta.uuid === data.meta.uuid) {
					return item.state.meta = data.meta
				}
			})

			// const state = {
			// 	// останавливающийся
			// 	SHUTDOWN_POWEROFF: {
			// 		lcm_state:18,
			// 		state:3
			// 	},
			// 	// остановленный
			// 	POWEROFF:{
			// 		lcm_state:0,
			// 		state:8
			// 	},
			// 	// запускающийся
			// 	BOOT_POWEROFF:{
			// 		lcm_state:20,
			// 		state:3
			// 	},
			// 	// запущенный
			// 	RUNNING:{
			// 		lcm_state:3,
			// 		state:3
			// 	}
			// }

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

					})
			})
		},
		createService({ commit }, data) {
			return new Promise((resolve, reject) => {
				api.services._create(data)
					.then(response => {
						commit('setCreateInstance', response)
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
				api.services._update(data).then(response => {
					// commit('setUpdateInstance', response)
					resolve(response)
				})
					.catch(error => {
						reject(error);
					})
					.finally(() => {
					})
			})
		},
		actionVMInvoke({ commit, dispatch }, data) {
			commit("setLoadingInvoke", true);
			return new Promise((resolve, reject) => {
				api.instances
					.action(data)
					.then((response) => {
						commit('setUpdateInstanceInvoke', response)
						// if (response.meta.state == 3 && response.meta.lcm_state == 18 || response.meta.state == 3 && response.meta.lcm_state == 20 ) {
						// 	setInterval(() => {
						// 		dispatch("actionVMInvoke", data)
						// 	}, 3000); 
						// } else commit('setLoadingInvoke', false)
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
		// getLoadingUpdateInvoke: state => state.loadingUpdateInvoke
		// instances(state){
		// 	const instances = [];
		// 	if(state?.services == undefined || state.services.length > 0) return []
		// 	state.services.forEach(service => {
		// 		Object.keys(service.instancesGroups).forEach(groupName => {
		// 			service.instancesGroups[groupName].instances.forEach(instance => {
		// 				instance.status = service.status
		// 				instances.push(instance)
		// 				console.log(instances)
		// 			})
		// 		})
		// 	})
		// 	return instances;

	}
}
