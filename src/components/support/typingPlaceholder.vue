<template>
  <div class="text" style="margin-top: auto">
    {{ capitalize(text) }}
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const i18n = useI18n()

const elipsis = ref(0)
setInterval(() => {
  if (elipsis.value > 2) elipsis.value = 0
  else elipsis.value++
}, 500)

const text = computed(() =>
  `${i18n.t('bot is typing')}${'.'.repeat(elipsis.value)}`
)
</script>

<style scoped>
.text {
  animation: glowing 1s linear infinite alternate;
}

@keyframes glowing {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}
</style>
