<template>
  <a-row>
    <a-col style="margin-bottom: 10px" :span="6">
      {{ $t('Login') }}:
    </a-col>
    <a-col style="margin-bottom: 10px" :span="18">
      {{ VM.state?.meta.login ?? '-' }}
    </a-col>
    <a-col style="line-height: 2" :span="6">
      {{ $t('clientinfo.password') | capitalize }}:
    </a-col>
    <a-col :span="18">
      <password-view :password="password" />
    </a-col>
  </a-row>
</template>

<script>
import passwordView from '@/components/password.vue';

export default {
	name: "access-manager",
	components: { passwordView },
  props: { VM: { type: Object, required: true } },
  computed: {
    password() {
      if (this.VM.server_on) return this.VM.password ?? '-';
      return this.VM.state.meta.password ?? this.VM.config.password;
    }
  }
}
</script>
