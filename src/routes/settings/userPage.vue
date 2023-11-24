<template>
  <div class="user__settings">
    <div class="container">
      <div class="content__wrapper">
        <!-- нету юзера -->
        <div class="content__title">
          {{ $t("Personal Area") }}
          <span class="content__small"> #{{ authStore.billingUser.id }} </span>
        </div>
        <div class="content__fields-wrapper" :style="{ margin: (!isVisible) ? 'auto' : null }">
          <a-form
            v-if="isVisible"
            ref="formRef"
            layout="vertical"
            :model="form"
            :rules="rules"
          >
            <a-form-item
              :label="`${capitalize($t('clientinfo.firstname'))}:`"
              name="firstname"
            >
              <a-input v-model:value="form.firstname" :disabled="isDisabled" />
            </a-form-item>
            <a-form-item
              :label="`${capitalize($t('clientinfo.lastname'))}:`"
              name="lastname"
            >
              <a-input v-model:value="form.lastname" :disabled="isDisabled" />
            </a-form-item>
            <a-form-item
              :label="`${capitalize($t('clientinfo.companyname'))}:`"
              name="companyname"
            >
              <a-input v-model:value="form.companyname" :disabled="isDisabled" />
            </a-form-item>
            <a-form-item
              :label="`${capitalize($t('clientinfo.email'))}:`"
              name="email"
            >
              <a-input v-model:value="form.email" :disabled="isDisabled" />
            </a-form-item>

            <a-form-item
              :label="`${capitalize($t('clientinfo.address1'))}:`"
              name="address1"
            >
              <a-input v-model:value="form.address1" :disabled="isDisabled" />
            </a-form-item>

            <a-form-item
              :label="`${capitalize($t('clientinfo.city'))}:`"
              name="city"
            >
              <a-input v-model:value="form.city" :disabled="isDisabled" />
            </a-form-item>
            <a-form-item
              :label="`${capitalize($t('clientinfo.state'))}:`"
              name="state"
            >
              <a-input v-model:value="form.state" :disabled="isDisabled" />
            </a-form-item>
            <a-form-item
              :label="`${capitalize($t('clientinfo.postcode'))}:`"
              name="postcode"
            >
              <a-input v-model:value="form.postcode" :disabled="isDisabled" />
            </a-form-item>

            <a-form-item
              :label="(form.countryname === 'PL') ? 'NIP' : 'VAT ID'"
              name="tax_id"
            >
              <a-input v-model="form.tax_id" :disabled="isDisabled" />
            </a-form-item>

            <a-form-item
              :label="`${capitalize($t('clientinfo.countryname'))}:`"
              name="countryname"
            >
              <a-select
                v-model:value="form.countryname"
                show-search
                :filter-option="searchCountries"
                :disabled="authStore.billingUser.country_stop === 1 || isDisabled"
              >
                <a-select-option v-for="country in countries" :key="country.code">
                  {{ $t(`country.${country.code}`) }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item
              :label="`${capitalize($t('clientinfo.phonenumber'))}:`"
              name="phonenumber"
            >
              <input
                v-model="form.phonenumber"
                v-phone="phonecode"
                type="tel"
                class="user__input"
                :disabled="!form.countryname || isDisabled"
              >
            </a-form-item>

            <a-form-item
              v-if="isPasswordVisible"
              :label="`${capitalize('currency')}:`"
              name="currency"
            >
              <a-select v-model:value="form.currency">
                <a-select-option v-for="currency in currenciesStore.whmcsCurrencies" :key="currency.id">
                  {{ currency.code }}
                </a-select-option>
              </a-select>
            </a-form-item>

            <a-form-item
              v-if="isPasswordVisible"
              :label="`${capitalize($t('clientinfo.password'))}:`"
              name="password"
            >
              <a-input v-model:value="form.password" />
            </a-form-item>

            <a-button
              v-if="!isDisabled"
              class="user__button user__button--submit"
              type="primary"
              :loading="isSendingInfo"
              @click="sendInfo"
            >
              {{ $t("Submit") }}
            </a-button>
            <a-button
              v-if="!isDisabled"
              class="user__button user__button--cancel"
              @click="installDataToBuffer"
            >
              {{ $t("Cancel") }}
            </a-button>
          </a-form>

          <loading v-else-if="isLoading" />
          <empty v-else style="height: 100%" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { notification } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import api from '@/api.js'

import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import countries from '@/assets/countries.json'

import empty from '@/components/ui/empty.vue'
import loading from '@/components/ui/loading.vue'

const i18n = useI18n()
const authStore = useAuthStore()
const currenciesStore = useCurrenciesStore()

const formRef = ref(null)
const form = ref({})
const isLoading = ref(false)
const isSendingInfo = ref(false)

const reqRule = reactive({
  required: true,
  message: 'Field is required',
  trigger: 'change'
})
const rules = computed(() => ({
  email: [reqRule],
  lastname: [reqRule],
  firstname: [reqRule],
  countryname: [reqRule],
  phonenumber: [reqRule],
  currency: [reqRule],

  companyname: [{ required: false }],
  address1: [{ required: false }],
  city: [{ required: false }],
  state: [{ required: false }],
  postcode: [{ required: false }]
}))

onMounted(() => {
  reqRule.message = `${i18n.t('ssl_product.field is required')}`
})

const deltaInfo = computed(() => {
  const info = { ...form.value, country: form.value.countryname }

  for (const key in info) {
    if (info[key] === authStore.billingUser[key]) {
      delete info[key]
    }
  }
  return info
})

const phonecode = computed(() =>
  countries.find(({ title }) => title === form.value.countryname)?.dial_code
)

const isDisabled = computed(() => {
  if (!authStore.billingUser.roles) return
  return !!authStore.billingUser.roles.settings
})

const isVisible = computed(() =>
  (!isLoading.value && authStore.billingUser.firstname) || localStorage.getItem('oauth')
)

const isPasswordVisible = computed(() =>
  localStorage.getItem('oauth')
)

function installDataToBuffer () {
  const interestedKeys = [
    'firstname',
    'lastname',
    'companyname',
    'email',
    'address1',
    'address2',
    'city',
    'state',
    'postcode',
    'countryname',
    'phonenumber'
  ]

  interestedKeys.forEach((key) => {
    form.value[key] = authStore.billingUser[key]
  })
}

async function fetchInfo () {
  try {
    isLoading.value = true
    const response = await authStore.fetchBillingData()

    if (localStorage.getItem('oauth')) return
    if (response.ERROR) throw response.ERROR.toLowerCase()
    if (response.result === 'error') throw response

    installDataToBuffer()
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function sendInfo () {
  try {
    await formRef.value.validate()
  } catch {
    notification.error({
      message: i18n.t('ssl_product.fields is required')
    })
    return
  }

  try {
    const { locale } = i18n.getLocaleMessage(i18n.locale)
    const params = (localStorage.getItem('oauth'))
      ? {
          ...deltaInfo.value,
          app_language: locale,
          uuid: authStore.userdata.uuid,
          run: 'create_user_active'
        }
      : {
          run: 'update_client',
          user: { ...authStore.billingUser, ...deltaInfo.value }
        }

    isSendingInfo.value = true
    await api.get(authStore.baseURL, { params })

    localStorage.removeItem('oauth')
    notification.success({ message: i18n.t('Done') })

    fetchInfo()
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  } finally {
    isSendingInfo.value = false
  }
}

function searchCountries (input, option) {
  const country = option.children(option)[0].children.toLowerCase()

  return country.includes(input.toLowerCase())
}

if (!('firstname' in authStore.billingUser)) fetchInfo()
else installDataToBuffer()
</script>

<script>
export default { name: 'UserSettingsView' }
</script>

<style>
.user__settings {
  padding-top: 10px;
}

.content__wrapper {
  display: flex;
  flex-direction: column;
  padding: 10px 10px 15px 10px;
  border-radius: 10px;
  background: var(--bright_font);
}

.content__fields-wrapper {
  min-height: 100%;
}

.content__title {
  font-size: 1.6rem;
  margin-bottom: 5px;
}

.content__small {
  font-size: 0.7em;
  opacity: 0.5;
}

.user__input {
  padding: 4px 11px;
  font-size: 14px;
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.2s;
}

.user__input:disabled {
  color: rgba(0, 0, 0, 0.25);
  background-color: rgba(0, 0, 0, 0.04);
  border-color: #d9d9d9;
  box-shadow: none;
  cursor: not-allowed;
}

.user__button--cancel {
  margin-left: 10px;
}
</style>
