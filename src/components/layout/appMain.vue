<template>
  <div class="application">
    <a-layout>
      <a-layout-header :style="{'background-color': 'var(--main)', color: 'var(--bright_font)', padding: 0}">
        <app-header />
      </a-layout-header>

      <a-layout-content :style="{'background-color': 'var(--bright_bg)', 'position': 'relative'}">
        <router-view v-slot="{ Component }" class="frame">
          <transition name="main-frame-anim">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>

      <a-layout-footer v-if="authStore.isLogged" style="padding: 0">
        <app-footer />
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import appFooter from '@/components/layout/appFooter.vue'
import appHeader from '@/components/layout/appHeader.vue'

const router = useRouter()
const route = useRoute()

const appStore = useAppStore()
const authStore = useAuthStore()

router.isReady().then(() => {
  appStore.setTabByNameNoRoute(route.name)
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

.main-frame-anim-enter-from {
  transform: translateY(-0.5em);
  opacity: 0;
}

.main-frame-anim-leave-to {
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
