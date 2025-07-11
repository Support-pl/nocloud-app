<template>
  <div style="position: relative">
    <div
      :class="{
        service__item: true,
        service__icon_colored: !!service.meta?.iconColor,
      }"
      :style="{
        color: service.meta?.iconColor,
        fill: service.meta?.iconColor,
      }"
      @click="onClick"
    >
      <div
        :class="{
          service__icon: true,
          service__icon_colored: !!service.meta?.iconColor,
        }"
      >
        <component
          :two-tone-color="service.meta?.iconColor"
          :is="service.icon"
          v-if="!isIconString"
        />

        <a-icon v-else>
          <template #component="svgProps">
            <nc-icon :icon-name="service.icon" v-bind="svgProps" />
          </template>
        </a-icon>
      </div>
      <div class="service__title">
        {{ translatedName }}
      </div>
    </div>
    <div v-if="service.meta?.isNew" style="position: absolute; top: 5px; right: 15px">
      <span class="badge-new">New</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import AIcon from "@ant-design/icons-vue";
import { NcIcon } from "nocloud-ui";
import { useAuthStore } from "@/stores/auth.js";

const props = defineProps({
  service: { type: Object, required: true },
  productsCount: { type: Function, required: true },
});

const i18n = useI18n();
const authStore = useAuthStore();

const isIconString = computed(() => typeof props.service.icon === "string");

const translatedName = computed(() => {
  const { title } = (props.service.promo ?? {})[i18n.locale.value] ?? {};

  if (title) return title;
  if (props.service.translatable) {
    return i18n.t(props.service.title);
  }
  return props.service.title;
});

function onClick(e) {
  const type = props.service.onclick.paramsArr[0].query.service;
  const isCountZero = props.productsCount(type, true) === 0;

  if (authStore.isLogged && !isCountZero) e.stopPropagation();
  else return;

  props.service.onclick.function(...props.service.onclick.paramsArr);
}
</script>

<script>
export default { name: "ServiceItem" };
</script>

<style>
.service__item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* .service__item:not(:last-of-type){
  margin-right: 10px;
} */

.service__item:hover {
  background-color: var(--bright_font);
  color: var(--main);
}

.service__icon {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  margin-bottom: 3px;
}

.service__title {
  text-align: center;
  word-break: break-word;
}

.service__icon_colored .cls-1 {
  fill: var(--main) !important;
}

.service__icon_colored .cls-2 {
  fill: inherit;
}

.service__icon_colored g path {
  fill: inherit !important;
}

.service__item_colored * {
  fill: inherit !important;
}

.badge-new {
  display: inline-block;
  background: linear-gradient(135deg, #FF416C, #FF4B2B);
  color: white;
  font-weight: 700;
  font-size: 0.6rem;
  padding: 0.25em 0.6em;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(255,75,43,0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  user-select: none;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  transition: background 0.3s ease;
}

.badge-new:hover {
  background: linear-gradient(135deg, #FF4B2B, #FF416C);
  cursor: default;
}

/* .service__icon::after{
  color: var(--main);
  font-size: 2.3rem;
  content: '+';
  display: block;
  position: absolute;
  right: 0;
  bottom: 0;
  width: 1rem;
  height: 1rem;
  transform: translate(5px, -14px);
} */
</style>
