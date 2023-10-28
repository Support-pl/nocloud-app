<template>
  <div class="footer">
    <div class="container">
      <div class="footer__content">
        <div
          v-for="(button, index) in filteredButtons"
          :key="index"
          class="button"
          :class="{ active: button.title === active }"
          @click="appStore.setTabByName(button.title)"
        >
          <div class="button__icon">
            <a-icon :type="button.icon" :theme="button.theme" />
          </div>
          <div class="button__title">
            {{ $t(button.title) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import router from '@/router'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'

const appStore = useAppStore()
const authStore = useAuthStore()

const active = computed(() => {
  const { footerTitle } = router.currentRoute.meta ?? {}
  const { layoutTitle } = router.currentRoute.meta ?? {}

  if (footerTitle) return footerTitle
  if (layoutTitle) return layoutTitle
  return appStore.activeTab.title
})

const filteredButtons = computed(() =>
  appStore.buttons.filter(({ title }) => {
    if (title === 'root') title = 'services'
    if (!authStore.billingUser.roles) return true

    switch (title) {
      case 'billing':
        return authStore.billingUser.roles?.invoice

      case 'settings':
        return true

      default:
        if (!(title in authStore.billingUser.roles)) return true
        return authStore.billingUser.roles[title]
    }
  })
)
</script>

<script>
export default { name: 'AppFooter' }
</script>

<style scoped>

.footer{
  background-color:  var(--bright_bg);
  position: relative;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, .2);
  user-select: none;
}

.footer__content{
  display: flex;
  position: relative;
}

.button{
  flex: 1 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  z-index: 2;
  padding: 5px;
}

.button__title{
  transition: transform .2s .1s ease;
}

.button__icon{
  font-size: 1.2rem;
  color: var(--gray);
  position: relative;
  z-index: 2;
  translate: color .2s ease;
  transition: transform .2s ease;
}

.button:hover .button__icon{
  filter: brightness(0.8517);
}
.footer__active{
  background-color: var(--main);
  height: 52px;
  width: 52px;
  position: absolute;
  top: -30px;
  left: 47px;
  border-radius: 50%;
  z-index: 2;
  color: var(--bright_font);
  transform: translateX(-50%);
}

.footer__active::before{
  content: '';
  display: block;
  width: 60px;
  height: 60px;
  background-color: var(--bright_bg);
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%,-50%);
  z-index: 1;
  box-shadow: 0px 0px 15px rgba(0, 0, 0, .2);
}

.button.active{
  background-color: var(--main);
}

.button.active .button__icon{
  color: var(--bright_font);
}

.button.active .button__title{
  color: var(--bright_font);
}
</style>
