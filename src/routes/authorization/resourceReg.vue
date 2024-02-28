<template>
  <div class="user__settings">
    <div class="container">
      <div class="content__wrapper">
        <div class="content__title">
          {{ $t('Questionnaire for registering an Internet resource') }}
          <!-- <span class="content__small"> #{{ authStore.billingUser.id }} </span> -->
        </div>

        <div class="content__fields-wrapper">
          <a-radio-group :value="type" style="margin-bottom: 10px" @update:value="setInfoByType($event)">
            <a-radio value="fiz">
              {{ $t('documents.private person') }}
            </a-radio>
            <a-radio value="ur">
              {{ $t('documents.juridical person') }}
            </a-radio>
            <a-radio value="ip">
              {{ $t('documents.individual entrepreneur') }}
            </a-radio>
          </a-radio-group>

          <a-form ref="formRef" layout="vertical" :model="form">
            <template v-for="[key, field] in fields" :key="key">
              <a-form-item
                v-if="field.visible ?? true"
                :class="{ 'divider-form-item': field.divider, 'group-form-item': field.group }"
                :label="`${capitalize($t(field.title ?? `clientinfo.${key}`))}:`"
                :rules="field.rules"
                :name="key"
              >
                <a-select
                  v-if="field.options"
                  v-model:value="getTarget(form, key)[(key.pop) ? key.at(-1) : key]"
                  :show-search="field.search"
                  :filter-option="field.filter"
                  :disabled="field.disabled"
                  :options="field.options"
                />

                <input
                  v-else-if="field.phonecode"
                  v-model="getTarget(form, key)[(key.pop) ? key.at(-1) : key]"
                  v-phone="field.phonecode"
                  type="tel"
                  :class="field.class"
                  :disabled="field.disabled"
                >

                <a-date-picker
                  v-else-if="field.date"
                  v-model:value="getTarget(form, key)[(key.pop) ? key.at(-1) : key]"
                  format="DD.MM.YYYY"
                  style="width: 100%"
                />

                <a-divider v-else-if="field.divider" style="margin: 0" />
                <a-input
                  v-else
                  v-model:value="getTarget(form, key)[(key.pop) ? key.at(-1) : key]"
                  :disabled="field.disabled"
                />
              </a-form-item>
            </template>

            <a-button type="primary" :loading="isSendLoading" @click="sendInfo">
              {{ $t('Submit') }}
            </a-button>
            <a-button style="margin-left: 10px" @click="setInfo">
              {{ $t('Cancel') }}
            </a-button>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isDayjs } from 'dayjs'
import { useAuthStore } from '@/stores/auth.js'

import { useNotification } from '@/hooks/utils'
import useResourceRegFields from '@/hooks/authorization/resourceRegFields.js'
import config from '@/appconfig.js'
import api from '@/api.js'

const i18n = useI18n()
const authStore = useAuthStore()
const { openNotification } = useNotification()

const formRef = ref(null)
const form = ref({})
const type = ref('')
const isLoading = ref(false)
const isSendLoading = ref(false)

const { fields } = useResourceRegFields(type, setInfoByType)

function getTarget (target, path = []) {
  if (!path.pop) return target

  path = [...path]
  path.pop()
  path.forEach((key) => {
    target = target[key]
  })

  return target ?? {}
}

function setInfoByType (value) {
  const docType = i18n.t('documents.passport')
  const regType = i18n.t('documents.registration certificate')
  const documentInfo = {
    type: docType, series: '', number: '', id_number: '', issued_by: '', date: ''
  }
  const regInfo = { type: regType, issued_by: '', date: '', number: '' }

  switch (value) {
    case 'fiz':
      form.value.document = documentInfo
      delete form.value.reg_info
      break

    case 'ur':
      form.value.reg_info = regInfo
      delete form.value.document
      break

    case 'ip':
      form.value.document = documentInfo
      form.value.reg_info = regInfo
  }

  type.value = value
}

function setInfo () {
  const keys = ['email', 'fullname', 'countryname', 'phonenumber', 'companyname', 'address1']

  keys.forEach((key) => {
    if (config.whmcsSiteUrl) {
      form.value[key] = authStore.billingUser[key]
    } else {
      form.value[key] = authStore.userdata.data[key]
    }
  })
}

async function fetchInfo (update) {
  try {
    isLoading.value = true
    const response = await authStore.fetchBillingData(update)

    if (response.ERROR) throw response.ERROR.toLowerCase()
    if (response.result === 'error') throw response

    setInfo()
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    openNotification('error', { message: i18n.t(message) })
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function sendInfo () {
  try {
    await formRef.value.validate()
  } catch {
    openNotification('error', {
      message: i18n.t('ssl_product.fields is required')
    })
    return
  }

  try {
    isSendLoading.value = true
    const params = JSON.stringify(
      { ...form.value, run: 'registration_domain', payer: type.value },
      objectStringify
    )

    const response = await api.get(authStore.baseURL, { params })

    if (response.error === 'email') {
      throw new Error(i18n.t('Email is already in use or is empty'))
    } else if (response.error) {
      throw new Error(response.error)
    }

    openNotification('success', { message: i18n.t('Done') })
    fetchInfo(true)
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    openNotification('error', { message: i18n.t(message) })
    console.error(error)
  } finally {
    isSendLoading.value = false
  }
}

function objectStringify (_, value) {
  if (isDayjs(value)) return value.valueOf()
  if (typeof value !== 'object') return value

  Object.keys(value).forEach((key) => {
    if (isDayjs(value[key])) {
      value[key] = value[key].valueOf()
    } else if (typeof value[key] === 'object') {
      value[key] = objectStringify('', { ...value[key] })
    }
  })
  return value
}

if ('firstname' in authStore.billingUser) setInfo()
else fetchInfo()

watch(() => authStore.billingUser, setInfo, { deep: true })
</script>

<script>
export default { name: 'RegistrationView' }
</script>

<style scoped>
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

.group-form-item {
  padding: 0 15px;
}
.divider-form-item {
  margin-bottom: 5px;
  padding: 0;
}

.divider-form-item :deep(.ant-form-item-label) {
  padding-bottom: 5px;
}
.divider-form-item :deep(.ant-form-item-control-input) {
  min-height: 0;
}
</style>
