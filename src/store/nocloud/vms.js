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
		setInstances(state, { service, rootState }) {
      state.instances = state.instances.filter(({ uuidService }) =>
        uuidService !== service.uuid
      )

      service.instancesGroups.forEach(group => {
        group.instances.forEach(inst => {
          const {
            currencies,
            defaultCurrency,
            billingUser: { currency_code = defaultCurrency }
          } = rootState.nocloud.auth;

          const { rate } = currencies.find((el) =>
            el.from === defaultCurrency && el.to === currency_code
          ) ?? {};

          const { rate: reverseRate } = currencies.find((el) =>
            el.to === defaultCurrency && el.from === currency_code
          ) ?? { rate: 1 };

          const resources = inst.billingPlan.resources.map((res) => ({
            ...res, price: +(res.price * (rate ? rate : reverseRate)).toFixed(2)
          }));
          const products = {};

          Object.entries(inst.billingPlan.products).forEach(([key, value]) => {
            products[key] = {
              ...value, price: +(value.price * (rate ? rate : reverseRate)).toFixed(2)
            };
          });

          state.instances.push({
            ...inst,
            uuidService: service.uuid,
            type: group.type,
            sp: group.sp,
            billingPlan: { ...inst.billingPlan, resources, products }
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
			inst.state = JSON.parse(JSON.stringify(data.state));
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
		fetch({ dispatch, commit, rootState }, silent) {
			return new Promise((resolve, reject) => {
				commit("setLoading", !silent);
				api.services.list()
					.then(async (response) => {
            if (rootState.nocloud.auth.currencies.length < 1) {
              await dispatch('nocloud/auth/fetchCurrencies', null, { root: true })
            }

						commit('setServices', response.pool);
            response.pool.forEach((service) => {
              commit("setInstances", { service, rootState });
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
		createService({ commit, rootState }, data) {
			return new Promise((resolve, reject) => {
				api.services._create(data)
					.then(response => {
						commit('setInstances', { service: response, rootState })
						resolve(response)
					})
					.catch(error => {
						reject(error);
					})
					.finally(() => {
					})
			})
		},
		updateService({ commit, rootState }, data) {
			return new Promise((resolve, reject) => {
				api.services._update(data)
          .then(response => {
            commit('setInstances', { service: response, rootState })
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
            inst.title.toLowerCase().includes(state.searchString),
						inst.state?.state.toLowerCase().includes(state.searchString),
						net?.private?.some((el) => el.includes(state.searchString)),
						net?.public?.some((el) => el.includes(state.searchString)),
					]

					return rules.some(el => !!el) && inst.state?.state !== 'DELETED';
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
