<template>
  <div>
    <a-form
      v-if="personal.firstname"
      ref="personalForm"
      :model="personal"
      :rules="rules"
    >
      <a-divider orientation="left">
        {{ $t("ssl_product.technical_Contact") }}
      </a-divider>
      <a-alert
        style="margin: 10px"
        :message="$t('ssl_product.personal_warning')"
        type="warning"
        show-icon
      />
      <a-form-item :label="$t('ssl_product.order type')" name="order">
        <a-select v-model:value="personal.order" placeholder=" Please choose one...">
          <a-select-option value="newOrder">
            {{ $t("ssl_product.new order") }}
          </a-select-option>
          <a-select-option value="renewOrder">
            {{ $t("ssl_product.renewal") }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="$t('ssl_product.webserver type')" name="webserver">
        <a-select
          v-model:value="personal.webserver"
          placeholder="Please choose one..."
        >
          <a-select-option value="Nginx">
            Nginx
          </a-select-option>
          <a-select-option value="Apache">
            Apache
          </a-select-option>
          <a-select-option value="IIS">
            IIS (Windows OS)
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item :label="$t('ssl_product.firstname')" name="firstname">
        <a-input v-model:value="personal.firstname" />
      </a-form-item>

      <a-form-item :label="$t('ssl_product.lastname')" name="lastname">
        <a-input v-model:value="personal.lastname" />
      </a-form-item>

      <a-form-item label="Email" name="email">
        <a-input v-model:value="personal.email" type="email" />
      </a-form-item>

      <a-form-item :label="$t('ssl_product.phone number')" name="phonenumber">
        <a-input v-model:value.number="personal.phonenumber" />
      </a-form-item>

      <a-form-item :label="$t('ssl_product.companyname')" name="companyname">
        <a-input v-model:value="personal.companyname" />
      </a-form-item>

      <a-form-item :label="$t('ssl_product.address')" name="address1">
        <a-input v-model:value="personal.address1" />
      </a-form-item>

      <a-form-item :label="$t('ssl_product.city')" name="city">
        <a-input v-model:value="personal.city" />
      </a-form-item>

      <a-form-item :label="$t('ssl_product.state')" name="state">
        <a-input v-model:value="personal.state" />
      </a-form-item>

      <a-form-item :label="$t('ssl_product.countryname')" name="country">
        <a-select
          v-model:value="personal.country"
          placeholder=" Please choose one..."
        >
          <a-select-option v-for="country in Object.keys(countries)" :key="country">
            {{ country }}: {{ $t(`country.${country}`) }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <div v-if="orgVerification.includes(productInfo.id)">
        <a-divider orientation="left">
          Company details
        </a-divider>

        <a-form-item
          v-for="(val, key) in companyFields"
          :key="key"
          :label="$t('ssl_product.' + key)"
          :name="key"
        >
          <a-input v-model:value="personal[key]" />
        </a-form-item>

        <a-form-item :label="$t('ssl_product.org_country')" name="org_country">
          <a-select
            v-model:value="personal.org_country"
            show-search
            placeholder=" Please choose one..."
            :filter-option="searchCountries"
          >
            <a-select-option v-for="country in countries" :key="country.code">
              {{ country.code }}: {{ country.title }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>

      <a-form-item>
        <a-button type="primary" @click="$emit('handleClickPrev', personal)">
          <left-icon /> {{ $t("ssl_product.back") }}
        </a-button>
        <a-button
          type="primary"
          style="margin-left: 10px"
          @click="handleClickNext"
        >
          {{ $t("ssl_product.continue") }} <right-icon />
        </a-button>
      </a-form-item>
    </a-form>

    <empty v-else style="height: 100%" />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.js'

import countries from '@/assets/countries.json'
import empty from '@/components/ui/empty.vue'

const props = defineProps({
  csr: { type: Object, default: () => {} },
  productInfo: { type: Object, default: () => {} },
  personalBack: { type: Object, default: () => {} }
})
const emits = defineEmits(['handleClickNext', 'handleClickPrev'])

const i18n = useI18n()
const authStore = useAuthStore()

const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)
const rightIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/RightOutlined')
)

const interestedKeys = [
  'firstname',
  'lastname',
  'email',
  'address1',
  'city',
  'state',
  'phonenumber',
  'result',
  'country',
  'companyname'
]

const companyFields = {
  org_name: true,
  org_division: true,
  org_duns: true,
  org_addressline1: true,
  org_city: true,
  org_region: true,
  org_lei: false,
  org_postalcode: true,
  org_phone: true
}

const orgVerification = [843, 958, 838, 839, 837, 841, 840, 874, 976, 1151]
const personalForm = ref(null)
const personal = ref({
  webserver: 'Nginx',
  order: 'newOrder'
})

const reqRule = reactive({
  required: true,
  message: 'Field is required'
})
const rules = computed(() => ({
  org_country: [reqRule],
  order: [reqRule],
  webserver: [reqRule],
  firstname: [reqRule],
  lastname: [reqRule],
  companyname: [reqRule],
  email: [reqRule],
  address1: [reqRule],
  city: [reqRule],
  state: [reqRule],
  country: [reqRule],
  phonenumber: [reqRule]
}))

async function handleClickNext () {
  try {
    await personalForm.value.validate()

    if ('csr' in personal.value) delete personal.value.csr
    emits('handleClickNext', personal.value)
  } catch {
    message.error(`${i18n.t('ssl_product.fields is required')}`)
    return false
  }
}

function installDataToBuffer () {
  if (props.personalBack.firstname) {
    personal.value = Object.assign({}, personal.value, props.personalBack)
  } else {
    interestedKeys.forEach((key) => {
      personal.value[key] = authStore.billingUser[key]
    })
    personal.value = Object.assign({}, personal.value, props.csr)
  }
}

function searchCountries (input, option) {
  const country = option.children(option)[0].children.toLowerCase()

  return country.includes(input.toLowerCase())
}

onMounted(() => {
  installDataToBuffer()
  if (orgVerification.includes(props.productInfo.id)) {
    for (const keyField in companyFields) {
      rules.effect[keyField] = [
        {
          required: companyFields[keyField],
          message: `${i18n.t('ssl_product.field is required')}`
        }
      ]
    }
  }

  reqRule.message = `${i18n.t('ssl_product.field is required')}`
})
</script>

<script>
export default { name: 'PersonalData' }
</script>
