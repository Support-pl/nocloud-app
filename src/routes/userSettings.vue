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
          <a-form-model
            v-if="isVisible"
            ref="formRef"
            :model="form"
            :rules="rules"
          >
            <a-form-model-item
              :label="$t('clientinfo.firstname') | capitalize"
              prop="firstname"
            >
              <a-input v-model="form.firstname" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.lastname') | capitalize"
              prop="lastname"
            >
              <a-input v-model="form.lastname" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.companyname') | capitalize"
              prop="companyname"
            >
              <a-input v-model="form.companyname" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.email') | capitalize"
              prop="email"
            >
              <a-input v-model="form.email" :disabled="isDisabled" />
            </a-form-model-item>

            <a-form-model-item
              :label="$t('clientinfo.address1') | capitalize"
              prop="address1"
            >
              <a-input v-model="form.address1" :disabled="isDisabled" />
            </a-form-model-item>

            <a-form-model-item
              :label="$t('clientinfo.city') | capitalize"
              prop="city"
            >
              <a-input v-model="form.city" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.state') | capitalize"
              prop="state"
            >
              <a-input v-model="form.state" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.postcode') | capitalize"
              prop="postcode"
            >
              <a-input v-model="form.postcode" :disabled="isDisabled" />
            </a-form-model-item>
            <a-form-model-item
              :label="$t('clientinfo.phonenumber') | capitalize"
              prop="phonenumber"
            >
              <input
                v-model="form.phonenumber"
                v-phone="phonecode"
                type="tel"
                class="ant-input"
                :disabled="!form.countryname || isDisabled"
              >
            </a-form-model-item>

            <a-form-model-item>
              <a-form-model-item
                :label="$t('clientinfo.countryname') | capitalize"
                prop="countryname"
              >
                <a-select
                  v-model="form.countryname"
                  show-search
                  option-filter-prop="children"
                  :disabled="authStore.billingUser.country_stop === 1 || isDisabled"
                >
                  <a-select-option
                    v-for="country in Object.keys(countries)"
                    :key="country"
                    :value="country"
                  >
                    {{ $t(`country.${country}`) }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>

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
            </a-form-model-item>
          </a-form-model>

          <loading v-else-if="isLoading" />
          <empty v-else style="height: 100%" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, set } from 'vue'
import { notification } from 'ant-design-vue'
import i18n from '@/i18n'
import api from '@/api.js'

import { useAuthStore } from '@/stores/auth.js'
import { countries } from '@/setup/countries'
import countriesWithDialCode from '@/countries.json'

import empty from '@/components/empty/empty.vue'
import loading from '@/components/loading/loading.vue'

const authStore = useAuthStore()

const formRef = ref(null)
const form = ref({})
const isLoading = ref(false)
const isSendingInfo = ref(false)

const rules = {
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
      required: false,
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
      required: false,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  city: [
    {
      required: false,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  state: [
    {
      required: false,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  countryname: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  postcode: [
    {
      required: false,
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
  countriesWithDialCode.find(({ title }) => title === form.value.countryname)?.dial_code
)

const isDisabled = computed(() => {
  if (!authStore.billingUser.roles) return
  return !!authStore.billingUser.roles.settings
})

const isVisible = computed(() =>
  (!isLoading.value && authStore.billingUser.firstname) || localStorage.getItem('oauth')
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
    set(form.value, key, authStore.billingUser[key])
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

function sendInfo () {
  formRef.value.validate(async (valid) => {
    if (!valid) {
      notification.error({
        message: i18n.t('ssl_product.fields is required')
      })

      return false
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
  })
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
  background: #fff;
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
.user__button--cancel {
  margin-left: 10px;
}
</style>
