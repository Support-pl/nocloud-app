<template>
  <div class="application">
    <a-layout>
      <a-layout-header
        :style="{
          padding: 0,
          color: 'var(--bright_font)',
          backgroundColor: 'var(--main)'
        }"
      >
        <app-header v-model:is-button-visible="isButtonsVisible" />
      </a-layout-header>

      <a-layout-content
        :style="{
          position: 'relative',
          backgroundColor: 'var(--bright_bg)'
        }"
      >
        <router-view
          v-slot="{ Component }"
          class="frame"
          :style="{ paddingTop: (isButtonsVisible) ? '50px' : null }"
        >
          <transition name="main-frame-anim">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>

      <a-layout-footer style="padding: 0">
        <app-footer v-if="authStore.isLogged" />
        <div v-else-if="route.name === 'services'" class="logo__wrapper">
          <div v-if="!config.appLogo.path">
            <img :src="config.appLogo.path" alt="logo" style="width: 100%">
          </div>
          <div v-if="companyName" class="logo__title">
            {{ companyName }}
          </div>
        </div>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import config from '@/appconfig.js'
import appFooter from '@/components/layout/appFooter.vue'
import appHeader from '@/components/layout/appHeader.vue'

const router = useRouter()
const route = useRoute()

const appStore = useAppStore()
const authStore = useAuthStore()
const isButtonsVisible = ref(false)

const companyName = computed(() =>
  appStore.domainInfo.name ?? config.appTitle
)

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

<style scoped>
.application {
  height: 100%;
  overflow: hidden;
}

.frame {
  position: absolute;
  height: 100%;
  width: 100%;
  overflow-y: auto;
}

.logo__wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 40vh;
  padding: 10px;
  background: var(--main);
}

.logo__title {
  color: var(--bright_font);
  font-size: 36px;
  font-weight: 700;
}
</style>

<style>

.ant-layout {
  height: 100%;
}

.container {
  position: relative;
  max-width: 768px;
  min-height: 100%;
  margin: 0 auto;
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
