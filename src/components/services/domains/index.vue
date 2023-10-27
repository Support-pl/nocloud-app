<template>
  <div class="wrapper" style="margin: 0; padding: 0">
    <loading v-if="providersStore.isLoading" />
    <div v-else-if="!cartVisibility" class="order_wrapper">
      <div class="order">
        <div class="order__inputs order__field">
          <div class="order_option">
            <a-row
              class="order_option__steps"
              type="flex"
              justify="center"
            >
              <a-col :xs="22" :sm="16">
                <!--TODO: add finish status if cart (watch to cart)-->
                <a-steps>
                  <a-step class="search" status="start" :title="$t('search')">
                    <template #icon>
                      <!-- @click="search"-->
                      <a-icon type="search" />
                    </template>
                  </a-step>

                  <a-step class="cart" status="finish" :title="$t('cart')" @click="cartVisibility = true">
                    <template #icon>
                      <a-icon type="shopping-cart" />
                    </template>
                  </a-step>
                </a-steps>
              </a-col>
              <a-col :span="2" class="badge-wrapper">
                <a-badge
                  :count="itemsInCart"
                  :offset="[-25,-2]"
                  show-zero
                  :number-style="{
                    backgroundColor: 'var(--bright_font)',
                    color: '#999',
                    boxShadow: '0 0 0 1px #d9d9d9 inset'
                  }"
                />
              </a-col>
            </a-row>
            <a-row class="order_option__card" :gutter="[10, 10]">
              <a-col style="margin-bottom: 10px" :span="24">
                <a-card :title="$t('domain_product.how_to_choose_the_right_domain')">
                  <div>
                    <a-icon type="check" />
                    <p>{{ $t('domain_product.keep_your_name_easy_to_remember') }}</p>
                  </div>
                  <div>
                    <a-icon type="check" />
                    <p>{{ $t('domain_product.choose_a_name_that_fit_your_brand') }}</p>
                  </div>
                </a-card>
              </a-col>
            </a-row>
            <a-input-search
              v-model="domain"
              placeholder="input search text"
              enter-button="Search"
              :loading="isDomainsLoading"
              @search="searchDomain"
            />
            <div v-if="!cartVisibility && results.length" class="description">
              <a-descriptions
                v-for="(result, i) in results"
                :key="i"
                bordered
                class="description-body"
                :column="6"
              >
                <a-descriptions-item :span="1">
                  <span class="description-body__domain-name">
                    {{ result.name }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item :span="3">
                  <span class="description-body__domain-cost">
                    {{ result.status }}
                  </span>
                </a-descriptions-item>
                <a-descriptions-item :span="2">
                  <a-button
                    :key="i"
                    :class="result.btnClass"
                    @click="addToCart(result)"
                  >
                    {{ result.btnText }}
                  </a-button>
                </a-descriptions-item>
              </a-descriptions>
            </div>
          </div>
        </div>
      </div>
    </div>
    <order
      v-if="cartVisibility"
      :data="dataCart"
      :on-cart="onCart"
      :items-in-cart="itemsInCart"
      :remove-from-cart="removeFromCart"
      :search="() => { cartVisibility = false }"
      :sp="sp"
      @change="(data) => dataCart = data"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { notification } from 'ant-design-vue'

import i18n from '@/i18n'
import api from '@/api'
import { useSpStore } from '@/stores/sp.js'
import { useAuthStore } from '@/stores/auth.js'

import order from '@/components/services/domains/order.vue'
import loading from '@/components/loading/loading.vue'

const authStore = useAuthStore()
const providersStore = useSpStore()

const itemsInCart = ref(0) // в корзине
const domain = ref('')
const results = ref([])
const isDomainsLoading = ref(false)
const cartVisibility = ref(false)
const onCart = ref([])
const dataCart = ref({})

const sp = computed(() =>
  providersStore.servicesProviders.find((sp) => sp.type === 'opensrs')
)

async function searchDomain () {
  const regexWithZone = /^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i
  const regexWithoutZone = /^[a-z0-9][a-z0-9-]*$/i
  const isValid = (regexWithZone.test(domain.value)) ||
    (regexWithoutZone.test(domain.value))

  if (!isValid) {
    results.value = []
    console.log('*******-alert-*******')
    return
  }

  try {
    isDomainsLoading.value = true
    const { meta } = await api.servicesProviders.action({
      uuid: sp.value.uuid,
      action: 'get_domains',
      params: {
        searchString: domain.value,
        gTLD: true,
        p_ccTLD: true,
        m_ccTLD: true
      }
    })

    results.value = []
    meta.domains.forEach((el) => {
      const options = {
        name: el.domain,
        status: el.status,
        btnText: 'Add To Cart',
        btnClass: 'description-body__btn-add'
      }

      if (el.domain === domain.value) {
        results.value.unshift(options)
        return
      }
      if (el.status === 'available') results.value.push(options)
    })
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  } finally {
    isDomainsLoading.value = false
  }
}

function addToCart (result) {
  if (result.btnClass === 'description-body__btn-add') {
    result.btnText = 'Order Now'
    result.btnClass = 'description-body__btn-order'

    if (!onCart.value.some((item) => item.name === result.name)) {
      onCart.value.push(result)
      itemsInCart.value += 1
    }
  } else {
    cartVisibility.value = true
  }
}

function removeFromCart (domain, index) {
  onCart.value.splice(index, 1)
  results.value.splice(results.value.findIndex(
    (result) => result.name === domain.name), 1
  )
  itemsInCart.value -= 1
}

async function fetch () {
  try {
    await Promise.all([
      authStore.fetchBillingData(),
      providersStore.fetch()
    ])
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error

    notification.error({ message: i18n.t(message) })
    console.error(error)
  }
}

fetch()
</script>

<script>
export default { name: 'DomainsComponent' }
</script>

<style>
.order_wrapper{
  position: relative;
  width: 100%;
  min-height: 100%;
}

.order{
  position: absolute;
  margin-top: 20px;
  width: 100%;
  max-width: 768px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}

.order__inputs{
  width: 100%;
}

.order__field{
  margin-bottom: 20px;
  border-radius: 10px;
  padding: 23px 78px;
  background-color: var(--bright_font);
  height: max-content;
}

/*--steps--*/
.search{
  font-weight: 600;
  font-size: 18px;
  margin-right: 12px;
}

.search div.ant-steps-item-icon,
.search div.ant-steps-item-content{
  cursor: pointer!important;
}

.cart{
  font-weight: 600;
  font-size: 18px;
  margin-right: 0;
  padding-right: 28px;
  cursor: pointer;
}

.anticon-shopping-cart{
  font-size: 28px;
}

/*--card--*/
.order_option__card{
  margin: 20px 0 27px;
  padding-bottom: 15px;
}

.ant-card-head{
  border-bottom: none;
}

.ant-card-head-title{
  padding-bottom: 0;
  font-size: 11px;
  font-family: sans-serif;
  font-weight: bold;
  padding-left: 7px;
}

.ant-card-body{
  padding: 0 35px 13px;
  margin-top: -8px;
}

.anticon-check{
  margin: 0 5px;
}

.ant-card-body p{
  display: inline;
  font-size: 13px;
  color: black;
}

/*--input--*/
.ant-input-group .ant-input{
  width: 100%;
}

input.ant-input:focus{
  box-shadow: none;
}

.ant-input-group-addon{
  width: 22%;
}

.ant-input-search-button{
  width: 100%;
  background-color: #427cf7!important;
}

/*--description--*/
.description{
  padding: 11px 0 11px 32px;
  margin-top: 18px;
  background-color: #f7f7f7;
}

.description-header{
  display: flex;
  margin-bottom: 2px;
}

.anticon-like {
  font-size: 27px;
  color: grey;
  display: inline-block
}

.description-header p{
  margin-top: 4px;
  margin-left: 10px;
  font-size: 12px;
  font-weight: 400;
  color: #0fd058;
  background-color: #f7f7f7;
  display: inline;
}

.description-body{
  background-color: #f7f7f7;
}

.description-body__domain-name{
  margin-left: 15px;
  color: black;
}

.description-body__domain-cost{
  color: black;
}

.description-body__btn-add{
  background-color: #427cf7;
  color: white;
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: #427cf7;
}
.description-body__btn-add:hover{
  color: var(--bright_font);
  background-color: #40a9ff!important;
  border-color: #40a9ff!important;
}

.description-body__btn-order{
  background-color: #5CB85B;
  color: white;
  padding: 0;
  width: 115px;
  font-size: 12px;
  height: 24px;
  margin: 3px 2px 5px 0;
  border-color: #5CB85B;
}
.description-body__btn-order:hover{
  color: var(--bright_font);
  background-color: rgba(92,184,91,0.65)!important;
  border-color: rgba(92,184,91,0.65)!important;
}

div.ant-descriptions-view{
  border-color: #f7f7f7!important;
  border-bottom-right-radius: 0;
  border-top-right-radius: 0;
}

th.ant-descriptions-item-label.ant-descriptions-item-colon.ant-descriptions-item-no-label{
  border: none;
  margin: 0;
  padding: 0;
}

td.ant-descriptions-item-content{
  padding-top: 5px!important;
  padding-bottom: 2px!important;
  font-weight: 400;/*!important*/
  font-size: 12px;
  text-align: center;
}
td.ant-descriptions-item-content:nth-child(2){
  padding: 7px 0 2px;
  width: 150px;
  text-align: start;
  border: none;
}
td.ant-descriptions-item-content:nth-child(4){
  padding: 7px 0 2px;
  width: 184px;
  background-color: white;
}
td.ant-descriptions-item-content:nth-child(6){
  background-color: white;
}

.description-btn-more{
  display: flex;
  width: 150px;
  background-color: #427cf7;
  color: white;
  padding: 7px;
  font-size: 12px;
  margin: 30px 2px 5px 0;
  border-color: #427cf7;
  align-items: center;
  justify-content: center;
}

.description-btn-more:hover{
  color: var(--bright_font);
  background-color: #40a9ff!important;
  border-color: #40a9ff!important;
}
/*media*/
/*@media screen and (max-width: 1024px) {
  .order{
    flex-direction: column;
    padding: 10px;
    margin-top: 0;
    overflow: auto;
  }
  .order__inputs{
    margin: 0;
    border-radius: 20px 20px 0 0;
    width: auto;
  }
  .order__field{
    box-shadow: none;
    flex-grow: 0;
  }
}*/

/*@media screen and (max-width: 576px) {
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
}

.networkApear-enter-active, .networkApear-leave-active {
  transition: opacity .5s, height .5s;
  height: 26px;
}
.networkApear-enter, .networkApear-leave-to {
  opacity: 0;
  height: 0;
}*/
</style>
