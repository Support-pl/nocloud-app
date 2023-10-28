<template>
  <div
    id="app"
    :style="false && cssVars"
    :class="{ 'block-page': appStore.notification }"
  >
    <transition name="slide">
      <router-view
        :style="{
          position: 'absolute',
          width: '100%',
          height: '100%',
          minHeight: (authStore.isLogged) ? 'auto' : '100vh'
        }"
      />
    </transition>
    <update-notification />

    <add-funds
      v-if="modal.visible"
      :sum="modal.amount"
      :modal-visible="modal.visible"
      :hide-modal="() => modal.visible = false"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, provide, ref, watch } from 'vue'
import { Modal } from 'ant-design-vue'

import router from '@/router'
import i18n from '@/i18n'
import api from '@/api.js'
import config from '@/appconfig.js'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'

import addFunds from '@/components/ui/addFunds.vue'
import updateNotification from '@/components/ui/updateNotification.vue'

const route = router.currentRoute
const appStore = useAppStore()
const authStore = useAuthStore()

watch(() => authStore.billingUser, (value) => {
  const isServicesExist = value.roles && !value.roles.services

  if (isServicesExist && ['root', 'services'].includes(route.name)) {
    router.replace('settings')
  }
})

const modal = ref({
  amount: 0, visible: false
})
provide('checkBalance', checkBalance)

function checkBalance (price = 0) {
  if (authStore.userdata.balance < parseFloat(price)) {
    Modal.confirm({
      title: i18n.t('You do not have enough funds on your balance'),
      content: i18n.t('Click OK to replenish the account with the missing amount'),
      onOk: () => {
        modal.value.amount = Math.ceil(
          parseFloat(price) - authStore.userdata.balance
        )
        modal.value.visible = true
      }
    })
    return false
  }
  return true
}

function isRouteExist (name) {
  if (name === 'root') name = 'services'
  if (!authStore.billingUser.roles) return true

  switch (name) {
    case 'billing':
      return authStore.billingUser.roles?.invoice

    case 'settings':
      return true

    default:
      if (!(name in authStore.billingUser.roles)) {
        return true
      }
      return authStore.billingUser.roles[name]
  }
}

function redirectByType ({ uuid, type }) {
  switch (type) {
    case 'ovh':
    case 'ione':
      router.replace({ name: 'openCloud', params: { uuid } })
      break

    default:
      router.replace({ name: 'service', params: { id: uuid } })
      break
  }
}

window.addEventListener('message', ({ data, origin }) => {
  if (!origin.includes('https://api.')) return
  api.applyToken(data.token)
  authStore.setToken(data.token)
  authStore.load()

  if (data.uuid) redirectByType(data)
  else if (router.currentRoute.name?.includes('login')) {
    router.replace({ name: 'root' })
  }

  authStore.fetchUserData()
  authStore.fetchBillingData()
})

onMounted(() => {
  if (!window.opener) return
  window.opener.postMessage('ready', '*')
  window.opener = null
})

router.beforeEach((to, _, next) => {
  const mustBeLoggined = to.matched.some((el) => !!el.meta?.mustBeLoggined)

  if (mustBeLoggined && !authStore.isLogged) {
    next({ name: 'login' })
  } else if (!isRouteExist(to.name)) {
    if (!authStore.billingUser.roles?.services) {
      next({ name: 'settings' })
    } else {
      next({ name: 'root' })
    }
  } else if (to.name === 'login' && authStore.isLogged) {
    next({ name: 'root' })
  } else next()
})

const lang = route.query.lang ?? localStorage.getItem('lang')

authStore.load()
if (lang) i18n.locale = lang
if (authStore.isLogged) authStore.fetchUserData()

onMounted(() => {
  router.onReady(async () => {
    const route = router.currentRoute
    const mustUnloggined = route.meta?.mustBeUnloggined && authStore.isLogged
    const isIncluded = ['cabinet', 'settings'].includes(route.name)
    const { firstname } = await authStore.fetchBillingData()

    if (firstname && localStorage.getItem('oauth')) {
      localStorage.removeItem('oauth')
    }

    if (route.meta?.mustBeLoggined && !authStore.isLogged) {
      router.replace('login')
    } else if (localStorage.getItem('oauth') && !isIncluded) {
      router.replace('cabinet')
    } else if (mustUnloggined) {
      router.replace('/')
    }

    if (!route.query.lang) return
    if (route.query.lang !== i18n.locale) {
      i18n.locale = route.query.lang
    }
  })

  document.title = 'Cloud'
  document.body.setAttribute('style',
    Object.entries(cssVars.value).map(([k, v]) => `${k}:${v}`).join(';')
  )
})

watch(() => appStore.notification, (value) => {
  if (!value) return
  setTimeout(() => {
    const elements = document.querySelectorAll('.ant-notification-notice-close')
    const close = Array.from(elements)
    const open = () => {
      if (close.length > 1) close.pop()
      else appStore.notification = false
    }

    close.forEach((el) => { el.addEventListener('click', open) })
  }, 100)
})

const cssVars = computed(() =>
  Object.fromEntries(
    Object.entries(config.colors).map(
      ([key, value]) => [`--${key}`, value]
    )
  )
)
</script>

<script>
export default { name: 'App' }
</script>

<style>
html {
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: inherit;
}

html,
body {
  padding: 0;
  margin: 0;
  height: 100%;
}

#app {
  height: 100%;
}

.block-page::before {
  content: '';
  position: absolute;
  z-index: 1001;
  height: 100%;
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
}

.slide-enter-active,
.slide-leave-active {
  /* transition: transform .5s; */
  transition: opacity 0.5s ease;
}
.slide-enter,
.slide-leave-to {
  /* transform: translateX(100%); */
  opacity: 0;
}
/* .slide-leave-to {
  transform: translateX(-100%);
} */
</style>
