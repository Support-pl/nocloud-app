import md5 from 'md5'
import axios from '@/shared/api/axios'
import api from '@/shared/api/api.js'

export default {
  namespaced: true,

  state: {
    loading: false,
    singleLoading: true,
    searchString: '',
    clouds: [],
    updating: false,
    opennedCloud: {},
    ansible: {}
  },
  mutations: {
    updateClouds (state, value) {
      for (let i = 0; i < value.length; i++) {
        if (value[i].IPS.length > 0) {
          value[i].IP = value[i].IPS.find(el => el.IP != undefined)?.IP || 'none'
        } else {
          value.IP = false
        }
        if (value[i].LCM_STATE == 3) { value[i].STATE = lcm_states[value[i].LCM_STATE] } else if (value[i].LCM_STATE == 3 && value[i].STATE == 3) { value[i].STATE = lcm_states[value[i].LCM_STATE] } else { value[i].STATE = states[value[i].STATE] }
      }
      state.clouds = value
    },
    makeLoadingIs (state, value) {
      state.loading = value
    },
    updateSearch (state, data) {
      state.searchString = data
    },
    makeUpdatingIs (state, value) {
      state.updating = value
    },
    updateOpenedCloud (state, value) {
      state.opennedCloud = value
    },
    makeSingleLoadingIs (state, value) {
      state.singleLoading = value
    },
    setAnsible (state, value) {
      state.ansible = value
    }
  },
  actions: {
    // fetchClouds(ctx) {
    // 	if (ctx.getters.isLoading) return;
    // 	if (ctx.getters.getClouds.length != 0) ctx.commit('makeUpdatingIs', true)
    // 	ctx.commit('makeLoadingIs', true);
    // 	const user = ctx.rootGetters.getUser;

    // 	const close_your_eyes = md5('getVMS' + user.id + user.secret);

    // 	const url = `/getVMS.php?userid=${user.id}&secret=${close_your_eyes}`;

    // 	axios.get(url)
    // 		.then(resp => {
    // 			// console.log("vuex got clouds: ", resp);
    // 			ctx.commit("updateClouds", resp.data)
    // 			ctx.commit('makeUpdatingIs', false)
    // 			ctx.commit('makeLoadingIs', false)
    // 		})
    // },
    fetchClouds ({ commit, dispatch }) {
      commit('makeLoadingIs', true)
      dispatch('silentFetchClouds')
    },
    silentFetchClouds ({ commit }) {
      return new Promise((resolve, reject) => {
        api.sendAsUser('getVMS')
          .then(res => {
            commit('updateClouds', res)
            commit('makeUpdatingIs', false)
            commit('makeLoadingIs', false)
            resolve(res)
          })
          .catch(err => reject(err))
      })
    },
    autoFetchClouds ({ state, dispatch }) {
      if (state.clouds.length > 0) {
        dispatch('silentFetchClouds')
      } else {
        dispatch('fetchClouds')
      }
    },
    fetchSingleCloud (ctx, vmid) {
      if (ctx.getters.getClouds.length != 0) ctx.commit('makeUpdatingIs', true)
      ctx.commit('makeSingleLoadingIs', true)
      const user = ctx.rootGetters.getUser

      const close_your_eyes = md5('getVmHash' + user.id + user.secret)

      const url = `/getVmHash.php?vmid=${vmid}&userid=${user.id}&secret=${close_your_eyes}`

      return new Promise((resolve, reject) => {
        axios.get(url)
          .then(resp => {
            const vmdata = resp.data.data
            if (vmdata != undefined && vmdata.STATE == 3 && vmdata.LCM_STATE != 3) {
              setTimeout(() => {
                ctx.dispatch('silentUpdate', vmid)
              }, 500)
            }
            ctx.commit('updateOpenedCloud', vmdata)
            ctx.commit('makeUpdatingIs', false)
            ctx.commit('makeSingleLoadingIs', false)
            resolve(resp.data)
          })
          .catch(err => {
            console.error(err)
            reject(err)
          })
      })
    },
    silentUpdate (ctx, vmid) {
      ctx.commit('makeUpdatingIs', true)
      const user = ctx.rootGetters.getUser
      const close_your_eyes = md5('getVmHash' + user.id + user.secret)
      const url = `/getVmHash.php?vmid=${vmid}&userid=${user.id}&secret=${close_your_eyes}`

      axios.get(url)
        .then(resp => {
          ctx.commit('updateOpenedCloud', resp.data.data)
          if (resp.data.data.STATE == 3 && resp.data.data.LCM_STATE != 3) {
            setTimeout(() => {
              ctx.dispatch('silentUpdate', vmid)
            }, 10000) // укажите здесь как часто надо обновлять страницу
          } else ctx.commit('makeUpdatingIs', false)
        })
        .catch(err => console.error(err))
    },
    fetchAnsible (ctx, id) {
      const user = ctx.rootGetters.getUser
      const close_your_eyes = md5('ansibleTestForErrors' + user.id + user.secret)
      const url = `/ansibleTestForErrors.php?procId=${id}&userid=${user.id}&secret=${close_your_eyes}`

      return new Promise((resolve, reject) => {
        axios.get(url)
          .then(response => {
            const result = response.data
            ctx.commit('setAnsible', result)
            resolve(result)
          })
          .catch(err => reject(err))
      })
    }
  },
  getters: {
    getClouds (state) {
      const regexp = new RegExp(state.searchString, 'i')
      if (state.searchString) {
        const res = state.clouds.filter(cloud => {
          const rules = [
            cloud.NAME.search(regexp) != -1,
            cloud.STATE.search(regexp) != -1,
            cloud.ID.search(regexp) != -1,
            cloud.IP !== undefined && cloud.IP.search(regexp) != -1,
            cloud.CUSTOM_VM_NAME !== undefined && cloud.CUSTOM_VM_NAME.search(regexp) != -1,
            cloud.IPS.some(ip => ip.IP.search(regexp) != -1)
          ]
          const result = rules.some(e => !!e)
          return result
        })
        return res
      } else {
        return state.clouds
      }
    },
    isLoading (state) {
      return state.loading
    },
    searchString (state) {
      return state.searchString
    },
    getCloudHostById: state => id => {
      return state.clouds.find(el => el.ID == id).HOST
    },
    isUpdating (state) {
      return state.updating
    },
    getOpenedCloud (state) {
      return state.opennedCloud
    },
    getCloudState (state) {
      if (state.opennedCloud.STATE != 3) {
        return states[state.opennedCloud.STATE]
      } else {
        return lcm_states[state.opennedCloud.LCM_STATE]
      }
    },
    getStateColor: state => vmstate => {
      let color = ''
      switch (vmstate.toLowerCase()) {
        case 'running':
          color = '#0fd058'
          break
        case 'poweroff':
          color = '#919191'
          break
        case 'suspend':
          color = '#f9f038'
          break
        default:
          color = '#f9f038'
          break
      }
      return color
    },
    permissions (state) {
      const cloud = state.opennedCloud
      if (cloud.PERMISSIONS == undefined) return
      const updating = state.updating
      const isLoaded = Object.keys(cloud).length !== 0

      const commonParams = [isLoaded, !updating, cloud.PERMISSIONS.OWNER_U]

      const params = {
        reboot: [...commonParams, cloud.STATE == 3, cloud.LCM_STATE == 3],
        shutdown: [...commonParams, cloud.STATE == 3, cloud.LCM_STATE == 3],
        start: [...commonParams, cloud.STATE !== 3],
        recover: [...commonParams]
      }

      const result = {
        reboot: !params.reboot.every(el => el),
        shutdown: !params.shutdown.every(el => el),
        start: !params.start.every(el => el),
        recover: !params.recover.every(el => el)
      }
      return result
    },
    singleLoading (state) {
      // const ans = Object.keys(state.opennedCloud).length == 0
      // console.log(ans)
      return state.singleLoading
    }
  }
}

const states = [
  'INIT', 'PENDING', 'HOLD', 'ACTIVE', 'STOPPED', 'SUSPENDED', 'DONE', '', 'POWEROFF', 'UNDEPLOYED', 'CLONING', 'CLONONG_FAILURE'
]

const lcm_states = [
  'LCM_INIT', 'PROLOG', 'BOOT', 'RUNNING', 'MIGRATE', 'SAVE_STOP', 'SAVE_SUSPEND', 'SAVE_MIGRATE', 'PROLOG_MIGRATE', 'PROLOG_RESUME', 'EPILOG_STOP', 'EPILOG', 'SHUTDOWN', 'CLEANUP_RESUBMIT', 'UNKNOWN', 'HOTPLUG', 'SHUTDOWN_POWEROFF', 'BOOT_UNKNOWN', 'BOOT_POWEROFF', 'BOOT_SUSPENDED', 'BOOT_STOPPED', 'CLEANUP_DELETE', 'HOTPLUG_SNAPSHOT', 'HOTPLUG_NIC', 'HOTPLUG_SAVEAS', 'HOTPLUG_SAVEAS_POWEROFF', 'HOTPLUG_SAVEAS_SUSPENDED', 'SHUTDOWN_UNDEPLOY', 'EPILOG_UNDEPLOY', 'PROLOG_UNDEPLOY', 'BOOT_UNDEPLOY', 'HOTPLUG_PROLOG_POWEROFF', 'HOTPLUG_EPILOG_POWEROFF', 'BOOT_MIGRATE', 'BOOT_FAILURE', 'BOOT_MIGRATE_FAILURE', 'PROLOG_MIGRATE_FAILURE', 'PROLOG_FAILURE', 'EPILOG_FAILURE', 'EPILOG_STOP_FAILURE', 'EPILOG_UNDEPLOY_FAILURE', 'PROLOG_MIGRATE_POWEROFF', 'PROLOG_MIGRATE_POWEROFF_FAILURE', 'PROLOG_MIGRATE_SUSPEND', 'PROLOG_MIGRATE_SUSPEND_FAILURE', 'BOOT_UNDEPLOY_FAILURE', 'BOOT_STOPPED_FAILURE', 'PROLOG_RESUME_FAILURE', 'PROLOG_UNDEPLOY_FAILURE', 'DISK_SNAPSHOT_POWEROFF', 'DISK_SNAPSHOT_REVERT_POWEROFF', 'DISK_SNAPSHOT_DELETE_POWEROFF', 'DISK_SNAPSHOT_SUSPENDED', 'DISK_SNAPSHOT_REVERT_SUSPENDED', 'DISK_SNAPSHOT_DELETE_SUSPENDED', 'DISK_SNAPSHOT', 'DISK_SNAPSHOT_DELETE', 'PROLOG_MIGRATE_UNKNOWN', 'PROLOG_MIGRATE_UNKNOWN_FAILURE', 'DISK_RESIZE', 'DISK_RESIZE_POWEROFF', 'DISK_RESIZE_UNDEPLOYED'
]
