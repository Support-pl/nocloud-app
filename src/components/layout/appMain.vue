<template>
  <div class="application">
    <a-layout>
      <a-layout-header
        v-if="route.query.fullscreen !== 'true'"
        :style="{
          padding: 0,
          color: 'var(--gloomy_font)',
          backgroundColor: 'var(--main)',
        }"
      >
        <app-header v-model:is-button-visible="isButtonsVisible" />
      </a-layout-header>

      <a-layout-content
        :style="{ position: 'relative', backgroundColor: 'var(--bright_bg)' }"
      >
        <router-view
          v-slot="{ Component }"
          class="frame"
          :style="{ paddingTop: isButtonsVisible ? '50px' : null }"
        >
          <transition name="main-frame-anim">
            <component :is="Component" />
          </transition>
        </router-view>
      </a-layout-content>

      <a-layout-footer
        v-if="authStore.isLogged && !route.meta.isFooterHided"
        style="padding: 0"
      >
        <app-footer />
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app.js";
import { useAuthStore } from "@/stores/auth.js";
import appFooter from "@/components/layout/appFooter.vue";
import appHeader from "@/components/layout/appHeader.vue";

const router = useRouter();
const route = useRoute();

const appStore = useAppStore();
const authStore = useAuthStore();
const isButtonsVisible = ref(false);

router.isReady().then(() => {
  appStore.setTabByNameNoRoute(route.name);
});
router.beforeEach((to, _, next) => {
  appStore.setTabByNameNoRoute(to.name);
  next();
});
</script>

<script>
export default { name: "AppMain" };
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
  transition: all 0.25s ease;
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
