<template>
  <div class="service__item" @click="onClick">
    <div class="service__icon">
      <component :is="service.icon" />
    </div>
    <div class="service__title">
      {{ translatedName }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.js'

const props = defineProps({
  service: { type: Object, required: true },
  productsCount: { type: Function, required: true }
})

const i18n = useI18n()
const authStore = useAuthStore()

const translatedName = computed(() => {
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
.service__item{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  transition: background-color .2s ease, color .2s ease;
  padding: 10px;
  cursor: pointer;
}

/* .service__item:not(:last-of-type){
  margin-right: 10px;
} */

.service__item:hover{
  background-color: var(--bright_font);
  color: var(--main);
}

.service__icon{
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  margin-bottom: 3px;
  position: relative;
}

.service__title{
  text-align: center;
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