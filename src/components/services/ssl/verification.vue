<template>
  <div>
    <a-alert
      show-icon
      type="warning"
      style="margin: 10px"
      :message="$t('ssl_product.verification_warning')"
    />
    <a-form-model ref="verification" :model="verification" :rules="rules">
      <a-form-model-item :label="$t('ssl_product.domain')" prop="domain">
        <a-input v-model="verification.domain" disabled />
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.DCV Method')" prop="dcv">
        <a-select v-model="verification.dcv">
          <a-select-option v-for="item in dcvList" :key="item" :value="item">
            {{ item }}
          </a-select-option>
        </a-select>
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.email')" prop="email">
        <a-select v-model="verification.email">
          <a-select-option
            v-for="item in emailList"
            :key="item"
            :value="`${item}${csr.domain}`"
          >
            {{ item }}{{ csr.domain }}
          </a-select-option>
        </a-select>
      </a-form-model-item>

      <a-form-model-item>
        <a-button type="primary" @click="emits('handleClickPrev', verification)">
          <a-icon type="left" /> {{ $t('ssl_product.back') }}
        </a-button>
      </a-form-model-item>
    </a-form-model>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import i18n from '@/i18n'

const props = defineProps({
  verification_back: { type: Object, default: () => {} },
  csr: { type: Object, default: () => {} }
})
const emits = defineEmits(['handleClickPrev', 'getVerification'])

const verification = ref({
  domain: props.csr.domain,
  dcv: 'EMAIL',
  email: `admin@${props.csr.domain}`
})

const dcvList = ['EMAIL', 'HTTP', 'HTTPS', 'DNS']
const emailList = ['admin@', 'administrator@', 'hostmaster@', 'webmaster@', 'postmaster@']

const rules = {
  dcv: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  email: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ]
}

onMounted(() => {
  if (!('dcv' in props.verification_back)) {
    emits('getVerification', verification.value)
  } else {
    verification.value = JSON.parse(JSON.stringify(props.verification_back))
  }
})
</script>

<script>
export default { name: 'VerificationView' }
</script>
