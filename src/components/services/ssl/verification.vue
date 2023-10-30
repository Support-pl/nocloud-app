<template>
  <div>
    <a-alert
      show-icon
      type="warning"
      style="margin: 10px"
      :message="$t('ssl_product.verification_warning')"
    />
    <a-form ref="verification" :model="verification" :rules="rules">
      <a-form-item :label="$t('ssl_product.domain')" name="domain">
        <a-input v-model:value="verification.domain" disabled />
      </a-form-item>

      <a-form-item :label="$t('ssl_product.DCV Method')" name="dcv">
        <a-select v-model:value="verification.dcv">
          <a-select-option v-for="item in dcvList" :key="item" :value="item">
            {{ item }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="$t('ssl_product.email')" name="email">
        <a-select v-model:value="verification.email">
          <a-select-option
            v-for="item in emailList"
            :key="item"
            :value="`${item}${csr.domain}`"
          >
            {{ item }}{{ csr.domain }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" @click="emits('handleClickPrev', verification)">
          <left-icon /> {{ $t('ssl_product.back') }}
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  verificationBack: { type: Object, default: () => {} },
  csr: { type: Object, default: () => {} }
})
const emits = defineEmits(['handleClickPrev', 'getVerification'])

const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)

const i18n = useI18n()

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
  if (!('dcv' in props.verificationBack)) {
    emits('getVerification', verification.value)
  } else {
    verification.value = JSON.parse(JSON.stringify(props.verificationBack))
  }
})
</script>

<script>
export default { name: 'VerificationView' }
</script>
