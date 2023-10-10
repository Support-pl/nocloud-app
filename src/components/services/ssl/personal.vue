<template>
  <div>
    <a-form-model
      v-if="personal.firstname"
      ref="personalForm"
      :model="personal"
      :rules="rules"
    >
      <a-divider orientation="left">
        {{
          $t("ssl_product.technical_Contact")
        }}
      </a-divider>
      <a-alert
        style="margin: 10px"
        :message="$t('ssl_product.personal_warning')"
        type="warning"
        show-icon
      />
      <a-form-model-item :label="$t('ssl_product.order type')" prop="order">
        <a-select v-model="personal.order" placeholder=" Please choose one...">
          <a-select-option value="newOrder">
            {{ $t("ssl_product.new order") }}
          </a-select-option>
          <a-select-option value="renewOrder">
            {{ $t("ssl_product.renewal") }}
          </a-select-option>
        </a-select>
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.webserver type')" prop="webserver">
        <a-select
          v-model="personal.webserver"
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
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.firstname')" prop="firstname">
        <a-input v-model="personal.firstname" />
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.lastname')" prop="lastname">
        <a-input v-model="personal.lastname" />
      </a-form-model-item>

      <a-form-model-item label="Email" prop="email">
        <a-input v-model="personal.email" type="email" />
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.phone number')" prop="phonenumber">
        <a-input v-model.number="personal.phonenumber" />
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.companyname')" prop="companyname">
        <a-input v-model="personal.companyname" />
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.address')" prop="address1">
        <a-input v-model="personal.address1" />
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.city')" prop="city">
        <a-input v-model="personal.city" />
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.state')" prop="state">
        <a-input v-model="personal.state" />
      </a-form-model-item>

      <a-form-model-item :label="$t('ssl_product.countryname')" prop="country">
        <a-select
          v-model="personal.country"
          placeholder=" Please choose one..."
        >
          <a-select-option
            v-for="country in Object.keys(countries)"
            :key="country"
            :value="country"
          >
            {{ country }}: {{ $t(`country.${country}`) }}
          </a-select-option>
        </a-select>
      </a-form-model-item>

      <div v-if="orgVerification.includes(product_info.id)">
        <a-divider orientation="left">
          Company details
        </a-divider>

        <a-form-model-item
          v-for="(val, key) in companyFields"
          :key="key"
          :label="$t('ssl_product.' + key)"
          :prop="key"
        >
          <a-input v-model="personal[key]" />
        </a-form-model-item>

        <a-form-model-item :label="$t('ssl_product.org_country')" prop="org_country">
          <a-select
            v-model="personal.org_country"
            placeholder=" Please choose one..."
          >
            <a-select-option
              v-for="country in Object.keys(countries)"
              :key="country"
              :value="country"
            >
              {{ country }}: {{ countries[country] }}
            </a-select-option>
          </a-select>
        </a-form-model-item>
      </div>

      <a-form-model-item>
        <a-button type="primary" @click="$emit('handleClickPrev', personal)">
          <a-icon type="left" /> {{ $t("ssl_product.back") }}
        </a-button>
        <a-button
          type="primary"
          style="margin-left: 10px"
          @click="handleClickNext"
        >
          {{ $t("ssl_product.continue") }} <a-icon type="right" />
        </a-button>
      </a-form-model-item>
    </a-form-model>

    <empty v-else style="height: 100%" />
  </div>
</template>

<script setup>
import { onMounted, ref, set } from 'vue'
import { message } from 'ant-design-vue'

import i18n from '@/i18n.js'
import { useAuthStore } from '@/stores/auth.js'

import { countries } from '@/setup/countries'
import empty from '@/components/empty/empty.vue'

const props = defineProps({
  csr: { type: Object, default: () => {} },
  product_info: { type: Object, default: () => {} },
  personal_back: { type: Object, default: () => {} }
})
const emits = defineEmits(['handleClickNext'])

const authStore = useAuthStore()

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

const rules = {
  org_country: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  order: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  webserver: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  firstname: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  lastname: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  companyname: [
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
  ],
  address1: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  city: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  state: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  country: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  phonenumber: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ]
}

function handleClickNext () {
  personalForm.value.validate((valid) => {
    if (valid) {
      if ('csr' in personal.value) delete personal.value.csr
      emits('handleClickNext', personal.value)
    } else {
      message.error(`${i18n.t('ssl_product.fields is required')}`)
      return false
    }
  })
}

function installDataToBuffer () {
  if (props.personal_back.firstname) {
    personal.value = Object.assign({}, personal.value, props.personal_back)
  } else {
    interestedKeys.forEach((key) => {
      set(personal.value, key, authStore.billingUser[key])
    })
    personal.value = Object.assign({}, personal.value, props.csr)
  }
}

onMounted(() => {
  installDataToBuffer()
  if (orgVerification.includes(props.product_info.id)) {
    for (const keyField in companyFields) {
      rules[keyField] = [
        {
          required: companyFields[keyField],
          message: `${i18n.t('ssl_product.field is required')}`
        }
      ]
    }
  }
})
</script>

<script>
export default { name: 'PersonalData' }
</script>
