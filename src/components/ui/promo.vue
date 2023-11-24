<template>
  <div v-if="isPromoVisible" class="order__field">
    <editor-container :value="showcase.promo[$i18n.locale]?.preview" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
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

const isPromoVisible = computed(() =>
  showcase.value?.promo && showcase.value.promo[i18n.locale.value]?.previewEnable
)
</script>

<script>
export default { name: 'PromoPage' }
</script>

<style scoped>
.order__field {
  height: max-content;
  padding: 10px 15px;
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
