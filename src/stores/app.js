import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import router from '@/router'
/*
ROUTER WORKS THERE!
*/
export const useAppStore = defineStore('app', () => {
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

  const buttons = [
    // {
    //  icon: 'database',
    //  title: 'cloud',
    //  theme: 'filled'
    // },
    {
      icon: 'appstore',
      title: 'services',
      theme: 'outlined'
    },
    {
      icon: 'message',
      title: 'support',
      theme: 'outlined'
    },
    {
      icon: 'fund',
      title: 'billing',
      theme: 'outlined'
    },
    {
      icon: 'setting',
      title: 'settings',
      theme: 'filled'
    }
  ]

  function date (timestamp, sep = '.', withTime = true, reverse) {
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
    date,
    update,
    buttons,
    activeTab,
    notification,
    isMaintananceMode,

    setTabByName (value) {
      if (value === 'root') value = 'services'
      activeTabName.value = value
      activeTabNum.value = buttons.findIndex(({ title }) => title === value)

      if (router.currentRoute.name !== activeTab.title || Object.keys(router.currentRoute.query).length > 0) {
        router.push({ name: activeTab.title })
      }
      console.log(activeTab.title)
    },

    setTabByNum (value) {
      activeTabNum.value = value
      activeTabName.value = buttons[value].title

      if (router.currentRoute.name !== activeTab.title) {
        router.push({ name: activeTab.title })
      }
    },

    setTabByNameNoRoute (value) {
      if (value === 'root') value = 'services'
      activeTabName.value = value
      activeTabNum.value = buttons.findIndex(({ title }) => title === value)
    }
  }
})
