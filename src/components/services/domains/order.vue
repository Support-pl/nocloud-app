<template>
  <div class="order_wrapper">
    <div class="order-cart">
      <div class="order__inputs order__field-cart">
        <div class="order_option">
          <a-row class="order_option__steps" justify="center">
            <a-col :span="16">
              <!--TODO: add finish status if cart (watch to cart)-->
              <a-steps>
                <a-step class="search" status="start" :title="$t('search')" @click="search">
                  <template #icon>
                    <!---->
                    <search-icon />
                  </template>
                </a-step>
                <a-step class="cart" status="finish" :title="$t('cart')">
                  <!--@click="cart"-->
                  <template #icon>
                    <shopping-cart-icon />
                  </template>
                </a-step>
              </a-steps>
            </a-col>
            <a-col :span="2" class="badge-wrapper">
              <a-badge
                :count="itemsInCart"
                :offset="[0, -5]"
                show-zero
                :number-style="{
                  backgroundColor: 'var(--bright_font)',
                  color: '#999',
                  boxShadow: '0 0 0 1px #d9d9d9 inset'
                }"
              />
            </a-col>
          </a-row>

          <a-row :gutter="[10, 10]" align="bottom">
            <a-col span="12">
              <a-row :gutter="[10, 10]">
                <a-col>
                  {{ $t('Data for authorization in the control panel') }}:
                </a-col>
                <a-col span="24">
                  <a-input
                    v-model:value="resources.reg_username"
                    :placeholder="$t('clientinfo.username')"
                  />
                </a-col>
                <a-col span="24">
                  <password-meter
                    style="height: 10px; margin-top: 0"
                    :password="resources.reg_password"
                    @score="(value) => score = value.score"
                  />

                  <a-input-password
                    v-model:value="resources.reg_password"
                    :placeholder="$t('clientinfo.password')"
                  />
                </a-col>
              </a-row>
            </a-col>
            <a-col span="12">
              <a-row :gutter="[10, 10]">
                <a-col span="24">
                  {{ capitalize($t('advanced options')) }}:
                </a-col>
                <a-col span="24">
                  <a-switch v-model:checked="resources.auto_renew" size="small" />
                  {{ capitalize($t('domain_product.auto_renew')) }}
                </a-col>
                <a-col span="24">
                  <a-switch v-model:checked="resources.who_is_privacy" size="small" />
                  {{ capitalize($t('domain_product.who_is_privacy')) }} (3$)
                </a-col>
                <a-col span="24">
                  <a-switch v-model:checked="resources.lock_domain" size="small" />
                  {{ capitalize($t('domain_product.lock_domain')) }}
                </a-col>
              </a-row>
            </a-col>
          </a-row>

          <a-form ref="form" layout="vertical" :model="form">
            <a-row :gutter="[15, 10]" style="margin-top: 15px">
              <a-col span="24">
                {{ capitalize($t('user data')) }}:
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="first_name" :label="$t('clientinfo.firstname')" :rules="rules.req">
                  <a-input v-model:value="form.first_name" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="last_name" :label="$t('clientinfo.lastname')" :rules="rules.req">
                  <a-input v-model:value="form.last_name" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="email" :label="$t('clientinfo.email')" :rules="rules.req">
                  <a-input v-model:value="form.email" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="phone" :label="$t('clientinfo.phonenumber')" :rules="rules.req">
                  <a-input v-model:value="form.phone" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="country" :label="$t('clientinfo.countryname')" :rules="rules.req">
                  <a-select
                    v-model:value="form.country"
                    show-search
                    style="width: 100%"
                    :filter-option="searchCountries"
                  >
                    <a-select-option v-for="country in countries" :key="country.code">
                      {{ $t(`country.${country.code}`) }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="state" :label="$t('clientinfo.state')" :rules="rules.state">
                  <a-input v-model:value="form.state" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="city" :label="$t('clientinfo.city')" :rules="rules.req">
                  <a-input v-model:value="form.city" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="postal_code" :label="$t('clientinfo.postcode')" :rules="rules.postal_code">
                  <a-input v-model:value="form.postal_code" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="address1" :label="$t('clientinfo.address1')" :rules="rules.req">
                  <a-input v-model:value="form.address1" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="address2" :label="$t('clientinfo.address2')">
                  <a-input v-model:value="form.address2" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item name="org_name" :label="$t('clientinfo.companyname')" :rules="rules.req">
                  <a-input v-model:value="form.org_name" />
                </a-form-item>
              </a-col>
            </a-row>
          </a-form>

          <a-row class="order__prop" style="margin-bottom: 5px">
            <a-col span="8" :xs="6">
              {{ $t('domain_product.domain_in_your_cart') }}
            </a-col><!--{{capitalize($t('provider'))}}-->
          </a-row>
          <div class="description">
            <div v-if="!onCart.length" class="description-header">
              <question-circle-icon />
              <p>{{ $t('domain_product.your_cart_is_empty') }}</p>
            </div>
            <a-descriptions
              v-for="(domain,index) in onCart"
              :key="index"
              bordered
              class="description-body"
              :column="6"
            >
              <a-descriptions-item :span="1">
                <span class="description-body__domain-name">
                  {{ domain.name }}
                </span>
              </a-descriptions-item>
              <a-descriptions-item :span="3">
                <span class="description-body__domain-name">
                  {{ products[domain.name] && products[domain.name][resources.period] }}
                  {{ currency.code }}
                </span>
              </a-descriptions-item>
              <a-descriptions-item :span="2">
                <a-button
                  :key="index"
                  class="description-body__btn-order"
                  @click="removeFromCart(domain, index)"
                >
                  {{ $t('Delete') }}
                </a-button>
              </a-descriptions-item>
            </a-descriptions>
          </div>
          <!--<div class="order__slider">
            <template v-if="!fetchLoading">
              <div
                  class="order__slider-item"
                  v-for="provider of Object.keys(products)"
                  :key="provider"
                  :class="{'order__slider-item&#45;&#45;active': options.provider == provider}"
                  @click="() => options.provider = provider"
              >
                {{provider}}
              </div>
            </template>
            <template v-else>
              <div
                  class="order__slider-item order__slider-item&#45;&#45;loading"
                  v-for="(provider, index) of Array(4)"
                  :key="index"
              >
              </div>
            </template>
          </div>

          <a-row class="order__prop">
            <a-col span="8" :xs="6">{{capitalize($t('tarif'))}}:</a-col>
            <a-col span="16" :xs="18">
              <a-select v-if="!fetchLoading" v-model:value="options.tarif" style="width: 100%">
                <a-select-option v-for="kind of products[options.provider]" :value="kind.tarif" :key="kind.tarif">{{kind.tarif}}</a-select-option>
              </a-select>
              <div v-else class="loadingLine"></div>
            </a-col>
          </a-row>

          <a-row class="order__prop">
            <a-col span="8" :xs="6">777&lt;!&ndash;{{capitalize($t('domain'))}}&ndash;&gt;:</a-col>
            <a-col span="16" :xs="18">
              <a-input v-if="!fetchLoading" v-model:value="options.domain" placeholder="example.com"></a-input>
              <div v-else class="loadingLine"></div>
            </a-col>
          </a-row>-->
        </div>
      </div>

      <div class="order__calculate order__field-cart">
        <a-row justify="space-around" style="margin-top: 20px">
          <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t('Pay period') }}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg="12">
            <a-select v-model:value="resources.period" style="width: 100%">
              <!--v-if="!fetchLoading"-->
              <a-select-option v-for="period in periods" :key="period">
                {{ $tc('year', period) }}
              </a-select-option>
            </a-select>
            <!--<div v-else class="loadingLine"></div>-->
          </a-col>
        </a-row>

        <selects-to-create
          v-model:plan="plan"
          v-model:service="service"
          v-model:namespace="namespace"
          v-model:provider="provider"
          :plans-list="plans"
          :sp-list="sp"
        />

        <a-divider orientation="left" :style="{ marginBottom: 0 }">
          {{ $t('Total') }}:
        </a-divider>

        <a-row justify="space-around">
          <a-col v-if="!fetchLoading" style="font-size: 1.5rem">
            {{ getProducts().pricing[resources.period] }}
            {{ currency.code }}
          </a-col>
          <a-col v-else>
            <div class="loadingLine loadingLine--total" />
          </a-col>
        </a-row>

        <a-row justify="space-around" style="margin-top: 24px; margin-bottom: 10px">
          <a-col :span="22">
            <a-button
              block
              type="primary"
              shape="round"
              :disabled="!onCart.length || !namespace || !plan || !resources.reg_username || score < 4"
              @click="orderConfirm"
            >
              {{ capitalize($t("order")) }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="modal.confirmCreate = false"
            >
              <p>{{ $t('order_services.Do you want to order') }}: {{ getProducts()['name'] }}</p>
            </a-modal>
          </a-col>
        </a-row>
      </div>
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent, reactive, ref } from 'vue'
import { mapStores, mapState } from 'pinia'
import passwordMeter from 'vue-simple-password-meter'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useInstancesStore } from '@/stores/instances.js'

import { useSpStore } from '@/stores/sp.js'
import { usePlansStore } from '@/stores/plans.js'
import { useNamespasesStore } from '@/stores/namespaces.js'

import { useCurrency } from '@/hooks/utils'
import notification from '@/mixins/notification.js'
import countries from '@/assets/countries.json'
import selectsToCreate from '@/components/ui/selectsToCreate.vue'

const searchIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SearchOutlined')
)
const shoppingCartIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/ShoppingCartOutlined')
)
const questionCircleIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/QuestionCircleOutlined')
)
export default {
  name: 'DomainOrder',
  components: {
    passwordMeter,
    selectsToCreate,
    searchIcon,
    shoppingCartIcon,
    questionCircleIcon
  },
  mixins: [notification],
  inject: ['checkBalance'],
  props: {
    data: { type: Object, required: true },
    onCart: { type: Array, required: true },
    itemsInCart: { type: Number, required: true },
    removeFromCart: { type: Function, required: true },
    search: { type: Function, required: true },
    sp: { type: Array, required: true }
  },
  emits: ['change'],
  setup () {
    const { currency } = useCurrency()

    return {
      countries,
      currency,
      products: ref({}),
      score: ref(0),
      plan: ref(null),
      service: ref(null),
      namespace: ref(null),
      provider: ref(null),
      fetchLoading: ref(false),
      modal: reactive({
        confirmCreate: false,
        confirmLoading: false
      }),

      options: reactive({ provider: '', tarif: '', domain: '' }),
      resources: reactive({
        registrant_ip: '',
        reg_username: '',
        reg_password: '',
        period: 1,
        auto_renew: true,
        who_is_privacy: false,
        lock_domain: true
      }),
      form: ref({}),
      cachedPlans: ref({}),
      periods: ref([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) // 'annually biennially triennial quadrennial quinquennial'
    }
  },
  computed: {
    ...mapStores(useNamespasesStore, useSpStore, usePlansStore, useInstancesStore),
    ...mapState(useAppStore, ['onLogin']),
    ...mapState(useAuthStore, ['isLogged', 'userdata', 'billingUser']),
    services () {
      return this.instancesStore.services.filter((el) => el.status !== 'DEL')
    },
    plans () {
      return this.cachedPlans[this.provider]?.filter(({ type, uuid }) => {
        const { items } = this.spStore.showcases.find(
          ({ uuid }) => uuid === this.$route.query.service
        ) ?? {}
        const plans = []

        if (!items) return type === 'opensrs'
        items.forEach(({ servicesProvider, plan }) => {
          if (servicesProvider === this.provider) {
            plans.push(plan)
          }
        })

        if (plans.length < 1) return type === 'opensrs'
        return type === 'opensrs' && plans.includes(uuid)
      }) ?? []
    },
    rules () {
      const message = this.$t('ssl_product.field is required')
      const c = this.form.country

      return {
        req: [{ required: true, message }],
        state: [{ required: c === 'CA' || c === 'US' || c === 'ES', message }],
        postal_code: [{ required: c === 'CA' || c === 'US', message }]
      }
    }
  },
  watch: {
    sp (value) {
      if (value.length > 0) this.provider = value[0].uuid
    },
    async provider (uuid) {
      this.fetch()
      if (this.cachedPlans[uuid]) return
      try {
        const { pool } = await this.plansStore.fetch({
          anonymously: !this.isLogged, sp_uuid: uuid
        })

        this.cachedPlans[uuid] = pool
        this.plan = this.plans[0]?.uuid
      } catch (error) {
        const message = error.response?.data?.message ?? error.message ?? error

        this.$notification.error({ message })
      }
    }
  },
  mounted () {
    const { action } = this.onLogin

    if (typeof action === 'function') {
      this.modal.confirmCreate = true
      this.modal.confirmLoading = true
      action()
    }

    if ('form' in this.data) {
      Object.entries(this.data).forEach(([key, value]) => {
        this[key] = value
      })
    } else this.installDataToBuffer()

    if (this.provider) this.fetch()
    else if (this.sp.length > 0) this.provider = this.sp[0].uuid
  },
  created () {
    if (this.isLogged) {
      const promises = []

      if (this.namespacesStore.namespaces.length < 1) {
        promises.push(this.namespacesStore.fetch())
      }

      if (this.instancesStore.services.length < 1) {
        promises.push(this.instancesStore.fetch())
      }

      Promise.all(promises).catch((err) => {
        const message = err.response?.data?.message ?? err.message ?? err

        if (err.response?.data?.code === 16) return
        this.openNotificationWithIcon('error', {
          message: this.$t(message)
        })
        console.error(err)
      })
    }
  },
  beforeUnmount () {
    this.$emit('change', JSON.parse(JSON.stringify({
      resources: this.resources, form: this.form
    })))
  },
  methods: {
    fetch () {
      this.fetchLoading = true
      const promises = this.onCart.map(({ name }) =>
        this.$api.servicesProviders.action({
          uuid: this.provider,
          action: 'get_domain_price',
          params: { domain: name }
        })
      )

      Promise.all(promises)
        .then((res) => {
          res.forEach(({ meta }, i) => {
            const { name } = this.onCart[i]

            this.products[name] = meta.prices
          })
          // this.options.provider = Object.keys(res)[0];
          // this.options.tarif = res[this.options.provider][0].tarif;
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
        })
        .finally(() => { this.fetchLoading = false })
    },
    installDataToBuffer () {
      const interestedKeys = [
        'firstname',
        'lastname',
        'companyname',
        'email',
        'address1',
        'address2',
        'city',
        'state',
        'country',
        'postcode',
        'phonenumber'
      ]
      interestedKeys.forEach((key) => {
        switch (key) {
          case 'firstname':
            this.form.first_name = this.billingUser[key]
            break
          case 'lastname':
            this.form.last_name = this.billingUser[key]
            break
          case 'companyname':
            this.form.org_name = this.billingUser[key]
            break
          case 'postcode':
            this.form.postal_code = this.billingUser[key]
            break
          case 'phonenumber':
            this.form.phone = this.billingUser[key]
            break
          default:
            this.form[key] = this.billingUser[key]
        }
      })
    },
    async orderClickHandler () {
      const service = this.services.find(({ uuid }) => uuid === this.service)
      const plan = this.plans.find(({ uuid }) => uuid === this.plan)

      const instances = Object.keys(this.products).map((domain) => ({
        config: { auto_start: plan.meta.auto_start },
        resources: { ...this.resources, user: this.form, domain },
        title: `Domain - ${domain}`,
        billing_plan: { uuid: this.plan }
      }))
      const newGroup = {
        title: this.userdata.title + Date.now(),
        type: 'opensrs',
        sp: this.provider,
        instances
      }

      const info = (!this.service) ? newGroup : JSON.parse(JSON.stringify(service))
      const group = info.instancesGroups?.find(({ sp }) => sp === this.provider)

      if (group) group.instances = [...group.instances, ...instances]
      else if (this.service) info.instancesGroups.push(newGroup)

      if (!this.userdata.uuid) {
        this.onLogin.redirect = this.$route.name
        this.onLogin.info = {
          type: 'domains',
          title: 'Domains',
          cost: this.getProducts().pricing[this.resources.period],
          currency: this.currency.code
        }
        this.onLogin.action = () => {
          this.createDomains(info)
        }

        this.$router.push({ name: 'login' })
        return
      }

      try {
        await this.$refs.form.validate()
        this.createDomains(info)
      } catch {
        this.openNotificationWithIcon('error', {
          message: this.$t('all fields are required')
        })
      }
    },
    createDomains (info) {
      this.modal.confirmLoading = true
      const action = (this.service) ? 'update' : 'create'
      const orderData = (this.service)
        ? info
        : {
            namespace: this.namespace,
            service: {
              title: this.userdata.title,
              context: {},
              version: '1',
              instancesGroups: [info]
            }
          }

      this.instancesStore[`${action}Service`](orderData)
        .then(({ uuid }) => { this.deployService(uuid) })
        .catch((err) => {
          const config = { namespace: this.namespace, service: orderData }
          const message = err.response?.data?.message ?? err.message ?? err

          this.$api.services.testConfig(config)
            .then(({ result, errors }) => {
              if (!result) {
                errors.forEach(({ error }) => {
                  this.openNotificationWithIcon('error', { message: error })
                })
              }
            })
          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
          console.error(err)
        })
    },
    orderConfirm () {
      const domains = Object.keys(this.products)

      if (this.resources.reg_password.length < 10) {
        this.openNotificationWithIcon('error', {
          message: this.$t('pass at least 10 characters')
        })
        return
      }
      if (!domains.every((el) => el.match(/.+\..+/))) {
        this.$message.error(this.$t('domain is wrong'))
        return
      }
      if (!this.checkBalance(this.getProducts().pricing[this.resources.period])) return
      this.modal.confirmCreate = true
    },
    deployService (uuid) {
      this.$api.services.up(uuid)
        .then(() => {
          this.openNotificationWithIcon('success', {
            message: this.$t('Domain created successfully')
          })
          this.$router.push({ path: '/services' })
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message ?? err

          this.openNotificationWithIcon('error', {
            message: this.$t(message)
          })
        })
        .finally(() => { this.modal.confirmLoading = false })
    },
    getProducts () {
      const prices = { suffix: this.userdata.currency }

      if (this.onCart.length === 0) {
        return {
          pricing: this.periods.reduce((res, curr) => {
            res[curr] = 0
            return res
          }, { ...prices })
        }
      }
      this.onCart.forEach(({ name }) => {
        const domain = this.products[name] ?? {}

        Object.entries(domain).forEach(([key, value]) => {
          if (!prices[key]) prices[key] = 0
          prices[key] = +(prices[key] + +value).toFixed(2)
        })
      })
      return {
        name: `domains - ${this.onCart.length}`,
        pricing: { ...prices }
      }
      // return this.products[this.options.provider].find(el => el.tarif == this.options.tarif);
    },
    searchCountries (input, option) {
      const country = option.children(option)[0].children.toLowerCase()

      return country.includes(input.toLowerCase())
    }
  }
  // watch: {
  //   'options.provider'() {
  //     this.options.tarif = this.products[this.options.provider][0].tarif;
  //   }
  // }
}
</script>

<style>
.has-error .ant-form-explain, .has-error .ant-form-split {
  position: absolute;
}
</style>

<style scoped>

/*--description--*/
.description {
  padding: 12px;
  margin-top: 18px;
  background-color: var(--bright_bg);
}

.description-header {
  display: flex;
  margin-bottom: 2px;
}

.description-header p {
  margin-top: 4px;
  margin-left: 10px;
  font-size: 12px;
  font-weight: 400;
  color: #0fd058;
  background-color: var(--bright_bg);
  display: inline;
}

.description-body{
  background-color: var(--bright_bg);
}

.description-body__domain-name {
  color: black;
}

.description-body__btn-order {
  background-color: var(--err);
  color: var(--bright_font);
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: var(--err);
}
.description-body__btn-order:hover {
  color: var(--err) !important;
  background-color: var(--bright_font) !important;
  border-color: var(--err) !important;
}

div.ant-descriptions-view {
  border-color: var(--bright_bg) !important;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
}

th.ant-descriptions-item-label.ant-descriptions-item-colon.ant-descriptions-item-no-label{
  border: none;
  margin: 0;
  padding: 0;
}

td.ant-descriptions-item-content {
  padding: 7px 0 2px !important;
  font-weight: 400;/*!important*/
  font-size: 12px;
  text-align: center;
}
td.ant-descriptions-item-content:nth-child(2) {
  width: 184px;
  text-align: start;
  border: none;
}
td.ant-descriptions-item-content:nth-child(4) {
  width: 150px;
  background-color: var(--bright_font);
}
td.ant-descriptions-item-content:nth-child(6) {
  background-color: var(--bright_font);
}

/* order*/
.order_wrapper{
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order-cart{
  position: absolute;
  margin-top: 15px;
  margin-bottom: 15px;
  width: 100%;
  max-width: 1024px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.order__prop:not(:first-child){
  margin-top: 15px;
}

.order__inputs{
  margin-right: 20px;
  width: 72%;
}

.order__field-cart{
  border-radius: 20px;
  box-shadow:
      5px 8px 10px rgba(0, 0, 0, .08),
      0px 0px 12px rgba(0, 0, 0, .05);
  padding: 20px;
  background-color: var(--bright_font);
  height: max-content;
}

.order__calculate{
  width: 28%;
  font-size: 1.1rem;
  padding: 10px 15px 10px;
}

.loadingLine{
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

.loadingLine--total{
  margin-top: 10px;
  height: 26px;
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
  .order-cart {
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
  .order__field-cart {
    box-shadow: none;
    flex-grow: 0;
  }
  .order__calculate {
    border-radius: 0 0 20px 20px;
    width: auto;
  }
}
</style>
