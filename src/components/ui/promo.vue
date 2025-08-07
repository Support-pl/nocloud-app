<template>
  <div
    v-if="isPromoVisible"
    :class="{ order__field: !noWrapper }"
    :style="isBitrixApps ? { padding: 0, overflow: 'hidden' } : null"
  >
    <editor-container :value="promo" />
  </div>
</template>

<script setup>
import { computed, nextTick, watchEffect } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { EditorContainer } from "nocloud-ui";
import { useSpStore } from "@/stores/sp.js";
import { storeToRefs } from "pinia";

const props = defineProps({ noWrapper: { type: Boolean, default: false } });

const route = useRoute();
const i18n = useI18n();
const spStore = useSpStore();
const { getShowcases } = storeToRefs(spStore);

const url =
  "https://support.pl/licencje/oferta-specjalna/?utm_source=cloud&utm_medium=banner&utm_campaign=special-offer";

const showcase = computed(() =>
  getShowcases.value.find(({ uuid }) => uuid === route.query.service)
);

const isBitrixApps = computed(() => route.query.service === "Bitrix24 Apps");

const isPromoVisible = computed(() => {
  if (isBitrixApps.value) return true;
  console.log(
    showcase.value.promo[i18n.locale.value]?.previewEnable ||
      showcase.value.promo["en"]?.previewEnable
  );

  return (
    showcase.value?.promo &&
    (showcase.value.promo[i18n.locale.value]?.previewEnable ||
      showcase.value.promo["en"]?.previewEnable)
  );
});

const promo = computed(() => {
  if (isBitrixApps.value) {
    return `
      <a href="${url}" target="_blank">
        <img
          id="promo"
          style="width: 100%"
          src="img/icons/bitrix-apps-${i18n.locale.value}.webp"
          alt="Bitrix Apps"
        >
      </a>
    `;
  }
  return (
    showcase.value.promo[i18n.locale.value]?.preview ||
    showcase.value.promo["en"]?.preview
  );
});

watchEffect(async () => {
  await nextTick();
  document.getElementById("promo")?.addEventListener("error", onError);
});

function onError({ target }) {
  target.src = "img/icons/bitrix-apps-en.webp";
}
</script>

<script>
export default { name: "PromoBlock" };
</script>

<style scoped>
.order__field {
  height: max-content;
  padding: 10px 15px;
  overflow-x: scroll;
  border-radius: 20px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
  background-color: var(--bright_font);
}

.order__field :deep(p) {
  margin-bottom: 0;
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
