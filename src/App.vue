<template>
  <div
    id="app"
    :style="false && cssVars"
    :class="{ 'block-page': notification }"
  >
    <transition name="slide">
      <router-view
        :style="{
          position: 'absolute',
          width: '100%',
          height: '100%',
          minHeight: (loggedIn) ? 'auto' : '100vh'
        }"
      />
    </transition>
    <update-notification />
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import updateNotification from '@/widgets/updateNotification/index.vue'
import store from '@/app/store'
import router from '@/app/router'
import i18n from '@/app/i18n'
import config from '@/shared/config/appconfig'

const notification = computed(() =>
  store.getters['app/getNotification']
)

watch(notification, (value) => {
  if (!value) return
  setTimeout(() => {
    const elements = document.querySelectorAll('.ant-notification-notice-close')
    const closeIcons = Array.from(elements)

    const open = () => {
      if (closeIcons.length > 1) closeIcons.pop()
      else store.commit('app/setNotification', false)
    }

    closeIcons.forEach((el) => { el.addEventListener('click', open) })
  }, 100)
})

const loggedIn = computed(() =>
  store.getters['nocloud/auth/isLoggedIn']
)

window.addEventListener('message', ({ data, origin }) => {
  if (!origin.includes('https://api.')) return
  store.commit('nocloud/auth/setToken', data)
  sessionStorage.removeItem('user')
  location.reload()
})

store.dispatch('nocloud/auth/load')
router.beforeEach((to, _, next) => {
  const mustBeLoggined = to.matched.some((el) => !!el.meta?.mustBeLoggined)

  if (mustBeLoggined && !loggedIn.value) {
    next({ name: 'login' })
  } else if (to.name === 'login' && loggedIn.value) next({ name: 'root' })
  else next()
})

const lang = localStorage.getItem('lang')
if (lang !== undefined) i18n.locale = lang
if (loggedIn.value) {
  store.dispatch('nocloud/auth/fetchUserData')
} else {
  sessionStorage.removeItem('user')
}

const cssVars = computed(() =>
  Object.fromEntries(
    Object.entries(config.colors).map(([key, val]) => [
      `--${key}`,
      val
    ])
  )
)

onMounted(() => {
  router.onReady(() => {
    const route = router.currentRoute
    const mustBeLoggined = route.matched.some((el) => !!el.meta?.mustBeLoggined)

    if (mustBeLoggined && !loggedIn.value) {
      router.replace('login')
    }
  })

  document.title = 'Cloud'
  document.body.setAttribute('style',
    Object.entries(cssVars.value).map(([k, v]) => `${k}:${v}`).join(';')
  )
})
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
