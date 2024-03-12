<template>
  <div class="service__item" @click="onClick">
    <div class="service__icon">
      <component :is="service.icon" v-if="!isIconString" />

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
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AIcon from '@ant-design/icons-vue'
import { NcIcon } from 'nocloud-ui'
import { useAuthStore } from '@/stores/auth.js'

const props = defineProps({
  service: { type: Object, required: true },
  productsCount: { type: Function, required: true }
})

const i18n = useI18n()
const authStore = useAuthStore()

const isIconString = computed(() =>
  typeof props.service.icon === 'string'
)

const translatedName = computed(() => {
  const { title } = (props.service.promo ?? {})[i18n.locale.value] ?? {}

  if (title) return title
  if (props.service.translatable) {
    return i18n.t(props.service.title)
  }
  return props.service.title
})

function onClick (e) {
  const type = props.service.onclick.paramsArr[0].query.service
  const isCountZero = props.productsCount(type, true) === 0

  if (authStore.isLogged && !isCountZero) e.stopPropagation()
  else return

  props.service.onclick.function(...props.service.onclick.paramsArr)
}
</script>

<script>
export default { name: 'ServiceItem' }
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
  transition: background-color .2s ease, color .2s ease;
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

/* .service__icon .cls-1 {
  fill: inherit;
}

.service__icon .cls-2 {
  fill: var(--main);
} */

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
