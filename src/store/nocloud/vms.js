import api from "@/api.js"
import vue from "vue"

export default {
	namespaced: true,
	state: {
		services: [],
		instances: [],

		loading: false,
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

					if (state.instances.length) {
						let isInstance = false;
						state.instances.forEach(item => {
							if (item.uuidService === data.uuid) {
								isInstance = true
							}
						})
						if (!isInstance) {
							state.instances.push(instanceItem)
						}
					} else {
						state.instances.push(instanceItem)
					}
				})
			})
		},
		setUpdateInstance(state, data) {
			const index = state.instances.findIndex(el => el.uuidService === data.uuid)
			data.instancesGroups.forEach(item => {
				item.instances.forEach(el => {
					const instanceItem = {
						uuidService: data.uuid,
						uuidInstancesGroups: item.uuid,
						type: item.type,
						sp: item.sp,
						...el
					}
					state.instances.splice(index, 1, instanceItem)
				})
			})
		},
	
		setLoading(state, data) {
			state.loading = data;
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
								// commit('setInstancesGroups', response)
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
					commit('setUpdateInstance', response)
					resolve(response)
				})
					.catch(error => {
						reject(error);
					})
					.finally(() => {
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
			if (state.instances.length < 0) return []
			return state.instances
		},
		getServices(state) {
			if (state.services.length < 0) return []
			return state.services
		},
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