<template>
  <div
    class="loading"
    :style="{ color, height: (ha) ? 'auto' : null }"
  >
    <loading-icon />
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import config from '@/appconfig.js'

const loadingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoadingOutlined')
)

defineProps({
  color: { type: String, default: () => config.colors.main },
  ha: { type: Boolean, default: false }
})
</script>

<script>
export default { name: 'LoadingView' }
</script>

<style scoped>
.loading {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 3rem;
}
</style>
