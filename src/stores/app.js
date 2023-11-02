import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { defineStore } from 'pinia'
import { AppstoreOutlined, FundOutlined, MessageOutlined, SettingFilled } from '@ant-design/icons-vue'
import config from '@/appconfig.js'
/*
ROUTER WORKS THERE!
*/
export const useAppStore = defineStore('app', () => {
  const router = useRouter()
  const route = useRoute()

  const notification = ref(false)
  const activeTabName = ref('')
  const activeTabNum = ref(-1)

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

  const buttons = (localStorage.getItem('oauth'))
    ? []
    : [
        // {
        //  icon: 'database',
        //  title: 'cloud',
        //  theme: 'filled'
        // },
        { icon: AppstoreOutlined, title: 'services' },
        { icon: MessageOutlined, title: 'support' },
        { icon: FundOutlined, title: 'billing' },
        { icon: SettingFilled, title: 'settings' }
      ]

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
    domainInfo,

    setTabByName (value) {
      if (['root', 'openVDC'].includes(value)) value = 'services'

      activeTabName.value = value
      activeTabNum.value = buttons.findIndex(({ title }) => title === value)

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
      activeTabNum.value = buttons.findIndex(({ title }) => title === value)
    },

    clearOnLogin () {
      onLogin.value = {
        action: null, info: null, redirect: null
      }
    }
  }
})
