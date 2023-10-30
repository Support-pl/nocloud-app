import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useI18n } from 'vue-i18n'

import cookies from 'js-cookie'
import api from '@/api.js'
import config from '@/appconfig.js'

const COOKIES_NAME = 'noCloudinApp-token'

export const useAuthStore = defineStore('auth', () => {
  const i18n = useI18n()

  const token = ref('')
  const userdata = ref({})
  const billingUser = ref({})

  const loginButtons = ref([])
  const baseURL = `${config.WHMCSsiteurl}/modules/addons/nocloud/api/index.php`
  const isLogged = computed(() =>
    token.value.length > 0
  )

  function setToken (value) {
    const expires = new Date(Date.now() + 7776e6)

    token.value = value
    cookies.set(COOKIES_NAME, value, { expires })
  }

  return {
    token,
    userdata,
    billingUser,

    baseURL,
    isLogged,
    loginButtons,
    setToken,

    async login ({ login, password, type, uuid }) {
      try {
        const response = await api.authorizeCustom({
          auth: { type, data: [login, password] },
          exp: Math.round((Date.now() + 7776e6) / 1000),
          uuid
        })

        api.applyToken(response.token)
        setToken(response.token)

        return response
      } catch (error) {
        return error
      }
    },

    logout () {
      if (!isLogged.value) return

      setToken('')
      const config = localStorage.getItem('globalConfig')
      const lang = localStorage.getItem('lang') ?? i18n.locale

      localStorage.clear()
      localStorage.setItem('globalConfig', config)
      localStorage.setItem('lang', lang)

      cookies.remove(COOKIES_NAME)
      location.reload()
    },

    load () {
      const getToken = cookies.get(COOKIES_NAME)
      if (getToken) {
        api.axios.defaults.headers.common.Authorization = 'Bearer ' + getToken
        token.value = getToken
      }
    },

    async fetchUserData (update) {
      if (userdata.value.uuid && !update) {
        return userdata.value
      }

      try {
        const response = await api.accounts.get('me')

        userdata.value = response
        return response
      } catch (error) {
        return error
      }
    },

    async fetchBillingData (update) {
      if (billingUser.value.firstname && !update) {
        return billingUser.value
      }

      try {
        const response = await api.get(
          baseURL, { params: { run: 'client_detail' } })

        if (!response.id) response.id = 'none'
        billingUser.value = response

        return response
      } catch (error) {
        return error
      }
    },

    async addSSH (data) {
      try {
        const response = await api.accounts.update(data.id, data.body)

        userdata.value = response.pool
        return response
      } catch (error) {
        return error
      }
    },

    async fetchAuth () {
      try {
        const response = await api.get('/oauth')

        loginButtons.value = response
        return response
      } catch (error) {
        return error
      }
    },

    async linkAccount (type) {
      try {
        const { url } = await api.get(`/oauth/${type}/link`, {
          params: {
            state: Math.random().toString(16).slice(2),
            redirect: `https://${location.host}/login`
          }
        })

        location.assign(url)
      } catch (error) {
        return error
      }
    }
  }
})
