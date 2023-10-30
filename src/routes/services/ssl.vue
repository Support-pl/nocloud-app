<template>
  <div class="ssl-page">
    <div class="container">
      <div class="ssl-page-card">
        <template v-if="data">
          <div v-if="data.name" class="ssl__top">
            <div class="ssl-page__info">
              <div class="ssl-page__info-title">
                {{ $t("ssl_product.registration_date") }}
              </div>

              <span>{{
                new Intl.DateTimeFormat().format(new Date(data.regdate))
              }}</span>
            </div>
            <div class="ssl-page__info">
              <div class="ssl-page__info-title">
                {{ $t("ssl_product.product_service") }}
              </div>

              <span>{{ $t("ssl_product.SSL certificate") }} - {{ data.name }}
                <a-tag :color="getTagColor">
                  {{ $t(data.status) }}
                </a-tag></span>
              <a :href="data.domain">{{ data.domain }}</a>
            </div>
            <a-row>
              <a-col :md="12" :xs="12" :sm="12">
                <div class="ssl-page__info">
                  <div class="ssl-page__info-title">
                    {{ $t("ssl_product.first_payment") }}
                  </div>
                  <span>{{ data.firstpaymentamount }} BYN</span>
                </div>
              </a-col>
              <a-col :md="12" :xs="12" :sm="12">
                <div class="ssl-page__info">
                  <div class="ssl-page__info-title">
                    {{ $t("ssl_product.renewal_amount") }}
                  </div>
                  <span>{{ data.recurringamount }} BYN</span>
                </div>
              </a-col>
              <a-col :md="12" :xs="12" :sm="12">
                <div class="ssl-page__info">
                  <div class="ssl-page__info-title">
                    {{ $t("ssl_product.payment_cycle") }}
                  </div>
                  <span>{{ $t("ssl_product." + data.billingcycle) }}</span>
                </div>
              </a-col>
              <a-col :md="12" :xs="12" :sm="12">
                <div class="ssl-page__info">
                  <div class="ssl-page__info-title">
                    {{ $t("ssl_product.next_payment_date") }}
                  </div>
                  <span>{{
                    new Intl.DateTimeFormat().format(new Date(data.nextduedate))
                  }}</span>
                </div>
              </a-col>
            </a-row>
            <div class="ssl-page__info">
              <div class="ssl-page__info-title">
                {{ $t("ssl_product.payment_method") }}
              </div>
              <span>{{ data.paymentmethodname }}</span>
            </div>
          </div>

          <div class="ssl__table">
            <!-- <div class="ssl__table__item">
              <div>{{ $t("ssl_product.status") }}</div>
              <div>{{ $t("ssl_product." + data.SSL.sslstatus) }}</div>
            </div> -->

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.ssl_status") }}</div>
              <div>{{ $t("ssl_product." + data.SSL.configdata.status) }}</div>
            </div>

            <div
              v-if="data.SSL.configdata.status == 'active'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.valid_from") }}</div>
              <div>{{ data.SSL.configdata.valid_from }}</div>
            </div>

            <div
              v-if="data.SSL.configdata.status == 'active'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.expires") }}</div>
              <div>{{ data.SSL.configdata.valid_till }}</div>
            </div>

            <div
              v-if="data.SSL.configdata.status == 'active'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.subscription_starts") }}</div>
              <div>{{ data.SSL.configdata.begin_date }}</div>
            </div>

            <div
              v-if="data.SSL.configdata.status == 'active'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.subscription_ends") }}</div>
              <div>{{ data.SSL.configdata.end_date }}</div>
            </div>

            <div
              v-if="data.SSL.configdata.status == 'active'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.next_renewal") }}</div>
              <div><b>Renew SSL within 91 days</b></div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.domain") }}:</div>
              <div>{{ data.SSL.configdata.domain }}</div>
            </div>

            <div
              v-if="data.SSL.configdata.dcv_method === 'email'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.approver_email") }}</div>
              <div>{{ data.SSL.configdata.approver_method.email }}</div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.partner_order_id") }}</div>
              <div>{{ data.SSL.configdata.order_id }}</div>
            </div>

            <div
              v-if="data.SSL.configdata.dcv_method === 'dns'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.dns_cname_record") }}</div>
              <div>
                <a-textarea
                  :value="data.SSL.configdata.approver_method.dns.record"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>

            <div
              v-if="method.includes(data.SSL.configdata.dcv_method)"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.hash_file") }}</div>
              <div>
                <a-textarea
                  :value="
                    data.SSL.configdata.approver_method[
                      data.SSL.configdata.dcv_method
                    ].link
                  "
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>

            <div
              v-if="method.includes(data.SSL.configdata.dcv_method)"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.content") }}</div>
              <div>
                <a-textarea
                  :value="
                    data.SSL.configdata.approver_method[
                      data.SSL.configdata.dcv_method
                    ].content
                  "
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>
            <!-- ---------------------------------- -->
            <div
              v-if="data.SSL.configdata.status == 'active'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.certificate_crt") }}</div>
              <div>
                <a-textarea
                  :value="data.SSL.configdata.crt_code"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>

            <div
              v-if="data.SSL.configdata.status == 'active'"
              class="ssl__table__item"
            >
              <div>{{ $t("ssl_product.intermediate_chanfiles") }}</div>
              <div>
                <a-textarea
                  :value="data.SSL.configdata.ca_code"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>
            <!-- ---------------------------- -->
            <div
              v-if="method.includes(data.SSL.configdata.dcv_method)"
              class="ssl__table__item"
            >
              <div>SANs:</div>
              <div class="ssl__table__item-sans__wrap">
                <div class="ssl__table__item-sans" style="padding: 0">
                  <div class="ssl__table__item-sans__item">
                    {{ data.SSL.configdata.san[0].san_name }}
                  </div>
                  <div class="ssl__table__item-sans__item">
                    <div>{{ $t("ssl_product.hash_file") }}</div>
                    <div>
                      <a-textarea
                        :value="
                          data.SSL.configdata.approver_method[
                            data.SSL.configdata.dcv_method
                          ].link
                        "
                        :auto-size="{ minRows: 2, maxRows: 6 }"
                      />
                    </div>
                  </div>
                  <div class="ssl__table__item-sans__item">
                    <div>{{ $t("ssl_product.content") }}</div>
                    <div>
                      <a-textarea
                        :value="
                          data.SSL.configdata.approver_method[
                            data.SSL.configdata.dcv_method
                          ].content
                        "
                        :auto-size="{ minRows: 2, maxRows: 6 }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.certificate_signing_request") }}</div>
              <div>
                <a-textarea
                  :value="data.SSL.configdata.csr_code"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                />
              </div>
            </div>

            <div class="ssl__table__item">
              <div>{{ $t("ssl_product.actions") }}</div>
              <div class="ssl__table__item__button__wrap">
                <a-button v-if="data.SSL.configdata.status == 'active'">
                  <router-link
                    :to="{
                      name: 'certificate',
                      params: { reissue: true },
                    }"
                  >
                    {{ $t("ssl_product.reissue_certificate") }}
                  </router-link>
                </a-button>

                <a-button
                  v-if="data.SSL.configdata.status == 'processing'"
                  @click="modal.confirmCreate = true"
                >
                  {{ $t("ssl_product.Domain Validation method") }}
                </a-button>

                <a-button
                  v-if="
                    data.SSL.configdata.status === 'processing' &&
                      data.SSL.configdata.dcv_method === 'email'
                  "
                  :loading="resendLoading"
                  @click="resendValidationEmail"
                >
                  {{ $t("ssl_product.Resend Validation Email") }}
                </a-button>

                <a-button
                  v-if="
                    data.SSL.configdata.status === 'processing' &&
                      methodRevalidate.includes(data.SSL.configdata.dcv_method)
                  "
                  :loading="revalidateLoading"
                  @click="revalidate"
                >
                  {{ $t("ssl_product.Revalidate") }}
                </a-button>

                <a-button
                  v-if="method.includes(data.SSL.configdata.dcv_method)"
                  @click="
                    download(
                      'txt',
                      data.SSL.configdata.approver_method[
                        data.SSL.configdata.dcv_method
                      ].content,
                      data.SSL.configdata.approver_method[
                        data.SSL.configdata.dcv_method
                      ].filename
                    )
                  "
                >
                  {{ $t("ssl_product.download_validation_file") }}
                </a-button>

                <div v-for="(val, key) of fileinfo" :key="key">
                  <a-button
                    v-if="data.SSL.configdata.status == 'active'"
                    @click="download(key, data.SSL.configdata[val])"
                  >
                    {{ $t("ssl_product.download") }} {{ key.toUpperCase() }}
                  </a-button>
                </div>

                <a-modal
                  :title="$t('Confirm')"
                  :open="modal.confirmCreate"
                  :confirm-loading="modal.confirmLoading"
                  :cancel-text="$t('Cancel')"
                  @ok="handleOk"
                  @cancel="handleCancel"
                >
                  <a-form :model="actionData">
                    <a-form-item :label="$t('ssl_product.DCV Method')">
                      <a-select v-model:value="actionData.dcv">
                        <a-select-option v-for="item in dcvList" :key="item">
                          {{ item }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>

                    <a-form-item
                      v-if="actionData.dcv === 'EMAIL'"
                      :label="$t('ssl_product.email')"
                    >
                      <a-select v-model:value="actionData.email">
                        <a-select-option
                          v-for="item in emailList"
                          :key="item"
                          :value="`${item}${data.domain}`"
                        >
                          {{ item }}{{ data.domain }}
                        </a-select-option>
                      </a-select>
                    </a-form-item>
                  </a-form>
                </a-modal>
              </div>
            </div>
          </div>
        </template>
        <loading v-else />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import api from '@/api.js'

import { useInstancesStore } from '@/stores/instances.js'
import loading from '@/components/ui/loading.vue'

const route = useRoute()
const instancesStore = useInstancesStore()

const method = ['http', 'https']
const methodRevalidate = ['http', 'https', 'dns']
const dcvList = ['EMAIL', 'HTTP', 'HTTPS', 'DNS']
const emailList = [
  'admin@',
  'administrator@',
  'hostmaster@',
  'webmaster@',
  'postmaster@'
]

const data = ref({})
const actionData = ref({ dcv: 'EMAIL' })
const fileinfo = ref({
  csr: 'csr_code',
  crt: 'crt_code',
  ca: 'ca_code'
})

const resendLoading = ref(false)
const revalidateLoading = ref(false)
const modal = ref({
  confirmCreate: false,
  confirmLoading: false
})

const getTagColor = computed(() => {
  switch (data.value.status) {
    case 'Active':
      return 'green'
    case 'Pending':
      return 'orange'
    case 'Cancelled':
      return 'red'
    default:
      return ''
  }
})

async function fetch () {
  try {
    const domain = instancesStore.getInstances.find(
      ({ uuid }) => uuid === route.params.id
    )

    const { meta } = await instancesStore.invokeAction({
      uuid: domain.uuid,
      uuidService: domain.uuidService,
      action: 'monitoring'
    })

    data.value = { SSL: { configdata: meta.data } }
    actionData.value.email = `admin@${meta.data.domain}`
  } catch (error) {
    console.error(error)
  }
}

function download (ext, text, filename = null) {
  const domain = data.value.SSL.configdata.domain

  if (!filename) {
    filename = `${domain.replace('.', '_')}.${ext}`
  }

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

async function revalidate () {
  const params = {
    remoteid: data.value.SSL.remoteid,
    domain: data.value.SSL.configdata.domain
  }

  try {
    revalidateLoading.value = true
    const response = await api.sendAsUser(
      'moduleTouch',
      { ...params, path: 'ssl/revalidate' },
      'moduleTouch.phpssl'
    )

    if (response.error) throw response
    if (response.success) {
      message.success(response.message)
    }
  } catch (error) {
    console.error(error)
    message.error(error.description)
  } finally {
    revalidateLoading.value = false
  }
}

async function resendValidationEmail () {
  const params = {
    remoteid: data.value.SSL.remoteid
  }

  try {
    resendLoading.value = true
    const response = await api.sendAsUser(
      'moduleTouch',
      { ...params, path: 'ssl/resendValidationEmail' },
      'moduleTouch.phpssl'
    )

    if (response.error) throw response
    if (response.success) {
      message.success(response.message)
    }
  } catch (error) {
    console.error(error)
    message.error(error.description)
  } finally {
    resendLoading.value = false
  }
}

async function handleOk () {
  const params = {
    remoteid: data.value.SSL.remoteid,
    dcv: (actionData.value.dcv === 'EMAIL')
      ? actionData.value.email
      : actionData.value.dcv,
    domain: data.value.SSL.configdata.domain
  }

  try {
    modal.value.confirmLoading = true
    const response = await api.sendAsUser(
      'moduleTouch',
      { ...params, path: 'ssl/changeValidationMethod' },
      'moduleTouch.phpssl'
    )

    if (response.error) throw response
    if (response.success) location.reload()
  } catch (error) {
    console.error(error)
    this.$message.error(error.description)
  } finally {
    modal.value.confirmLoading = false
  }
}

function handleCancel () {
  modal.value.confirmCreate = false
}

if (instancesStore.getInstances.length < 1) {
  instancesStore.fetch().then(fetch)
} else fetch()
</script>

<script>
export default { name: 'SslCertificate' }
</script>

<style scoped>
.ssl-page {
  padding-top: 20px;
}
.ssl-page-card {
  background: var(--bright_font);
  border-radius: 10px;
  padding: 10px 15px 15px;
  margin-bottom: 20px;
}
.ssl-page__info {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
}
.ssl-page__info-title {
  font-weight: bold;
}
.ssl__payment .ssl-page__info {
  width: 50%;
}
.ssl__table {
  display: flex;
  flex-wrap: wrap;
  border: 1px solid #d9d9d9;
  margin-top: 30px;
}
.ssl__table__item {
  width: 100%;
  display: flex;
  border-bottom: 1px solid #d9d9d9;
}
.ssl__table__item:last-child {
  border-bottom: 0;
}
.ssl__table__item > div {
  padding: 20px 10px;
  display: flex;
  align-items: center;
}
.ssl__table__item div:first-child {
  border-right: 1px solid #d9d9d9;
  font-weight: 500;
  width: 30%;
}
.ssl__table__item div:last-child {
  width: 70%;
}
.ssl__table__item .ssl__table__item-sans__wrap .ssl__table__item-sans {
  width: 100%;
  display: flex;
  flex-direction: column;
  border-right: 0;
}
.ssl__table__item .ssl__table__item-sans__wrap .ssl__table__item-sans__item {
  padding: 0;
  width: 100%;
  border-bottom: 1px solid #d9d9d9;
  display: flex;
}
.ssl__table__item .ssl__table__item-sans__wrap {
  padding: 0;
}
.ssl__table__item .ssl__table__item-sans__item:first-child {
  padding: 20px 10px;
  font-weight: normal;
  border-right: 0;
}
.ssl__table__item
  .ssl__table__item-sans__wrap
  .ssl__table__item-sans__item:last-child {
  border-bottom: 0;
}
.ssl__table__item-sans__item div {
  padding: 20px 10px;
  display: flex;
  align-items: center;
}
.ssl__table__item-sans__item div:first-child {
  width: 20%;
}
.ssl__table__item-sans__item div:last-child {
  padding: 20px 10px;
  width: 80%;
}
.ssl__table__item__button__wrap {
  flex-wrap: wrap;
}
.ssl__table__item__button__wrap > div {
  margin: 5px;
}
.ssl__table__item__button__wrap > button {
  margin: 5px;
}
@media screen and (max-width: 768px) {
  .ssl__table__item .ssl__table__item-sans__wrap .ssl__table__item-sans {
    overflow-x: scroll;
  }
  .ssl__table__item .ssl__table__item-sans__wrap .ssl__table__item-sans__item {
    width: 600px;
  }
}
</style>
