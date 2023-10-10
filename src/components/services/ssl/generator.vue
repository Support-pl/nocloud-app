<template>
  <div class="generate-page">
    <div class="container">
      <div class="generate-page-card">
        <template v-if="generate.csr_commonname">
          <div class="generate-page__header">
            <div v-if="result.result == 'success'" class="generate-page__title">
              CSR
            </div>
            <div v-else class="generate-page__title">
              {{ $t("ssl_product.csr_generation_form") }}
            </div>
          </div>
          <a-alert
            v-if="result.result !== 'success'"
            style="margin: 10px"
            :message="$t('ssl_product.generator_warning_info')"
            type="warning"
            show-icon
          />
          <div class="content__fields-wrapper">
            <a-form-model
              v-if="result.result !== 'success'"
              ref="csrForm"
              :model="generate"
              :rules="rules"
            >
              <a-form-model-item
                :label="$t('ssl_product.domain')"
                prop="csr_commonname"
              >
                <a-input v-model="generate.csr_commonname" />
              </a-form-model-item>

              <a-form-model-item label="Email" prop="csr_email">
                <a-input v-model="generate.csr_email" />
              </a-form-model-item>

              <a-form-model-item
                :label="$t('ssl_product.companyname')"
                prop="csr_organization"
              >
                <a-input v-model="generate.csr_organization" />
              </a-form-model-item>

              <a-form-model-item
                :label="$t('ssl_product.departament')"
                prop="csr_department"
              >
                <a-input v-model="generate.csr_department" />
              </a-form-model-item>

              <a-form-model-item :label="$t('ssl_product.city')" prop="csr_city">
                <a-input v-model="generate.csr_city" />
              </a-form-model-item>

              <a-form-model-item :label="$t('ssl_product.state')" prop="csr_state">
                <a-input v-model="generate.csr_state" />
              </a-form-model-item>

              <a-form-model-item
                :label="$t('ssl_product.countryname')"
                prop="csr_country"
              >
                <a-select v-model="generate.csr_country">
                  <a-select-option
                    v-for="country in Object.keys(countries)"
                    :key="country"
                    :value="country"
                  >
                    {{ country }}: {{ $t(`country.${country}`) }}
                  </a-select-option>
                </a-select>
              </a-form-model-item>

              <a-form-model-item>
                <a-button
                  type="primary"
                  :loading="isLoading"
                  @click="generateCSR"
                >
                  {{ $t("ssl_product.generate") }} CSR
                </a-button>
              </a-form-model-item>
            </a-form-model>
            <div v-else-if="result.result == 'success'">
              <a-alert
                style="margin: 10px"
                :message="$t('ssl_product.generator_warning_save_private_key')"
                type="warning"
                show-icon
              />
              <a-form-model-item label="CSR" has-feedback prop="">
                <a-textarea
                  :value="result.csr_code"
                  :auto-size="{ minRows: 10, maxRows: 10 }"
                />
              </a-form-model-item>
              <a-form-model-item
                :label="$t('ssl_product.private key (RSA)')"
                style="margin-top: 20px"
              >
                <a-textarea
                  :value="result.csr_key"
                  :auto-size="{ minRows: 10, maxRows: 10 }"
                />
              </a-form-model-item>
              <a-form-model-item>
                <router-link
                  :to="{
                    name: 'certificate',
                    params: {
                      csr: result.csr_code,
                      domain: generate.csr_commonname,
                      org_name: generate.csr_organization,
                      org_division: generate.csr_department,
                      org_city: generate.csr_city,
                      org_country: generate.csr_country,
                      org_region: generate.csr_state,
                    },
                  }"
                >
                  <a-button type="primary">
                    <a-icon type="left" />{{
                      $t("ssl_product.save and return")
                    }}
                  </a-button>
                </router-link>
                <a-button
                  style="margin-left: 10px"
                  @click="download('txt', result.csr_key)"
                >
                  {{ $t("ssl_product.download_private_key") }}
                </a-button>
              </a-form-model-item>
            </div>
          </div>
        </template>
        <loading v-else />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import { message } from 'ant-design-vue'
import i18n from '@/i18n.js'
import api from '@/api.js'
import { useAuthStore } from '@/stores/auth.js'

import { countries } from '@/setup/countries'
import loading from '@/components/loading/loading.vue'

const props = defineProps({
  domain: { type: String, required: true }
})

const authStore = useAuthStore()

const csrForm = ref(null)
const isLoading = ref(false)
const generate = ref({
  csr_commonname: '',
  csr_organization: '',
  csr_department: '',
  csr_city: '',
  csr_state: '',
  csr_country: '',
  csr_email: ''
})

const result = ref({
  csr_code: '',
  csr_key: '',
  result: 'pending'
})

const rules = {
  csr_commonname: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  csr_organization: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  csr_department: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],

  csr_email: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],

  csr_city: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  csr_state: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ],
  csr_country: [
    {
      required: true,
      message: `${i18n.t('ssl_product.field is required')}`
    }
  ]
}

function download (ext, text) {
  const domain = generate.value.csr_commonname
  const filename = `${domain.replace('.', '_')}.${ext}`
  const element = document.createElement('a')

  element.setAttribute(
    'href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
  )
  element.setAttribute('download', filename)
  element.style.display = 'none'

  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

async function fetchInfo () {
  try {
    await authStore.fetchBillingData()

    installDataToBuffer()
  } catch (error) {
    console.error(error)
  }
}

function installDataToBuffer () {
  generate.value.csr_organization = authStore.billingUser.companyname
  generate.value.csr_email = authStore.billingUser.email
  generate.value.csr_country = authStore.billingUser.country
  generate.value.csr_city = authStore.billingUser.city
  generate.value.csr_state = authStore.billingUser.state
}

function generateCSR () {
  csrForm.value.validate(async (valid) => {
    if (!valid) {
      message.error(`${i18n.t('ssl_product.fields is required')}`)
      return false
    }
    try {
      isLoading.value = true
      const response = await api.sendAsUser(
        'moduleTouch',
        { ...generate.value, path: 'goget/generateCSR' },
        'moduleTouch.phpgoget'
      )

      if (response.error) throw response

      result.value.result = 'success'
      result.value.csr_code = response.csr_code
      result.value.csr_key = response.csr_key
    } catch (error) {
      message.error(error.description)
      result.value.result = 'failed'

      console.error(error)
    } finally {
      isLoading.value = false
    }
  })
}

function retry () {
  result.value.csr_code = ''
  result.value.csr_key = ''
  result.value.result = 'pending'
}

generate.value.csr_commonname = props.domain
fetchInfo()
</script>

<script>
export default { name: 'SslGenerator' }
</script>

<style>
.ssl-generator {
  padding-top: 20px;
}

.generator__wrapper {
  background-color: #fff;
  border-radius: 20px;
  padding: 15px;
}

.generator__submit {
  margin-top: 20px;
}

.button--icon {
  font-size: 1.3rem;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  width: 43px;
  height: 43px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: color 0.3s ease, background-color 0.4s ease;
}

.button--icon:hover {
  /* color: var(--main); */
  background-color: var(--main);
  color: #fff;
}

.generate-page {
  padding-top: 20px;
}
.generate-page-card {
  background: #fff;
  border-radius: 10px;
  padding: 10px 15px 15px;
}
.generate-page__title {
  font-size: 1.4em;
  margin-bottom: 30px;
  font-weight: 500;
}
.generate__block {
  margin-top: 40px;
}
@media screen and (max-width: 768px) {
  .generate-page {
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
