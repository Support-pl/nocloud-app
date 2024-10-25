import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { defineStore } from 'pinia'
import { AppstoreOutlined, DatabaseFilled, FundOutlined, MessageOutlined, SettingFilled } from '@ant-design/icons-vue'
import { createConnectTransport } from '@connectrpc/connect-web'

import { useAuthStore } from './auth.js'
import config from '@/appconfig.js'
/*
ROUTER WORKS THERE!
*/
export const useAppStore = defineStore('app', () => {
  const router = useRouter()
  const route = useRoute()
  const auth = useAuthStore()

  const transport = createConnectTransport({
    baseUrl: (VUE_APP_BASE_URL.endsWith('/') ? VUE_APP_BASE_URL : `${VUE_APP_BASE_URL}/`),
    useBinaryFormat: import.meta.env.PROD,
    interceptors: [
      (next) => (req) => {
        if(auth.token){
          req.header.set('Authorization', `Bearer ${auth.token}`)
        }
        return next(req)
      }
    ]
  })

  const notification = ref(false)
  const activeTabName = ref('')
  const activeTabNum = ref(-1)

  const isButtonsVisible = ref(true)
  const isMaintananceMode = ref(false)
  const update = ref({
    worker: null,
    status: false
  })
  const activeTab = reactive({
    title: activeTabName,
    index: activeTabNum
  })

  const onLogin = ref({
    redirect: null,
    action: null,
    info: null
  })
  const domainInfo = reactive({
    settings: ref({
      avaliable: Object.keys(config.services).map((el) => el.toLowerCase())
    })
  })

  const buttons = computed(() =>
    (isButtonsVisible.value)
      ? [
          { icon: DatabaseFilled, title: 'cloud' },
          { icon: AppstoreOutlined, title: 'services' },
          { icon: MessageOutlined, title: 'support' },
          { icon: FundOutlined, title: 'billing' },
          { icon: SettingFilled, title: 'settings' }
        ]
      : []
  )

  function toDate (timestamp, sep = '.', withTime = true, reverse) {
    if (timestamp < 1) return '-'

    const date = new Date(timestamp * 1000)
    const time = date.toTimeString().split(' ')[0]

    const year = date.getFullYear()
    let month = date.getMonth() + 1
    let day = date.getDate()

    if (`${month}`.length < 2) month = `0${month}`
    if (`${day}`.length < 2) day = `0${day}`

    let result = `${day}${sep}${month}${sep}${year}`

    if (reverse) {
      result = `${year}${sep}${month}${sep}${day}`
    }
    if (withTime) result += ` ${time}`

    return result
  }

  return {
    toDate,
    update,
    onLogin,
    buttons,
    activeTab,
    notification,
    isMaintananceMode,
    isButtonsVisible,
    domainInfo,
    transport,

    setTabByName (value) {
      if (['root', 'openVDC'].includes(value)) value = 'services'

      activeTabName.value = value
      activeTabNum.value = buttons.value.findIndex(({ title }) => title === value)

      if (route.name !== activeTab.title || Object.keys(route.query).length > 0) {
        router.push({ name: activeTab.title })
      }
      console.log(activeTab.title)
    },

    setTabByNum (value) {
      activeTabNum.value = value
      activeTabName.value = buttons[value].title

      if (route.name !== activeTab.title) {
        router.push({ name: activeTab.title })
      }
    },

    setTabByNameNoRoute (value) {
      if (['root', 'openVDC'].includes(value)) value = 'services'

      activeTabName.value = value
      activeTabNum.value = buttons.value.findIndex(({ title }) => title === value)
    },

    clearOnLogin () {
      onLogin.value = {
        action: null, info: null, redirect: null
      }
    }
  }
})
