<template>
  <div class="service__wrapper">
    <!-- Layout for screens > 1050px (horizontal) -->
    <template v-if="useHorizontalLayout">
      <div
        :class="serviceItemClassesHorizontal"
        :style="colorStyles"
        @click="handleClick"
      >
        <div :class="serviceIconClassesHorizontal">
          <component
            v-if="!isIconString"
            :is="service.icon"
            :two-tone-color="service.meta?.iconColor"
          />
          <a-icon v-else>
            <template #component="svgProps">
              <nc-icon :icon-name="service.icon" v-bind="svgProps" />
            </template>
          </a-icon>
        </div>

        <div class="service__title service__title--horizontal">
          {{ translatedName }}
        </div>
      </div>

      <span v-if="service.meta?.isNew" class="badge-new badge-new--horizontal"
        >New</span
      >
    </template>

    <!-- Layout for screens <= 1050px (vertical) -->
    <template v-else>
      <div
        :class="serviceItemClasses"
        :style="colorStyles"
        @click="handleClick"
      >
        <div :class="serviceIconClasses">
          <component
            v-if="!isIconString"
            :is="service.icon"
            :two-tone-color="service.meta?.iconColor"
          />
          <a-icon v-else>
            <template #component="svgProps">
              <nc-icon :icon-name="service.icon" v-bind="svgProps" />
            </template>
          </a-icon>
        </div>

        <div class="service__title">{{ translatedName }}</div>
      </div>

      <span v-if="service.meta?.isNew" class="badge-new badge-new--vertical"
        >New</span
      >
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import AIcon from "@ant-design/icons-vue";
import { NcIcon } from "nocloud-ui";
import { useAuthStore } from "@/stores/auth.js";

const BREAKPOINT = 1050;

const props = defineProps({
  service: { type: Object, required: true },
  productsCount: { type: Function, required: true },
  oldLayout: { type: Boolean, default: false },
});

const { t, locale } = useI18n();
const authStore = useAuthStore();

const windowWidth = ref(window.innerWidth);

const handleResize = () => {
  windowWidth.value = window.innerWidth;
};

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

const useHorizontalLayout = computed(
  () => windowWidth.value > BREAKPOINT && !props.oldLayout
);
const isIconString = computed(() => typeof props.service.icon === "string");

const serviceItemClasses = computed(() => ({
  service__item: true,
  "service__item--vertical": true,
  "service__item--colored": !!props.service.meta?.iconColor,
}));

const serviceItemClassesHorizontal = computed(() => ({
  service__item: true,
  "service__item--horizontal": true,
  "service__item--colored": !!props.service.meta?.iconColor,
}));

const serviceIconClasses = computed(() => ({
  service__icon: true,
  "service__icon--vertical": true,
  "service__icon--colored": !!props.service.meta?.iconColor,
}));

const serviceIconClassesHorizontal = computed(() => ({
  service__icon: true,
  "service__icon--horizontal": true,
  "service__icon--colored": !!props.service.meta?.iconColor,
}));

const colorStyles = computed(() => {
  const iconColor = props.service.meta?.iconColor;
  return iconColor ? { color: iconColor, fill: iconColor } : {};
});

const translatedName = computed(() => {
  const promoTitle = props.service.promo?.[locale.value]?.title;

  if (promoTitle) return promoTitle;
  if (props.service.translatable) return t(props.service.title);
  return props.service.title;
});

const handleClick = (event) => {
  const serviceType = props.service.onclick.paramsArr[0].query.service;
  const hasProducts = props.productsCount(serviceType, true) > 0;

  if (!authStore.isLogged || !hasProducts) return;

  event.stopPropagation();
  props.service.onclick.function(...props.service.onclick.paramsArr);
};
</script>

<script>
export default { name: "ServiceItem" };
</script>

<style lang="scss" scoped>
.service__wrapper {
  position: relative;
}

.service__item {
  display: flex;
  align-items: center;
  border-radius: 10px;
  cursor: pointer;
  padding: 10px;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background-color: var(--bright_font);
    color: var(--main);
  }

  &--vertical {
    flex-direction: column;
    justify-content: center;
    padding: 10px;
  }

  &--horizontal {
    flex-direction: row;
    align-items: center;
    padding: 5px;
  }

  &--colored {
    :deep(*) {
      fill: inherit !important;
    }
  }
}

.service__icon {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;

  &--vertical {
    margin-bottom: 3px;
  }

  &--horizontal {
    margin-right: 10px;
    margin-bottom: 3px;
    font-size: 25px;
  }

  &--colored {
    :deep(.cls-1) {
      fill: var(--main) !important;
    }

    :deep(.cls-2) {
      fill: inherit;
    }

    :deep(g path) {
      fill: inherit !important;
    }
  }
}

.service__title {
  text-align: center;
  word-break: break-word;

  &--horizontal {
    text-align: left;
  }
}

.badge-new {
  position: absolute;
  display: inline-block;
  background: linear-gradient(135deg, #ff416c, #ff4b2b);
  color: white;
  font-weight: 700;
  font-size: 0.6rem;
  padding: 0.25em 0.6em;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(255, 75, 43, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  user-select: none;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  transition: background 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #ff4b2b, #ff416c);
    cursor: default;
  }

  &--vertical {
    top: 5px;
    right: 15px;
  }

  &--horizontal {
    top: 13px;
    right: 30px;
  }
}
</style>
