<template>
  <div class="order_wrapper">
    <div class="order">
      <div class="order__inputs order__field">
        <div class="order__option">
          <div v-if="$route.query.product" class="order__product">
            <div class="order__product-name" v-html="getProducts.name" />
          </div>

          <div v-else class="order__grid">
            <template v-if="!fetchLoading">
              <div
                v-for="size of sizes"
                :key="size"
                class="order__slider-item"
                :class="{ 'order__slider-item--active': options.size === size }"
                @click="options.size = size"
              >
                <span class="order__slider-name" :title="size.split('> ').at(-1)" v-html="size" />
              </div>
            </template>

            <template v-else>
              <div class="order__slider-item">
                <div class="loadingLine loadingLine--image" />
                <div class="loadingLine" />
              </div>
              <div class="order__slider-item">
                <div class="loadingLine loadingLine--image" />
                <div class="loadingLine" />
              </div>
              <div class="order__slider-item">
                <div class="loadingLine loadingLine--image" />
                <div class="loadingLine" />
              </div>
            </template>
          </div>

          <template v-if="$route.query.product">
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

            <a-card
              v-if="fetchLoading || addons[getProducts.id] && addons[getProducts.id].length > 0"
              style="margin-top: 15px"
              :title="`${$t('Addons')} (${$t('choose addons you want')})`"
              :loading="fetchLoading"
            >
              <div v-if="fetchLoading">
                Loading...
              </div>
              <template v-else>
                <a-card-grid
                  v-for="addon of addons[getProducts.id]"
                  :key="addon.id"
                  class="card-item"
                  @click="changeAddons(addon.id)"
                >
                  <div class="order__slider-name" style="grid-template-columns: 1fr auto">
                    <span style="font-weight: 700; font-size: 16px" v-html="addon.name" />
                    <a-checkbox :checked="options.addons.includes(addon.id)" />
                    <span style="grid-column: 1 / 3" v-html="addon.description" />
                  </div>
                </a-card-grid>
              </template>
            </a-card>
          </template>
        </div>
      </div>

      <div class="order__calculate order__field">
        <a-row style="margin-top: 10px" type="flex" justify="space-around" align="middle">
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            {{ capitalize($t('Payment method')) }}:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12">
            <a-select v-if="!fetchLoading" v-model:value="options.payment" style="width: 100%">
              <a-select-option v-for="method of payMethods" :key="method.module">
                {{ method.displayname }}
              </a-select-option>
            </a-select>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <a-row
          v-if="fetchLoading || periods.length > 0"
          style="margin-top: 10px"
          type="flex"
          justify="space-around"
          align="middle"
        >
          <a-col :xs="10" :sm="6" :lg="12" style="font-size: 1rem">
            {{ $t('Pay period') }}:
          </a-col>

          <a-col :xs="12" :sm="18" :lg="12">
            <a-select
              v-if="!fetchLoading && periods.length > 1"
              v-model:value="options.period"
              style="width: 100%"
            >
              <a-select-option v-for="period in periods" :key="period">
                {{ $t(period) }}
              </a-select-option>
            </a-select>
            <div v-else-if="periods.length === 1" style="text-align: right; font-size: 1.1rem">
              {{ $t(periods[0]) }}
            </div>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <a-row
          v-if="addonsPrice.onetime > 0 || getProducts.paytype === 'onetype'"
          style="margin-top: 10px"
          type="flex"
          justify="space-around"
          align="middle"
        >
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            {{ capitalize($t('one time payment')) }}:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12" style="font-size: 1.1rem">
            <div v-if="!fetchLoading" style="text-align: right">
              {{ addonsPrice.onetime + (+getProducts.price.value || 0) }}
              {{ getProducts.price.currency }}
            </div>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <a-row
          v-if="addonsPrice.value > 0 || getProducts.paytype === 'recurring'"
          style="margin-top: 10px"
          type="flex"
          justify="space-around"
          align="middle"
        >
          <a-col :xs="6" :sm="6" :lg="12" style="font-size: 1rem">
            {{ capitalize($t('recurring payment')) }}:
          </a-col>
          <a-col :xs="12" :sm="18" :lg="12" style="font-size: 1.1rem">
            <div v-if="!fetchLoading" style="text-align: right">
              {{ addonsPrice.value + (+getProducts.price[options.period] || 0) }}
              {{ getProducts.price.currency }}
            </div>
            <div v-else class="loadingLine" />
          </a-col>
        </a-row>

        <a-divider orientation="left" style="margin-bottom: 0">
          {{ $t('Total') }}:
        </a-divider>

        <a-row type="flex" justify="space-around">
          <a-col style="font-size: 1.5rem">
            <transition name="textchange" mode="out-in">
              <template v-if="!fetchLoading">
                {{ (+getProducts.price[options.period] || getProducts.price.value) + addonsPrice.total }}
                {{ getProducts.price.currency }}
              </template>
              <div v-else class="loadingLine loadingLine--total" />
            </transition>
          </a-col>
        </a-row>

        <a-row type="flex" justify="space-around" style="margin: 10px 0">
          <a-col :span="22">
            <a-button type="primary" block shape="round" @click="orderConfirm">
              {{ capitalize($t(($route.query.product) ? 'order' : 'next')) }}
            </a-button>
            <a-modal
              :title="$t('Confirm')"
              :open="modal.confirmCreate"
              :confirm-loading="modal.confirmLoading"
              :cancel-text="$t('Cancel')"
              @ok="orderClickHandler"
              @cancel="() => {modal.confirmCreate = false}"
            >
              <p>{{ $t('order_services.Do you want to order') }}: {{ getProducts['name']?.split('"> ').at(-1) }}</p>

              <a-row style="margin-top: 20px">
                <a-col>
                  <a-checkbox :checked="modal.goToInvoice" @change="(e) => modal.goToInvoice = e.target.checked" />
                  {{ capitalize($t('go to invoice')) }}
                </a-col>
              </a-row>
            </a-modal>
          </a-col>
        </a-row>
      </div>

      <promo-block class="order__promo" />
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from 'pinia'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'
import { useProductsStore } from '@/stores/products.js'

import config from '@/appconfig.js'
import promoBlock from '@/components/ui/promo.vue'

export default {
  name: 'IaasComponent',
  components: { promoBlock },
  data: () => ({
    sizes: [],
    products: [],
    payMethods: [],
    fetchLoading: false,
    options: { size: '', payment: '', period: '', addons: [] },
    modal: {
      confirmCreate: false,
      confirmLoading: false,
      goToInvoice: true
    },
    addons: {},
    periods: []
  }),
  computed: {
    ...mapState(useAppStore, ['onLogin']),
    ...mapState(useAuthStore, ['baseURL', 'isLogged', 'userdata']),
    ...mapState(useCurrenciesStore, ['defaultCurrency', 'unloginedCurrency', 'whmcsCurrencies']),
    getProducts () {
      if (Object.keys(this.products).length === 0) return 'NAN'
      const findedProduct = this.products.find(({ id }) => id === +this.$route.query.product) ??
        this.products[this.sizes.indexOf(this.options.size)]
      const product = JSON.parse(JSON.stringify(findedProduct))

      if (typeof product.description !== 'string') return product
      if (/<\/?[a-z][\s\S]*>/i.test(product.description)) {
        if (typeof product.price?.currency === 'string') return product

        if (product.paytype === 'free' || !product.price) {
          product.price = { value: 0, currency: '' }
        } else if (product.paytype === 'onetime') {
          product.price = { value: product.price.monthly, currency: '' }
        } else if (this.currency.id === -1) {
          product.price = product.price[0]
        } else {
          product.price = product.price.find(({ currency }) => currency === this.currency.id) ?? {}
        }
        product.price.currency = this.currency.code

        return product
      } else {
        product.description = product.description.split('\r\n').map(
          (res) => ({ name: res.split(': ')[0], value: res.split(': ')[1] })
        )
        product.description.pop()

        if (product.paytype === 'free') {
          product.price = { value: 0, currency: '' }
        } else if (product.paytype === 'onetime') {
          product.price = { value: product.price.monthly, currency: '' }
        } else {
          product.price = product.price.find(({ currency }) => currency === this.currency.id)
        }
        product.price.currency = this.currency.code
      }

      return { ...product, price: +product.price }
    },
    slides () {
      return 3
    },
    addonsPrice () {
      return this.options.addons.reduce((prev, curr) => {
        const { prices = [], billingcycle } = this.addons[this.getProducts.id]
          ?.find(({ id }) => id === curr) ?? {}

        const price = prices.find((el) => el.currency === this.currency.id)
        const value = (+price[this.options.period] !== -1)
          ? +price[this.options.period]
          : 0

        const result = {
          value: (billingcycle !== 'free') ? prev.value + (value || 0) : prev.value,
          onetime: (billingcycle === 'onetime') ? prev.onetime + +price.monthly : prev.onetime
        }

        return { ...result, total: result.value + result.onetime }
      }, { value: 0, onetime: 0, total: 0 })
    },
    currency () {
      const code = (this.isLogged)
        ? this.userdata.currency ?? this.defaultCurrency
        : this.unloginedCurrency
      const { id = -1 } = this.whmcsCurrencies?.find((currency) => currency.code === code) ?? {}

      return { code, id }
    }
  },
  watch: {
    'options.size' () {
      this.periods = Object.entries(this.getProducts.price ?? {}).filter(
        ([key, value]) => key.match(/ly/) && value > -1
      ).map((el) => el[0])

      this.options.period = this.periods[0]

      if (this.addons[this.getProducts.id]) {
        this.options.addons = []
        return
      }

      this.$api.get(this.baseURL, {
        params: {
          run: 'get_addons',
          productid: this.getProducts.id
        }
      })
        .then((res) => {
          this.addons[this.getProducts.id] = res
          this.options.addons = []
        })
        .catch((err) => console.error(err))
    }
  },
  created () {
    if (this.whmcsCurrencies.length < 1) {
      this.fetchWhmcsCurrencies()
    }

    this.$api.get(this.baseURL, { params: { run: 'get_payment' } })
      .then((res) => {
        this.payMethods = res.paymentmethod
        this.options.payment = res.paymentmethod[0].module
      })

    this.fetchBillingData()
    this.fetch()
  },
  mounted () {
    const { action, info } = this.onLogin

    if (typeof action !== 'function') return
    this.modal.goToInvoice = info.goToInvoice
    this.modal.confirmCreate = true
    this.modal.confirmLoading = true
    action()
  },
  methods: {
    ...mapActions(useAuthStore, ['fetchBillingData']),
    ...mapActions(useCurrenciesStore, ['fetchWhmcsCurrencies']),
    ...mapActions(useProductsStore, ['fetchServices']),
    fetch () {
      this.fetchLoading = true
      this.fetchServices()
        .then((res) => {
          const { prod } = Object.values(res).find(({ group_name: group }) =>
            group === this.$route.query.service
          )

          this.products = prod.sort((a, b) => b.name - a.name)
          this.products.forEach(({ description }, i) => {
            const desc = description.replace('/templates', `${config.whmcsSiteUrl}$&`)
            const start = desc.indexOf('<img')
            const end = desc.indexOf('">', start)
            const image = desc.slice(start, end + 2)

            this.products[i].description = desc.replace(image, '')
            this.products[i].name = `${image} ${this.products[i].name}`
          })

          this.sizes = this.products.map((el) => el.name)
          this.options.size = this.sizes[0]

          this.periods = Object.entries(this.products[0].price[0]).filter(
            ([key, value]) => key.match(/ly/) && value > -1
          ).map((el) => el[0])
          this.options.period = this.periods[0]
        })
        .catch(err => console.error(err))
        .finally(() => {
          this.fetchLoading = false
        })
    },
    changeAddons (id) {
      if (this.options.addons.includes(id)) {
        this.options.addons = this.options.addons.filter((addon) => addon !== id)
      } else {
        this.options.addons.push(id)
      }
    },
    orderClickHandler () {
      const info = {
        run: 'add_product',
        billingcycle: (['free', 'onetime'].includes(this.getProducts.paytype)) ? 'monthly' : this.options.period,
        product: this.getProducts.id,
        paymentmethod: this.options.payment,
        addons: this.options.addons
      }

      if (!this.userdata.uuid) {
        this.onLogin.redirect = this.$route.name
        this.onLogin.info = {
          type: 'iaas',
          title: this.$route.query.service,
          cost: this.getProducts.price[this.options.period] ?? 0,
          currency: this.currency.code,
          goToInvoice: this.modal.goToInvoice
        }
        this.onLogin.action = () => {
          this.createService(info)
        }
        this.$router.push({ name: 'login' })
        return
      }

      this.createService(info)
    },
    createService (info) {
      this.modal.confirmLoading = true
      this.$api.get(this.baseURL, { params: info })
        .then((result) => {
          if (this.modal.goToInvoice) {
            this.getPaytoken(result.invoiceid)
          } else {
            this.$router.push({ name: 'services' })
          }
        })
        .catch((err) => console.error(err))
        .finally(() => {
          this.modal.confirmLoading = false
        })
    },
    orderConfirm () {
      if (!this.$route.query.product) {
        this.$router.push({
          query: {
            ...this.$route.query,
            product: this.getProducts.id
          }
        })
        return
      }

      if (this.options.payment === '') {
        this.$message.error(this.$t('Choose your payment method'))
        return
      }
      // if (!this.checkBalance(this.getProducts.price[this.options.period])) return
      this.modal.confirmCreate = true
    },
    getPaytoken (invoiceId) {
      this.$api.get(this.baseURL, {
        params: {
          run: 'get_pay_token', invoice_id: invoiceId
        }
      })
        .then((res) => { window.location.href = res })
    }
  }
}
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

.product__specs{
  --color: rgb(126, 126, 126);
  color: var(--color);
  margin: 0 auto;
  --border-color: #dbdbdb;
  --border-line-weight: 1px;
  --border-line-type: solid;
  width: 80%;
  font-size: 1.2rem;
}

.product__specs td{
  padding: 10px 20px;
  position: relative;
}

.product__specs td:nth-child(1){
  font-weight: 500;
}

.product__specs td:nth-child(2){
  text-align: right;
  color: rgba(0, 0, 0, .7)
}

.product__specs tr{
  border-bottom: var(--border-line-weight) var(--border-line-type) var(--border-color);
}

.product__specs td:last-child::before{
  content: '';
  width: 2px;
  height: 50%;
  background: #f5f5f5;
  display: block;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.order__prop:not(:first-child){
  margin-top: 15px;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__product-name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 20px;
  font-weight: 700;
}

.order__product .order__product-name .img_prod {
  max-height: 75px;
  margin: 0;
}

.order__option div > .img_prod {
  display: block;
  max-width: 200px;
  margin: 0 auto 10px;
}

.order__option .ant-slider-mark {
  display: none;
}

.order__option .order__slider-name {
  display: grid;
  justify-items: center;
  gap: 5px;
}

.order__option .order__slider-name .ant-checkbox {
  box-shadow: 0 0 5px var(--main);
}

.order__option .order__slider-name img {
  max-height: 65px;
}

.order__option .ant-carousel {
  width: calc(100% - 50px);
  margin: 0 auto 5px;
}

.order__option .ant-carousel .slick-track {
  display: flex;
  align-items: center;
}

.order__option .ant-carousel .slick-slide > div {
  height: 137px;
  margin: 0 5px;
}

.order__option .ant-carousel .custom-slick-arrow {
  width: 25px;
  height: 25px;
  font-size: 25px;
  color: var(--main);
  opacity: 0.5;
  transition: 0.3s;
}
.order__option .ant-carousel .custom-slick-arrow::before {
  display: none;
}
.order__option .ant-carousel .custom-slick-arrow:hover {
  opacity: 1;
}

.order__option .ant-card-head {
  background: var(--bright_bg);
}

.order__option .ant-card-body {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.order__option .ant-card-loading-content {
  width: 100%;
}

.order__option .card-item {
  width: 100%;
  cursor: pointer;
  border: 0 solid transparent;
  background: var(--bright_bg);
}

.card-item .order__slider-name {
  justify-items: start;
}

.card-item--active {
  padding: 19px;
  border: 5px solid var(--main);
}

.order__field-header{
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.order__template{
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.order__template.one-line{
  flex-wrap: nowrap;
  justify-content: space-between;
}

.order__template-item{
  width: 116px;
  margin-bottom: 10px;
  background-color: var(--bright_font);
  box-shadow:
    3px 2px 6px rgba(0, 0, 0, .08),
    0px 0px 8px rgba(0, 0, 0, .05);
  border-radius: 15px;
  transition: box-shadow .2s ease, transform .2s ease;
  cursor: pointer;
  text-align: center;
  overflow: hidden;

  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: max-content auto;
}

.order__template-item:not(:last-child){
  margin-right: 10px;
}

.order__template-item:hover{
  box-shadow:
    5px 8px 10px rgba(0, 0, 0, .08),
    0px 0px 12px rgba(0, 0, 0, .05);
}

.order__template-item.active{
  box-shadow:
    5px 8px 12px rgba(0, 0, 0, .08),
    0px 0px 13px rgba(0, 0, 0, .05);
  transform: scale(1.02);
}

.order__template-image{
  padding: 10px;
}

.order__template-image__rate{
  font-size: 2rem;
}

.order__template-name{
  padding: 10px;
}

.order__template-item.active .order__template-name{
  background-color: var(--main);
  color: var(--bright_font);
}

.max-width{
  width: 100%;
}

.ant-collapse-item:last-of-type .ant-collapse-content{
  border-radius: 0 0 28px 28px;
}

.slider_btn{
  cursor: pointer;
}

.removeMarginSkeleton .ant-skeleton-title{
  margin: 0;
  margin-top: 4px;
}

.removeMarginSkeleton{
  min-width: 75px;
}

.total.removeMarginSkeleton{
  width: 100%;
}

.order__slider{
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.order__slider-item{
  flex-shrink: 0;
  /* border: 1px solid var(--border_color); */
  box-shadow: inset 0 0 0 1px var(--border_color);
  height: 100%;
  padding: 7px 10px;
  text-align: center;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1.1rem;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover{
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active{
  background-color: var(--main);
  color: var(--bright_font);
}

.order__slider-item--loading{
  /* background-color: #f2f2f2; */
  box-shadow: none;
  /* animation: glowing .5s ease infinite; */
  animation-name: glowing;
  animation-duration: 1s;
  animation-timing-function: ease;
  animation-iteration-count: infinite;
  animation-direction: alternate;
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

.loadingLine--image{
  min-width: 60px;
  width: 60px;
  height: 60px;
  margin: auto;
  margin-bottom: 15px;
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
  .order__template{
    flex-direction: column;
    flex-wrap: nowrap;
    align-items: stretch;
  }
  .order__template-item{
    grid-template-columns: max-content auto;
    grid-template-rows: 1fr;
    width: auto;
    height: 50px;
  }
  .order__template-item:not(:last-child){
    margin-right: 0px;
  }
  .order__template-image{
    width: 50px;
    height: 50px;
    padding: 4px;
  }
  .order__template-image__rate{
    line-height: 42px;
    font-size: 1.4rem;
  }
  .order__template-image img{
    object-fit: contain;
    width: 100%;
    height: 100%;
  }
  .order__template-name{
    text-align: left;
    line-height: 30px;
    display: flex;
  }
  .order__template-type{
    width: 56px;
  }
  .order__template-name ul{
    display: flex;
    justify-content: space-around;
    list-style: none;
    flex: 1
  }
  .order__template-name ul li{
    margin-left: 20px;
  }
  .product__specs {
    width: 100%;
  }
  .product__specs td {
    padding: 3px 7px;
  }
  .product__specs td:last-child::before {
    transform: translate(-10px, -50%);
  }
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
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

.textchange-enter-active,
.textchange-leave-active {
  transition: all .15s ease;
}

.textchange-enter-from {
  transform: translateY(-0.5em);
  opacity: 0;
}

.textchange-leave-to{
  transform: translateY(0.5em);
  opacity: 0;
}
</style>
