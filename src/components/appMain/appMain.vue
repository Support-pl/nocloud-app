<template>
  <div class="application">
    <a-layout>
      <a-layout-header :style="{'background-color': 'var(--main)', color: 'var(--bright_font)', padding: 0}">
        <app-header />
      </a-layout-header>

      <a-layout-content :style="{'background-color': 'var(--bright_bg)', 'position': 'relative'}">
        <transition name="main-frame-anim">
          <router-view class="frame" />
        </transition>
      </a-layout-content>

      <a-layout-footer v-if="user" style="padding: 0">
        <app-footer />
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import store from '@/store'
import router from '@/router'
import { useAppStore } from '@/stores/app.js'
import appFooter from '@/components/appMain/appFooter.vue'
import appHeader from '@/components/appMain/appHeader.vue'

const appStore = useAppStore()

const user = computed(() =>
  store.getters['nocloud/auth/isLoggedIn']
)

router.onReady(() => {
  appStore.setTabByNameNoRoute(router.currentRoute.name)
})
router.beforeEach((to, _, next) => {
  appStore.setTabByNameNoRoute(to.name)
  next()
})
</script>

<script>
export default { name: 'AppMain' }
</script>

<style>
.application {
  height: 100%;
  overflow: hidden;
}

.ant-layout {
  height: 100%;
}

.container {
  position: relative;
  max-width: 768px;
  min-height: 100%;
  margin: 0 auto;
}

.frame{
  position: absolute;
  height: 100%;
  width: 100%;
  overflow-y: auto;
}

.main-frame-anim-enter-active,
.main-frame-anim-leave-active {
  transition: all .25s ease;
}

.main-frame-anim-enter {
  transform: translateY(-0.5em);
  opacity: 0;
}

.main-frame-anim-leave-to {
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
