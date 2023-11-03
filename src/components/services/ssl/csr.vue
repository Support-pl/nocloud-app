<template>
  <div>
    <a-alert
      style="margin: 10px"
      :message="$t('ssl_product.csr_warning')"
      type="warning"
      show-icon
    />
    <a-form ref="csrFormField" :model="fieldCSR" :rules="rules">
      <a-form-item label="CSR" name="csr">
        <a-spin :tip="$t('loading')" :spinning="areaLoading">
          <a-textarea v-model:value="fieldCSR.csr" style="height: 150px" />
        </a-spin>
      </a-form-item>
      <a-form-item>
        <a-button type="primary" @click="emits('handleClickPrev', { ...fieldCSR })">
          {{ $t('ssl_product.back') }} <left-icon />
        </a-button>
        <a-button type="primary" style="margin-left: 10px" @click="handleClickNext">
          {{ $t('ssl_product.continue') }} <right-icon />
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import api from '@/api.js'

// const keys = {
//   firstname: "tech_firstname",
//   lastname: "tech_lastname",
//   email: "tech_email",
//   address1: "tech_addressline1",
//   city: "tech_city",
//   state: "tech_region",
//   phonenumber: "tech_phone",
//   country: "tech_country",
//   companyname: "tech_organization",
//   org_name: "org_name",
//   org_division: "org_division",
//   org_duns: "org_duns",
//   org_addressline1: "org_addressline1",
//   org_city: "org_city",
//   org_region: "org_region",
//   org_lei: "org_lei",
//   org_postalcode: "org_postalcode",
//   org_phone: "org_phone",
// };

const props = defineProps({
  csr: { type: Object, default: () => {} }
})
const emits = defineEmits(['handleClickNext', 'handleClickPrev'])

const route = useRoute()
const i18n = useI18n()

const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)
const rightIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/RightOutlined')
)

const fieldCSR = ref({ csr: '' })
const csrFormField = ref(null)
const areaLoading = ref(false)
const rules = reactive({
  csr: [
    {
      required: true,
      message: 'Field is required',
      min: 40
    }
  ]
})

async function handleClickNext () {
  try {
    await csrFormField.value.validate()

    const params = ('domain' in props.csr)
      ? props.csr
      : await decodeCSR(fieldCSR.value.csr)

    emits('handleClickNext', { ...fieldCSR.value, ...params })
  } catch (error) {
    message.error(`${i18n.t('ssl_product.fields is required')}`)
    return false
  }
}

function decodeCSR (csr) {
  return new Promise((resolve) => {
    api.sendAsUser(
      'moduleTouch',
      { ...csr, path: 'ssl/decodeCSR' },
      'moduleTouch.phpssl'
    )
      .then((resp) => {
        let result
        if (resp.error) {
          throw resp
        }
        if ('csrResult' in resp && resp.success) {
          result = {
            domain: resp.csrResult.CN,
            org_name: resp.csrResult.O,
            org_division: resp.csrResult.OU,
            org_city: resp.csrResult.L,
            org_country: resp.csrResult.C,
            org_region: resp.csrResult.S
          }
        }
        resolve(result)
      })
      .catch((error) => {
        console.error(error)
        message.error(error.description)
        resolve(error)
      })
  })
}

onMounted(() => {
  fieldCSR.value.csr = route.params.csr ?? props.csr.csr
  rules.csr[0].message = `${i18n.t('ssl_product.field is required')}`
})
</script>

<script>
export default { name: 'CSR' }

</script>
