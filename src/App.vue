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
          minHeight: (isLogged) ? 'auto' : '100vh'
        }"
      />
    </transition>
    <update-notification />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import store from '@/store'
import router from '@/router'
import i18n from '@/i18n.js'
import api from '@/api.js'
import config from '@/appconfig.js'
import { useAppStore } from '@/stores/app.js'
import updateNotification from '@/components/updateNotification/index.vue'

const route = router.currentRoute
const appStore = useAppStore()

const user = computed(() =>
  store.getters['nocloud/auth/billingData']
)

watch(user, (value) => {
  const isServicesExist = value.roles && !value.roles.services

  if (isServicesExist && ['root', 'services'].includes(route.name)) {
    router.replace('settings')
  }
})

const isLogged = computed(() =>
  store.getters['nocloud/auth/isLoggedIn']
)

function isRouteExist (name) {
  if (name === 'root') name = 'services'
  if (!user.value.roles) return true

  switch (name) {
    case 'billing':
      return user.value.roles?.invoice

    case 'settings':
      return true

    default:
      if (!(name in user.value.roles)) return true
      return user.value.roles[name]
  }
}

function redirectByType ({ uuid, type }) {
  switch (type) {
    case 'ovh':
    case 'ione':
      router.replace({ name: 'openCloud_new', params: { uuid } })
      break

    default:
      router.replace({ name: 'service', params: { id: uuid } })
      break
  }
}

window.addEventListener('message', ({ data, origin }) => {
  if (!origin.includes('https://api.')) return
  api.applyToken(data.token)
  store.commit('nocloud/auth/setToken', data.token)
  store.dispatch('nocloud/auth/load')

  if (data.uuid) redirectByType(data)
  else if (router.currentRoute.name?.includes('login')) {
    router.replace({ name: 'root' })
  }

  store.dispatch('nocloud/auth/fetchUserData')
  store.dispatch('nocloud/auth/fetchBillingData')
})

onMounted(() => {
  if (!window.opener) return
  window.opener.postMessage('ready', '*')
  window.opener = null
})

store.dispatch('nocloud/auth/load')

router.beforeEach((to, _, next) => {
  const mustBeLoggined = to.matched.some((el) => !!el.meta?.mustBeLoggined)

  if (mustBeLoggined && !isLogged.value) {
    next({ name: 'login' })
  } else if (!isRouteExist(to.name)) {
    if (!user.value.roles?.services) {
      next({ name: 'settings' })
    } else {
      next({ name: 'root' })
    }
  } else if (to.name === 'login' && isLogged.value) {
    next({ name: 'root' })
  } else next()
})

const lang = route.query.lang ?? localStorage.getItem('lang')

if (lang) i18n.locale = lang
if (isLogged.value) {
  store.dispatch('nocloud/auth/fetchUserData')
}

onMounted(() => {
  router.onReady(() => {
    const route = router.currentRoute

    if (route.meta?.mustBeLoggined && !isLogged.value) {
      router.replace('login')
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
