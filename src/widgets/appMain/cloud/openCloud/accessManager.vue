<template>
  <a-row>
    <a-col
      style="margin-bottom: 10px"
      :span="6"
    >
      {{ $t('login') }}:
    </a-col>
    <a-col
      style="margin-bottom: 10px"
      :span="18"
    >
      {{ VM.state.meta.login ?? '-' }}
    </a-col>
    <a-col
      style="line-height: 2"
      :span="6"
    >
      {{ $t('clientinfo.password') }}:
    </a-col>
    <a-col :span="18">
      <password :password="VM.state.meta.password ?? VM.config.password" />
    </a-col>
  </a-row>
</template>

<script>
import password from '@/widgets/password.vue'

export default {
  name: 'AccessManager',
  components: { password },
  props: { VM: { type: Object, required: true } }
}
</script>
