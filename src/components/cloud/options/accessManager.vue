<template>
  <a-row :gutter="[5, 10]">
    <a-col :span="6">
      {{ $t('Login') }}:
    </a-col>
    <a-col :span="18">
      {{ instance.state?.meta.login ?? instance.config?.username ?? '-' }}
    </a-col>
    <a-col style="line-height: 2" :span="6">
      {{ capitalize($t('clientinfo.password')) }}:
    </a-col>
    <a-col :span="18">
      <password-view :password="password" />
    </a-col>
    <a-col :span="6">
      {{ $t('Port') }}:
    </a-col>
    <a-col :span="18">
      {{ instance.state?.interfaces?.at(0)?.data.port ?? '-' }}
    </a-col>
  </a-row>
</template>

<script setup>
import { computed } from 'vue'
import passwordView from '@/components/ui/password.vue'

const props = defineProps({
  instance: { type: Object, required: true }
})

const password = computed(() => {
  if (props.instance.server_on) {
    return props.instance.resources.password ?? '-'
  }
  return props.instance.state.meta.password ??
    props.instance.config.password
})
</script>

<script>
export default { name: 'AccessManager' }
</script>
