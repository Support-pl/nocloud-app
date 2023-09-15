<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__inputs order__field">
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
        <a-row :gutter="[10, 10]" style="margin-bottom: 10px">
          <a-col v-if="services.length > 1">
            <a-select v-model="service" style="width: 100%" placeholder="services">
              <a-select-option
                v-for="item of services"
                :key="item.uuid"
                :value="item.uuid"
              >
                {{ item.title }}
              </a-select-option>
            </a-select>
          </a-col>

          <a-col v-if="namespaces.length > 1">
            <a-select v-model="namespace" style="width: 100%" placeholder="namespaces">
              <a-select-option
                v-for="name of namespaces"
                :key="name.uuid"
                :value="name.uuid"
              >
                {{ name.title }}
              </a-select-option>
            </a-select>
          </a-col>

          <a-col v-if="plans.length > 1">
            <a-select v-model="plan" style="width: 100%" placeholder="plans">
              <a-select-option
                v-for="item of plans"
                :key="item.uuid"
                :value="item.uuid"
              >
                {{ item.title }}
              </a-select-option>
            </a-select>
          </a-col>
        </a-row>

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
            <div v-if="!fetchLoading" style="text-align: right">
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
            <div v-if="!fetchLoading" style="text-align: right">
              {{ getProducts.outputKilotoken }} {{ currency.code }}
            </div>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button type="primary" block shape="round" @click="orderConfirm">
              {{ $t("order") | capitalize }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :visible="modal.confirmCreate"
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
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { notification } from 'ant-design-vue'
import store from '@/store'
import router from '@/router'
import i18n from '@/i18n.js'
import api from '@/api.js'

const route = router.currentRoute

const plan = ref(null)
const service = ref(null)
const namespace = ref(null)
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

  return {
    title,
    inputKilotoken,
    outputKilotoken,
    price: inputKilotoken + outputKilotoken,
    description: `<span style="font-size: 18px">
      You can think of tokens as pieces of words used for natural language processing. For English text, 1 token is approximately 4 characters or 0.75 words.
    </span>`
  }
})

const isLogged = computed(() =>
  store.getters['nocloud/auth/isLoggedIn']
)

const user = computed(() =>
  store.getters['nocloud/auth/billingData']
)

const userdata = computed(() =>
  store.getters['nocloud/auth/userdata']
)

const currency = computed(() => {
  const currencies = store.getters['nocloud/auth/currencies']
  const defaultCurrency = store.getters['nocloud/auth/defaultCurrency']

  const code = store.getters['nocloud/auth/unloginedCurrency']
  const { rate } = currencies.find((el) =>
    el.to === code && el.from === defaultCurrency
  ) ?? {}

  const { rate: reverseRate } = currencies.find((el) =>
    el.from === code && el.to === defaultCurrency
  ) ?? { rate: 1 }

  if (!isLogged.value) return { rate: (rate) || 1 / reverseRate, code }
  return { rate: 1, code: user.value.currency_code ?? defaultCurrency }
})

const services = computed(() =>
  store.getters['nocloud/vms/getServices'].filter((el) => el.status !== 'DEL')
)

const namespaces = computed(() =>
  store.getters['nocloud/namespaces/getNameSpaces'] ?? []
)

const plans = computed(() =>
  store.getters['nocloud/plans/getPlans']
    .filter(({ type, uuid }) => {
      const { plans } = store.getters['nocloud/sp/getShowcases'].find(
        ({ uuid }) => uuid === route.query.service
      ) ?? {}

      if (!plans) return type === 'openai'

      if (plans.length < 1) return type === 'openai'
      return type === 'openai' && plans.includes(uuid)
    })
)

watch(namespaces, (value) => {
  namespace.value = value[0]?.uuid
})

watch(services, (value) => {
  service.value = value[0]?.uuid
})

watch(plans, (value) => {
  plan.value = value[0]?.uuid
})

const sp = computed(() =>
  store.getters['nocloud/sp/getSP'].find((sp) => sp.type === 'openai')
)

function orderClickHandler () {
  const serviceItem = services.value.find(({ uuid }) => uuid === service.value)
  const planItem = plans.value.find(({ uuid }) => uuid === plan.value)

  const instances = [{
    config: { user: userdata.value.uuid },
    title: getProducts.value.title,
    billing_plan: planItem ?? {}
  }]
  const newGroup = {
    title: user.value.fullname + Date.now(),
    type: sp.value.type,
    sp: sp.value.uuid,
    instances
  }

  if (planItem.kind === 'STATIC') instances[0].product = ''

  const info = (!service.value) ? newGroup : JSON.parse(JSON.stringify(serviceItem))
  const group = info.instancesGroups?.find(({ type }) => type === 'openai')

  if (group) group.instances = [...group.instances, ...instances]
  else if (service.value) info.instancesGroups.push(newGroup)

  if (!userdata.value.uuid) {
    store.commit('setOnloginRedirect', route.name)
    store.commit('setOnloginInfo', {
      type: 'openai',
      title: 'OpenAI',
      cost: getProducts.value.price,
      currency: currency.value.code
    })
    store.dispatch('setOnloginAction', () => {
      createOpenAI(info)
    })

    router.push({ name: 'login' })
    return
  }

  createOpenAI(info)
}

function createOpenAI (info) {
  modal.value.confirmLoading = true
  const action = (service.value) ? 'update' : 'create'
  const orderData = (service.value)
    ? info
    : {
        namespace: namespace.value,
        service: {
          title: user.value.fullname,
          context: {},
          version: '1',
          instancesGroups: [info]
        }
      }

  store.dispatch(`nocloud/vms/${action}Service`, orderData)
    .then(({ uuid }) => { deployService(uuid) })
    .catch((err) => {
      const config = { namespace: namespace.value, service: orderData }
      const message = err.response?.data?.message ?? err.message ?? err

      api.services.testConfig(config)
        .then(({ result, errors }) => {
          if (!result) {
            errors.forEach(({ error }) => {
              notification.error({ message: error })
            })
          }
        })
      notification.error({ message: i18n.t(message) })
      console.error(err)
    })
}

function orderConfirm () {
  modal.value.confirmCreate = true
}

function deployService (uuid) {
  api.services.up(uuid)
    .then(() => {
      notification.success({ message: i18n.t('Done') })
      router.push({ path: '/services' })
    })
    .catch((err) => {
      const message = err.response?.data?.message ?? err.message ?? err

      notification.error({ message: i18n.t(message) })
    })
    .finally(() => {
      modal.value.confirmLoading = false
    })
}

onMounted(() => {
  const { action } = store.getters.getOnlogin

  if (typeof action !== 'function') return
  modal.value.confirmCreate = true
  modal.value.confirmLoading = true
  action()
})

function fetch () {
  fetchLoading.value = true
  const promises = [
    store.dispatch('nocloud/auth/fetchBillingData'),
    store.dispatch('nocloud/sp/fetch', !isLogged.value),
    store.dispatch('nocloud/plans/fetch', { anonymously: !isLogged.value })
  ]

  if (isLogged.value) {
    promises.push(
      store.dispatch('nocloud/namespaces/fetch'),
      store.dispatch('nocloud/vms/fetch')
    )
  }

  Promise.all(promises).catch((err) => {
    const message = err.response?.data?.message ?? err.message ?? err

    if (err.response?.data?.code === 16) return
    notification.error({ message: i18n.t(message) })
    console.error(err)
  }).finally(() => {
    fetchLoading.value = false
  })

  if (store.getters['nocloud/auth/currencies'].length < 1) {
    store.dispatch('nocloud/auth/fetchCurrencies')
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
  margin-top: 15px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 1024px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
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

.order__inputs {
  margin-right: 20px;
  width: 72%;
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
  background-color: #fff;
  height: max-content;
}

.order__calculate {
  width: 28%;
  font-size: 1.1rem;
  padding: 10px 15px 10px;
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
  color: #fff;
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

.specs-enter{
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
    flex-direction: column;
    padding: 10px;
    margin-top: 0px;
    overflow: auto;
  }

  .order__inputs {
    margin: 0;
    border-radius: 20px 20px 0 0;
    width: auto;
  }

  .order__field {
    box-shadow: none;
    flex-grow: 0;
  }

  .order__calculate {
    border-radius: 0 0 20px 20px;
    width: auto;
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
