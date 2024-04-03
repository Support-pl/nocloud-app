<template>
  <div
    class="password__container"
    :style="{
      display: (block) ? null : 'inline-block',
      cursor: (isDisabled) ? 'pointer' : null
    }"
    @click="isDisabled = false"
  >
    <span class="password__shower" :class="{ 'disabled': isDisabled }">
      {{ password }}
    </span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const isDisabled = ref(true)

const props = defineProps({
  password: { type: String, required: true },
  block: { type: Boolean, default: false }
})

const password = computed(() => {
  if (!props.password) return 'xxx'
  if (!isDisabled.value) return props.password
  return props.password.split('').map(() => 'X').join('')
})
</script>

<script>
export default { name: 'PasswordShower' }
</script>

<style scoped>
.password__shower {
  display: inline-block;
  padding: 2px 5px;
  background: rgb(236, 236, 236);
  color: rgba(0, 0, 0, 0.88);
  border-radius: 4px;
  font-family: 'Consolas';
}

.disabled {
  color: gray;
  background: gray;
  pointer-events: none;
  user-select: none;
}
</style>
