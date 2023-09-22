import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import cookies from 'js-cookie'
import config from '@/appconfig.js'
import api from '@/api.js'

const COOKIES_NAME = 'noCloudinApp-token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref('')
  const userdata = ref({})
  const billingUser = ref({})

  const currencies = ref([])
  const defaultCurrency = ref('USD')
  const unloginedCurrency = ref('USD')

  const baseURL = `${config.WHMCSsiteurl}/modules/addons/nocloud/api/index.php`
  const isLoggedIn = computed(() =>
    token.value.length > 0
  )

  function setToken (value) {
    const expires = new Date(Date.now() + 7776e6)

    token.value = token
    cookies.set(COOKIES_NAME, value, { expires })
  }

  function setCurrencies (rates) {
    currencies.value = rates.map((el) => ({ ...el, id: `${el.from} ${el.to}` }))
  }

  function setDefaultCurrency (currencies) {
    const currency = currencies.find((el) =>
      el.rate === 1 && [el.from, el.to].includes('NCU')
    )

    if (!currency) return
    defaultCurrency.value = (currency.from === 'NCU') ? currency.to : currency.from
  }

  return {
    token,
    userdata,
    billingUser,

    currencies,
    defaultCurrency,
    unloginedCurrency,

    baseURL,
    isLoggedIn,

    setToken,
    setCurrencies,
    setDefaultCurrency,

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
      setToken('')
      const config = localStorage.getItem('globalConfig')
      const lang = localStorage.getItem('lang')

      localStorage.clear()
      localStorage.setItem('globalConfig', config)
      localStorage.setItem('lang', lang)

      cookies.remove(COOKIES_NAME)
      location.reload()
    },

    load () {
      const token = cookies.get(COOKIES_NAME)
      if (token) {
        api.axios.defaults.headers.common.Authorization = 'Bearer ' + token
        setToken(token)
      }
    },

    async fetchUserData () {
      if (userdata.value.uuid) {
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

    async fetchBillingData () {
      if (billingUser.value.id) {
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

    async fetchCurrencies () {
      try {
        const response = await api.get('/billing/currencies/rates')

        setCurrencies(response.rates)
        setDefaultCurrency(response.rates)

        return response
      } catch (error) {
        return error
      }
    },

    async addSSH (data) {
      try {
        const response = await api.accounts.update(data.id, data.body)

        userdata.value = response.pool
      } catch (error) {
        return error
      }
    }
  }
})
