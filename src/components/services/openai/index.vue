<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__field">
        <div class="order__option">
          <transition name="specs" mode="out-in">
            <div
              v-if="typeof getProducts.description === 'string'"
              v-html="getProducts.description"
            />
            <table v-else-if="getProducts.description" class="product__specs">
              <tr v-for="resource in getProducts.description" :key="resource.name">
                <td>{{ resource.name }}</td>
                <td>{{ resource.value }}</td>
              </tr>
            </table>
          </transition>
        </div>
      </div>

      <div class="order__calculate order__field">
        <selects-to-create
          v-model:plan="plan"
          v-model:service="service"
          v-model:namespace="namespace"
          v-model:provider="provider"
          style="margin-bottom: 10px"
          :plans-list="plans"
          :sp-list="sp"
        />

        <a-badge class="order__pricing">
          <template #count>
            <a-tooltip placement="bottom">
              <template #title>
                {{ $t('openai description 2') }}
              </template>
              <question-icon style="font-size: 22px" two-tone-color="#ff9140" />
            </a-tooltip>
          </template>

          <template v-for="key of keys" :key="key.value">
            <a-row
              v-if="getProducts[key.value] > 0"
              type="flex"
              justify="space-around"
              align="middle"
            >
              <a-col :xs="12" :sm="18" :lg="16" style="font-size: 1rem">
                {{ key.title }}:
              </a-col>
              <a-col :xs="12" :sm="6" :lg="8">
                <div v-if="!fetchLoading" class="order__price">
                  {{ getProducts[key.value] }} {{ currency.code }}
                </div>
                <div v-else class="loadingLine" />
              </a-col>
            </a-row>
          </template>
        </a-badge>

        <a-row type="flex" justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button type="primary" block shape="round" @click="orderConfirm">
              {{ capitalize($t('activate')) }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="() => { modal.confirmCreate = false }"
            >
              <p>{{ $t('order_services.Do you want to activate') }}: {{ getProducts.title }}</p>
            </a-modal>
          </a-col>
        </a-row>
      </div>

      <promo-block class="order__promo" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, reactive, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCurrency, useNotification } from '@/hooks/utils'
import api from '@/api.js'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'
import { useInstancesStore } from '@/stores/instances.js'

import selectsToCreate from '@/components/ui/selectsToCreate.vue'
import promoBlock from '@/components/ui/promo.vue'

const questionIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/QuestionCircleTwoTone')
)

const router = useRouter()
const route = useRoute()
const i18n = useI18n()
const { openNotification } = useNotification()
const { currency } = useCurrency()

const appStore = useAppStore()
const authStore = useAuthStore()
const currenciesStore = useCurrenciesStore()

const spStore = useSpStore()
const plansStore = usePlansStore()
const namespacesStore = useNamespasesStore()
const instancesStore = useInstancesStore()

const plan = ref(null)
const service = ref(null)
const namespace = ref(null)
const provider = ref(null)

const cachedPlans = reactive({})
const fetchLoading = ref(false)

const modal = ref({ confirmCreate: false, confirmLoading: false })

const getProducts = computed(() => {
  const { resources, title, meta } = plans.value.find(({ uuid }) => uuid === plan.value) ?? {}
  if (!resources) return 'NAN'

  const products = Object.values(resources).reduce(
    (result, resource) => ({
      ...result, [resource.key]: resource.price
    }), {}
  )
  const inputKilotoken = +(products.input_kilotoken * currency.value.rate).toFixed(4)
  const outputKilotoken = +(products.output_kilotoken * currency.value.rate).toFixed(4)

  const size1024x1024 = +(products.image_size_1024x1024_quality_standard * currency.value.rate).toFixed(4)
  const size1024x1792 = +(products.image_size_1024x1792_quality_standard * currency.value.rate).toFixed(4)
  const size1024x1024HD = +(products.image_size_1024x1024_quality_hd * currency.value.rate).toFixed(4)
  const size1024x1792HD = +(products.image_size_1024x1792_quality_hd * currency.value.rate).toFixed(4)

  return {
    title,
    inputKilotoken,
    outputKilotoken,

    size1024x1024,
    size1024x1792,
    size1024x1024HD,
    size1024x1792HD,

    price: inputKilotoken + outputKilotoken,
    description: `<span style="font-size: 18px; white-space: pre-line">${
      meta.description || i18n.t('openai description')
    }</span>`
  }
})

const keys = [
  { title: 'Input kilotoken', value: 'inputKilotoken' },
  { title: 'Output kilotoken', value: 'outputKilotoken' },
  { title: 'Image 1024x1024', value: 'size1024x1024' },
  { title: 'HD image 1024x1024', value: 'size1024x1024HD' },
  { title: 'Image 1024x1792', value: 'size1024x1792' },
  { title: 'HD image 1024x1792', value: 'size1024x1792HD' }
]

const services = computed(() =>
  instancesStore.services.filter((el) => el.status !== 'DEL')
)

const plans = computed(() =>
  cachedPlans[provider.value]?.filter(({ type, uuid }) => {
    const { items } = spStore.showcases.find(
      ({ uuid }) => uuid === route.query.service
    ) ?? {}
    const plans = []

    if (!items) return type === 'openai'
    items.forEach(({ servicesProvider, plan }) => {
      if (servicesProvider === provider.value) {
        plans.push(plan)
      }
    })

    if (plans.length < 1) return type === 'openai'
    return type === 'openai' && plans.includes(uuid)
  }) ?? []
)

const sp = computed(() => {
  const { items } = spStore.showcases.find(
    ({ uuid }) => uuid === route.query.service
  ) ?? {}

  if (!items) return []
  return spStore.servicesProviders.filter(({ uuid }) =>
    items.find((item) => uuid === item.servicesProvider)
  )
})

watch(sp, (value) => {
  if (value.length > 0) provider.value = value[0].uuid
})

watch(provider, async (uuid) => {
  if (cachedPlans[uuid]) return
  try {
    const { pool } = await plansStore.fetch({
      anonymously: !authStore.isLogged, sp_uuid: uuid
    })

    cachedPlans[uuid] = pool
    plan.value = plans.value[0]?.uuid
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    openNotification('error', { message })
  }
})

function orderClickHandler () {
  const serviceItem = services.value.find(({ uuid }) => uuid === service.value)
  const planItem = plans.value.find(({ uuid }) => uuid === plan.value)

  const instances = [{
    config: {
      user: authStore.userdata.uuid,
      auto_start: planItem.meta.auto_start
    },
    title: getProducts.value.title,
    billing_plan: { uuid: plan.value },
    product: ''
  }]
  const newGroup = {
    title: authStore.userdata.title + Date.now(),
    type: 'openai',
    sp: provider.value,
    instances
  }

  const info = (!service.value) ? newGroup : JSON.parse(JSON.stringify(serviceItem))
  const group = info.instancesGroups?.find(({ sp }) => sp === provider.value)

  if (group) group.instances = [...group.instances, ...instances]
  else if (service.value) info.instancesGroups.push(newGroup)

  if (!authStore.userdata.uuid) {
    appStore.onLogin.redirect = route.name
    appStore.onLogin.info = {
      type: 'openai',
      title: 'OpenAI',
      cost: getProducts.value.price,
      currency: currency.value.code
    }
    appStore.onLogin.action = () => {
      createOpenAI(info)
    }

    router.push({ name: 'login' })
    return
  }

  createOpenAI(info)
}

async function createOpenAI (info) {
  modal.value.confirmLoading = true
  const action = (service.value) ? 'update' : 'create'
  const orderData = (service.value)
    ? info
    : {
        namespace: namespace.value,
        service: {
          title: authStore.userdata.title,
          context: {},
          version: '1',
          instancesGroups: [info]
        }
      }

  try {
    const { uuid } = await instancesStore[`${action}Service`](orderData)

    deployService(uuid)
  } catch (error) {
    const matched = (error.response?.data?.message ?? error.message ?? '').split(/error:"|error: "/)
    const message = matched.at(-1).split('" ').at(0)

    if (message) {
      openNotification('error', { message })
    } else {
      const message = error.response?.data?.message ?? error.message ?? error

      openNotification('error', { message })
    }
    console.error(error)
  }
}

function orderConfirm () {
  modal.value.confirmCreate = true
}

async function deployService (uuid) {
  try {
    await api.services.up(uuid)

    openNotification('success', { message: i18n.t('Done') })
    router.push({ path: '/services' })
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    openNotification('error', { message: i18n.t(message) })
  } finally {
    modal.value.confirmLoading = false
  }
}

onMounted(() => {
  const { action } = appStore.onLogin

  if (typeof action !== 'function') return
  modal.value.confirmCreate = true
  modal.value.confirmLoading = true
  action()
})

async function fetch () {
  try {
    fetchLoading.value = true
    const promises = [
      authStore.fetchBillingData(),
      spStore.fetch(!authStore.isLogged),
      spStore.fetchShowcases(!authStore.isLogged)
    ]

    if (authStore.isLogged) {
      promises.push(
        namespacesStore.fetch(),
        instancesStore.fetch()
      )
    }

    await Promise.all(promises)
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    if (error.response?.data?.code === 16) return
    openNotification('error', { message: i18n.t(message) })

    console.error(error)
  } finally {
    fetchLoading.value = false
  }

  if (currenciesStore.currencies.length < 1) {
    currenciesStore.fetchCurrencies()
  }
}

fetch()
</script>

<script>
export default { name: 'OpenaiComponent' }
</script>

<style scoped>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order {
  position: absolute;
  left: 50%;
  display: grid;
  grid-template-columns: calc(70% - 20px) 30%;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  margin-top: 15px;
  margin-bottom: 15px;
  transform: translateX(-50%);
}

.order__pricing {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--border_color);
  border-radius: 10px;
}

.order__pricing > :deep(.ant-row:not(:first-child)) {
  margin-top: 10px;
}

.order__price {
  font-size: 1.1rem;
  text-align: right;
  white-space: nowrap;
}

.product__specs {
  --color: rgb(126, 126, 126);
  color: var(--color);
  margin: 0 auto;
  --border-color: #dbdbdb;
  --border-line-weight: 1px;
  --border-line-type: solid;
  width: 80%;
  font-size: 1.2rem;
}

.product__specs td {
  padding: 10px 20px;
  position: relative;
}

.product__specs td:nth-child(1) {
  font-weight: 500;
}

.product__specs td:nth-child(2) {
  text-align: right;
  color: rgba(0, 0, 0, .7)
}

.product__specs tr {
  border-bottom: var(--border-line-weight) var(--border-line-type) var(--border-color);
}

.product__specs td:last-child::before {
  content: '';
  width: 2px;
  height: 50%;
  background: #f5f5f5;
  display: block;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.order__option div>.img_prod {
  display: block;
  max-width: 200px;
  margin: 0 auto 10px;
}

.order__option .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.order__option .order__slider-name img {
  max-height: 65px;
}

.order__field {
  border-radius: 20px;
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
  padding: 20px;
  background-color: var(--bright_font);
  height: max-content;
}

.order__calculate {
  padding: 10px 15px 10px;
  font-size: 1.1rem;
}

.loadingLine {
  min-width: 100px;
  width: 100%;
  height: 2rem;
  border-radius: 4px;
  animation-name: glowing;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

@keyframes glowing {
  from {
    background-color: #f2f2f2;
  }

  to {
    background-color: #e9e9e9;
    /* background-color: red; */
  }
}

@media screen and (max-width: 1024px) {
  .order {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }

  .order__field {
    box-shadow: none;
    border-radius: 20px 20px 0 0;
  }

  .order__calculate {
    width: auto;
    border-radius: 0 0 20px 20px;
  }

  .order__promo {
    margin-top: 20px;
  }
}

@media screen and (max-width: 576px) {
  .product__specs {
    width: 100%;
  }

  .product__specs td {
    padding: 3px 7px;
  }

  .product__specs td:last-child::before {
    transform: translate(-10px, -50%);
  }
}
</style>
