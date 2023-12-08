<template>
  <div v-if="isPromoVisible" class="order__field" :style="(isBitrixApps) ? 'padding: 0' : null">
    <editor-container :value="promo" />
  </div>
</template>

<script setup>
import { computed, nextTick, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { EditorContainer } from 'nocloud-ui'
import { useSpStore } from '@/stores/sp.js'

const route = useRoute()
const i18n = useI18n()
const spStore = useSpStore()

const showcase = computed(() =>
  spStore.getShowcases.find(({ uuid }) => uuid === route.query.service)
)

const isBitrixApps = computed(() =>
  route.query.service === 'Bitrix24 Apps'
)

const isPromoVisible = computed(() => {
  if (isBitrixApps.value) return true
  return showcase.value?.promo && showcase.value.promo[i18n.locale.value]?.previewEnable
})

const promo = computed(() => {
  if (isBitrixApps.value) {
    return `
      <a href="https://support.pl/licencje/oferta-specjalna/" target="_blank">
        <img
          id="promo"
          style="width: 100%"
          src="img/icons/bitrix-apps-${i18n.locale.value}.webp"
          alt="Bitrix Apps"
        >
      </a>
    `
  }
  return showcase.value.promo[i18n.locale.value]?.preview
})

watchEffect(async () => {
  await nextTick()
  document.getElementById('promo').addEventListener('error', onError)
})

function onError ({ target }) {
  target.src = 'img/icons/bitrix-apps-en.webp'
}
</script>

<script>
export default { name: 'PromoBlock' }
</script>

<style scoped>
.order__field {
  height: max-content;
  padding: 10px 15px;
  overflow-x: scroll;
  border-radius: 20px;
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
  background-color: var(--bright_font);
}

@media screen and (max-width: 1024px) {
  .order__field {
    box-shadow: none;
    flex-grow: 0;
  }
  .order__calculate {
    width: auto;
    border-radius: 0 0 20px 20px;
  }
}
</style>
