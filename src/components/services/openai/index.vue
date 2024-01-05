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

        <a-row
          v-if="getProducts.inputKilotoken > 0"
          type="flex"
          justify="space-around"
          align="middle"
        >
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            Input kilotoken:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12">
            <div v-if="!fetchLoading" style="font-size: 1.1rem; text-align: right">
              {{ getProducts.inputKilotoken }} {{ currency.code }}
            </div>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <a-row
          v-if="getProducts.outputKilotoken > 0"
          style="margin-top: 10px"
          type="flex"
          justify="space-around"
          align="middle"
        >
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            Output kilotoken:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12">
            <div v-if="!fetchLoading" style="font-size: 1.1rem; text-align: right">
              {{ getProducts.outputKilotoken }} {{ currency.code }}
            </div>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button type="primary" block shape="round" @click="orderConfirm">
              {{ capitalize($t("order")) }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="() => { modal.confirmCreate = false }"
            >
              <p>{{ $t('order_services.Do you want to order') }}: {{ getProducts.title }}</p>
            </a-modal>
          </a-col>
        </a-row>
      </div>

      <promo-block class="order__promo" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { notification } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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

const router = useRouter()
const route = useRoute()
const i18n = useI18n()

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
  const { resources, title } = plans.value.find(({ uuid }) => uuid === plan.value) ?? {}
  if (!resources) return 'NAN'

  const products = Object.values(resources).reduce(
    (result, resource) => ({
      ...result, [resource.key]: resource.price
    }), {}
  )
  const inputKilotoken = +(products.input_kilotoken * currency.value.rate).toFixed(2)
  const outputKilotoken = +(products.output_kilotoken * currency.value.rate).toFixed(2)
  let description

  switch (i18n.locale.value) {
    case 'ru':
      description = 'Представьте себе, что «токен» - это фрагмент слова, используемый для обработки естественного языка. Для текста на английском 1 токен составляет примерно 4 символа или 0,75 слова. Для русского языка один токен примерно равен 2 символам или 0,25 слова.'
      break

    default:
      description = 'You can think of tokens as pieces of words used for natural language processing. For English text, 1 token is approximately 4 characters or 0.75 words.'
      break
  }

  return {
    title,
    inputKilotoken,
    outputKilotoken,
    price: inputKilotoken + outputKilotoken,
    description: `<span style="font-size: 18px">
      ${description}
    </span>`
  }
})

const currency = computed(() => {
  const { currencies, defaultCurrency } = storeToRefs(currenciesStore)
  const { userdata: user } = storeToRefs(authStore)
  const code = currenciesStore.unloginedCurrency

  const { rate } = currencies.value.find((el) =>
    el.to === code && el.from === defaultCurrency.value
  ) ?? {}

  const { rate: reverseRate } = currencies.value.find((el) =>
    el.from === code && el.to === defaultCurrency.value
  ) ?? { rate: 1 }

  if (!authStore.isLogged) return { rate: (rate) || 1 / reverseRate, code }
  return { rate: 1, code: user.value.currency ?? defaultCurrency.value }
})

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
    plan.value = pool[0]?.uuid
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message })
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
    const config = { namespace: namespace.value, service: orderData }
    const message = error.response?.data?.message ?? error.message ?? error

    const { result, errors } = await api.services.testConfig(config)

    notification.error({ message: i18n.t(message) })
    if (!result) {
      errors.forEach(({ error }) => {
        notification.error({ message: error })
      })
    }
  }
}

function orderConfirm () {
  modal.value.confirmCreate = true
}

async function deployService (uuid) {
  try {
    await api.services.up(uuid)

    notification.success({ message: i18n.t('Done') })
    router.push({ path: '/services' })
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
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
    notification.error({ message: i18n.t(message) })

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

<style>
.order_wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order {
  position: absolute;
  left: 50%;
  display: grid;
  grid-template-columns: calc(72% - 20px) 28%;
  gap: 20px;
  width: 100%;
  max-width: 1024px;
  margin-top: 15px;
  margin-bottom: 15px;
  transform: translateX(-50%);
}

.order .ant-slider-mark-text {
  white-space: nowrap;
}

.order .ant-slider-mark-text:first-of-type {
  transform: translateX(-10px) !important;
}

.order .ant-slider-mark-text:last-of-type {
  transform: translateX(calc(-100% + 10px)) !important;
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

.order__slider {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 10px;
  overflow-x: auto;
}

.order__slider-item:not(:last-child) {
  margin-right: 10px;
}

.order__slider-item {
  flex-shrink: 0;
  /* border: 1px solid rgba(0, 0, 0, .15); */
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  height: 100%;
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1.1rem;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active {
  background-color: var(--main);
  color: var(--bright_font);
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

.loadingLine--total {
  margin-top: 10px;
  height: 26px;
}

.loadingLine--image {
  min-width: 60px;
  width: 60px;
  height: 60px;
  margin: auto;
  margin-bottom: 15px;
}

.specs-enter-active,
.specs-leave-active {
  transition: all .15s ease;
}

.specs-enter-from {
  transform: translateX(-1em);
  opacity: 0;
}

.specs-leave-to{
  transform: translateX(1em);
  opacity: 0;
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
