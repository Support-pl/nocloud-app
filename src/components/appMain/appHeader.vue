<template>
  <div class="header__container">
    <div class="container">
      <div v-if="isNeedHeader" class="header__wrapper">
        <div class="header__title">
          <div
            v-if="
              (headers[active] && headers[active].notmain) ||
                isInSpecialType ||
                $route.meta.isNeedBackButton ||
                !isLogged
            "
            class="header_back_btn icon__wrapper"
            @click="routeBack"
          >
            <a-icon type="left" />
          </div>
          <!-- {{$t(`headerTitle.${headerTitle}`)}} -->
          <span>{{ headerTitle }}</span>
        </div>

        <div class="header__right-side">
          <transition-group
            v-if="headers[active] && isLogged && isButtonsVisible"
            name="header__item-anim"
            class="header__buttons"
            tag="div"
          >
            <div
              v-for="button in headers[active].buttons"
              :key="button.icon"
              class="header__button"
            >
              <div
                v-if="button.onClickFuncion && button.type == undefined && button.icon != 'telegram'"
                class="icon__wrapper"
                :class="[
                  { active__btn: getState(button.name) },
                  button.additionalClass,
                ]"
                @click="button.onClickFuncion"
              >
                <a-icon
                  :spin="button.isSpin"
                  class="header__icon"
                  :type="button.icon"
                />
              </div>

              <div
                v-else-if="button.onClickFuncion && button.type != undefined"
                class="icon__wrapper btn--no-image"
                :class="[
                  { active__btn: getState(button.name) },
                  button.additionalClass,
                ]"
                @click="button.onClickFuncion"
              >
                <div class="header__btn--no-image">
                  {{ button.name }}
                </div>
              </div>

              <div
                v-else-if="button.icon === 'telegram'"
                class="icon__wrapper"
                :class="[button.additionalClass]"
                @click="button.onClickFuncion"
              >
                <svg fill="currentColor" width="30px" height="30px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 26.070313 3.996094 C 25.734375 4.011719 25.417969 4.109375 25.136719 4.21875 L 25.132813 4.21875 C 24.847656 4.332031 23.492188 4.902344 21.433594 5.765625 C 19.375 6.632813 16.703125 7.757813 14.050781 8.875 C 8.753906 11.105469 3.546875 13.300781 3.546875 13.300781 L 3.609375 13.277344 C 3.609375 13.277344 3.25 13.394531 2.875 13.652344 C 2.683594 13.777344 2.472656 13.949219 2.289063 14.21875 C 2.105469 14.488281 1.957031 14.902344 2.011719 15.328125 C 2.101563 16.050781 2.570313 16.484375 2.90625 16.722656 C 3.246094 16.964844 3.570313 17.078125 3.570313 17.078125 L 3.578125 17.078125 L 8.460938 18.722656 C 8.679688 19.425781 9.949219 23.597656 10.253906 24.558594 C 10.433594 25.132813 10.609375 25.492188 10.828125 25.765625 C 10.933594 25.90625 11.058594 26.023438 11.207031 26.117188 C 11.265625 26.152344 11.328125 26.179688 11.390625 26.203125 C 11.410156 26.214844 11.429688 26.21875 11.453125 26.222656 L 11.402344 26.210938 C 11.417969 26.214844 11.429688 26.226563 11.441406 26.230469 C 11.480469 26.242188 11.507813 26.246094 11.558594 26.253906 C 12.332031 26.488281 12.953125 26.007813 12.953125 26.007813 L 12.988281 25.980469 L 15.871094 23.355469 L 20.703125 27.0625 L 20.8125 27.109375 C 21.820313 27.550781 22.839844 27.304688 23.378906 26.871094 C 23.921875 26.433594 24.132813 25.875 24.132813 25.875 L 24.167969 25.785156 L 27.902344 6.65625 C 28.007813 6.183594 28.035156 5.742188 27.917969 5.3125 C 27.800781 4.882813 27.5 4.480469 27.136719 4.265625 C 26.769531 4.046875 26.40625 3.980469 26.070313 3.996094 Z M 25.96875 6.046875 C 25.964844 6.109375 25.976563 6.101563 25.949219 6.222656 L 25.949219 6.234375 L 22.25 25.164063 C 22.234375 25.191406 22.207031 25.25 22.132813 25.308594 C 22.054688 25.371094 21.992188 25.410156 21.667969 25.28125 L 15.757813 20.75 L 12.1875 24.003906 L 12.9375 19.214844 C 12.9375 19.214844 22.195313 10.585938 22.59375 10.214844 C 22.992188 9.84375 22.859375 9.765625 22.859375 9.765625 C 22.886719 9.3125 22.257813 9.632813 22.257813 9.632813 L 10.082031 17.175781 L 10.078125 17.15625 L 4.242188 15.191406 L 4.242188 15.1875 C 4.238281 15.1875 4.230469 15.183594 4.226563 15.183594 C 4.230469 15.183594 4.257813 15.171875 4.257813 15.171875 L 4.289063 15.15625 L 4.320313 15.144531 C 4.320313 15.144531 9.53125 12.949219 14.828125 10.71875 C 17.480469 9.601563 20.152344 8.476563 22.207031 7.609375 C 24.261719 6.746094 25.78125 6.113281 25.867188 6.078125 C 25.949219 6.046875 25.910156 6.046875 25.96875 6.046875 Z" />
                </svg>
              </div>

              <div
                v-else-if="button.icon == 'search'"
                class="icon__wrapper"
                :class="[button.additionalClass]"
                :style="(searchString.length > 0) ? {
                  borderRadius: '50%',
                  background: 'var(--bright_bg)',
                  color: 'var(--main)'
                } : null"
              >
                <a-icon
                  v-if="!button.popover"
                  class="header__icon"
                  :type="button.icon"
                />
                <a-popover v-else arrow-point-at-center placement="left" :align="{ offset: [-10, 0] }">
                  <template slot="content">
                    <a-input-search
                      placeholder="Title / Status / IP"
                      enter-button
                      :value="searchString"
                      @input="(e) => $store.commit('nocloud/vms/setSearch', e.target.value)"
                      @search="(text) => $store.commit('nocloud/vms/setSearch', text)"
                      @keydown="updateSearch"
                    >
                      <div
                        slot="suffix"
                        style="cursor: pointer"
                        @click="$store.commit('nocloud/vms/setSearch', '')"
                      >
                        <a-icon
                          type="close"
                          style="color: rgba(0, 0, 0, 0.45)"
                        />
                      </div>
                    </a-input-search>
                  </template>
                  <a-icon class="header__icon" :type="button.icon" />
                </a-popover>
              </div>

              <div
                v-else
                class="icon__wrapper"
                :class="[
                  { active__btn: getState(button.name) },
                  button.additionalClass,
                ]"
              >
                <a-icon
                  v-if="!button.popover"
                  class="header__icon"
                  :type="button.icon"
                />
                <a-popover
                  v-else
                  arrow-point-at-center
                  placement="bottomRight"
                  :visible="isVisible"
                  @visibleChange="((isOpen) ? isVisible = true : isVisible = !isVisible)"
                >
                  <template #content>
                    <a-range-picker
                      v-if="active === 'billing' && activeInvoiceTab === 'Detail'"
                      show-time
                      :value="checkedList"
                      @ok="updateFilter"
                      @change="onChangeRange"
                      @openChange="openRange"
                    />
                    <a-checkbox-group
                      v-else
                      v-model="checkedList"
                      :options="plainOptions"
                      @change="onChange"
                    />
                  </template>
                  <template #title>
                    <span>{{ $t("filter") | capitalize }}</span>
                  </template>
                  <a-icon
                    class="header__icon"
                    :type="button.icon"
                    :style="(checkedList.length > 0) ? {
                      padding: '5px',
                      borderRadius: '50%',
                      background: 'var(--bright_bg)',
                      color: 'var(--main)'
                    } : null"
                  />
                </a-popover>
              </div>
            </div>
          </transition-group>
          <transition
            v-if="viewport < 576 && headers[active]?.buttons.length > 0 && isLogged"
            name="header__item-anim"
          >
            <div class="header__button" @click="isButtonsVisible = !isButtonsVisible">
              <div
                class="icon__wrapper" :style="(isButtonsVisible) ? {
                  borderRadius: '50%',
                  background: 'var(--bright_bg)',
                  color: 'var(--main)'
                } : null"
              >
                <a-icon class="header__icon" type="down" />
              </div>
            </div>
          </transition>
          <transition name="header__item-anim">
            <div v-if="isNeedBalance && isLogged" class="header__balance">
              <balance />
            </div>
          </transition>

          <transition
            v-if="viewport < 576 && !isLogged"
            name="header__item-anim"
          >
            <div class="header__button" @click="isButtonsVisible = !isButtonsVisible">
              <div
                class="icon__wrapper" :style="(isButtonsVisible) ? {
                  borderRadius: '50%',
                  background: 'var(--bright_bg)',
                  color: 'var(--main)'
                } : null"
              >
                <a-icon class="header__icon" type="down" />
              </div>
            </div>
          </transition>
          <div v-if="!isLogged && isButtonsVisible" class="header__selects">
            <a-select v-model="$i18n.locale" style="width: 100%; border: none">
              <a-select-option v-for="lang in langs" :key="lang" :value="lang">
                {{ $t('localeLang', lang) }}
              </a-select-option>
            </a-select>

            <a-select v-model="currencyCode" style="width: 100%; border: none">
              <a-select-option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                {{ currency.code }}
              </a-select-option>
            </a-select>
          </div>
          <div v-if="!isLogged" class="header__links">
            <router-link :to="{ name: 'login' }">
              {{ $t("login") }}
            </router-link>
            <router-link :to="{ name: 'register' }">
              {{ $t("unregistered.sign up") }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'
import { mapState, mapWritableState, mapActions as actionsPinia } from 'pinia'
import moment from 'moment'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'

import { useProductsStore } from '@/stores/products.js'

import { useInvoicesStore } from '@/stores/invoices.js'
import { useTransactionsStore } from '@/stores/transactions.js'

import config from '@/appconfig.js'
import balance from '@/components/balance/balance.vue'
import { Status } from '@/libs/cc_connect/cc_pb.js'

export default {
  name: 'AppHeader',
  components: { balance },
  data () {
    return {
      isOpen: false,
      isVisible: false,
      isButtonsVisible: true,
      indeterminate: true,
      checkAll: false,
      checkedList: [],
      headers: {
        cloud: {
          title: 'Cloud',
          needBalance: true,
          buttons: []
        },
        support: {
          title: 'Support',
          needBalance: true,
          buttons: [
            {
              name: 'support_filter',
              icon: 'filter',
              popover: true
            },
            {
              name: 'support_telegram',
              icon: 'telegram',
              onClickFuncion: () => {
                this.$router.push({ name: 'handsfree', query: { code: '666666' } })
              }
            },
            {
              name: 'support_plus',
              icon: 'plus',
              onClickFuncion: () => { this.isAddingTicket = !this.isAddingTicket },
              isActiveState: this.isAddingTicket,
              additionalClass: ['active-rotate']
            },
            {
              name: 'support_reload',
              icon: 'reload',
              onClickFuncion: () => {
                this.fetchTickets()
                this.fetchUserData()
              }
            }
          ]
        },
        services: {
          title: 'services',
          needBalance: true,
          buttons: [
            {
              name: 'cloud_search',
              icon: 'search',
              popover: true
            },
            {
              name: 'cloud_reload',
              icon: 'reload',
              onClickFuncion: () => {
                this.fetchClouds()
                this.fetchProducts(this.billingUser.client_id)
                this.fetchUserData()
              }
            }
          ]
        },
        billing: {
          title: 'billing',
          needBalance: true,
          buttons: [
            {
              name: 'invoice_filter',
              icon: 'filter',
              popover: true
              // доделать фильтр тут
            },
            {
              name: 'invoice_reload',
              icon: 'reload',
              onClickFuncion: () => {
                const params = {
                  account: this.userdata.uuid,
                  page: this.currentPage,
                  limit: this.pageSize,
                  field: 'exec',
                  sort: 'desc'
                }

                this.fetchInvoices()
                this.fetchTransactions(params)
                this.fetchUserData()
              }
            }
          ]
        },
        settings: {
          title: 'Settings',
          buttons: []
        },
        newVDC: {
          title: 'Create VM',
          notmain: true,
          needBalance: true,
          buttons: []
        },
        newPaaS: {
          title: 'Create VM',
          notmain: true,
          needBalance: true,
          buttons: []
        },
        iaas: {
          title: 'Service',
          needBalance: true,
          buttons: []
        }
      },
      langs: config.languages,
      currencies: [],
      currencyCode: ''
    }
  },
  computed: {
    ...mapState(useAppStore, ['activeTab']),
    ...mapState(useAuthStore, ['baseURL', 'billingUser', 'userdata', 'isLogged']),
    ...mapState(useSupportStore, {
      tickets: 'tickets',
      isOnlyClosedTickets: 'isOnlyClosedTickets',
      fetchTickets: 'fetch'
    }),
    ...mapState(useTransactionsStore, {
      transactions: 'filteredTransactions',
      activeInvoiceTab: 'tab',
      currentPage: 'page',
      pageSize: 'size',
      fetchTransactions: 'fetch'
    }),
    ...mapState(useInvoicesStore, {
      invoices: 'invoices',
      fetchInvoices: 'fetch'
    }),
    ...mapWritableState(useCurrenciesStore, ['defaultCurrency', 'unloginedCurrency']),
    ...mapWritableState(useSupportStore, {
      isAddingTicket: 'isAddingTicket',
      supportFilter: 'filter'
    }),
    ...mapWritableState(useTransactionsStore, {
      transactionsFilter: 'filter'
    }),
    ...mapWritableState(useInvoicesStore, {
      invoicesFilter: 'filter'
    }),
    ...mapState(useChatsStore, ['chats']),
    ...mapGetters('nocloud/vms', { searchString: 'getString' }),
    active () {
      const { headerTitle, layoutTitle } = this.$route.meta

      if (headerTitle) return headerTitle
      if (layoutTitle) return layoutTitle
      return this.activeTab.title
    },
    isInSpecialType () {
      return this.$route.query?.type !== undefined
    },
    plainOptions () {
      function arrayUnique (arr) {
        return arr.filter((e, i, a) => a.indexOf(e) === i)
      }

      let filterElem
      if (this.active === 'support') {
        filterElem = [...this.tickets, ...this.chats.values()]
      } else if (this.active === 'billing') {
        const isInvoice = this.activeInvoiceTab === 'Invoice'

        filterElem = (isInvoice) ? this.invoices : this.transactions
      } else {
        filterElem = []
      }
      let statuses = filterElem.map((el) =>
        this.$t(`filterHeader.${el.status}`)
      )

      statuses = arrayUnique(statuses)

      Object.assign(this, {
        checkedList: statuses,
        indeterminate: false,
        checkAll: true
      })

      return statuses
    },
    isNeedHeader () {
      const conditions = [
        this.headers[this.active],
        this.isInSpecialType,
        this.$route.meta.headerTitle
      ]
      return conditions.some((el) => !!el)
    },
    isNeedBalance () {
      if (this.billingUser.paid_stop) return false
      else if (this.headers[this.active]) {
        return this.headers[this.active].needBalance
      } else if (this.$route.meta.isNeedBalance) {
        return this.$route.meta.isNeedBalance
      }
      return true
    },
    headerTitle () {
      if (this.headers[this.active] && this.$route.query.type === 'PaaS') {
        return this.$options.filters.capitalize(this.$t('Servers'))
      }

      if (this.headers[this.active]) {
        return this.$options.filters.capitalize(
          this.$t(this.headers[this.active].title)
        )
      } else if (this.$route.meta.headerTitle) {
        // console.log(this.$route.meta.headerTitle);
        // console.log(this.$t(this.$route.meta.headerTitle));
        // return this.$route.meta.headerTitle
        return this.$options.filters.capitalize(
          this.$t(this.$route.meta.headerTitle)
        )
      } else return ''
    },
    viewport () {
      return document.documentElement.offsetWidth
    }
  },
  watch: {
    active () {
      if (this.$route.query.service) {
        this.headers.iaas.title = this.$route.query.service
      }
    },
    activeInvoiceTab () {
      this.checkedList = []
      this.updateFilter()
    },
    currencyCode (value) {
      this.unloginedCurrency = value
    },
    '$i18n.locale' (value) {
      localStorage.setItem('lang', value)
    },
    billingUser (value) {
      if (value.only_tickets) {
        const i = this.headers.support.buttons.findIndex(({ icon }) => icon === 'telegram')

        this.headers.support.buttons.splice(i, 1)
      }
    }
  },
  created () {
    this.$api.get(this.baseURL, { params: { run: 'get_currencies' } })
      .then((res) => { this.currencies = res.currency })
      .catch(err => {
        const message = err.response?.data?.message ?? err.message

        this.$notification.error({ message: this.$t(message) })
        console.error(err)
      })
  },
  mounted () {
    if (this.$route.query.service) {
      this.headers.iaas.title = this.$route.query.service
    }

    if (this.viewport < 576) {
      this.isButtonsVisible = false
    }

    if (this.billingUser.only_tickets) {
      const i = this.headers.support.buttons.findIndex(({ icon }) => icon === 'telegram')

      this.headers.support.buttons.splice(i, 1)
    }

    const lang = navigator.language.replace(/-[a-z]{2}/i, '')

    if (this.langs.includes(lang) && !localStorage.getItem('lang')) {
      this.$i18n.locale = lang
    }
    this.currencyCode = this.defaultCurrency
  },
  methods: {
    ...actionsPinia(useAuthStore, ['fetchUserData']),
    ...actionsPinia(useProductsStore, { fetchProducts: 'fetch' }),
    ...mapActions('nocloud/vms', { fetchClouds: 'fetch' }),
    getState (name) {
      switch (name) {
        case 'support_filter':
          return this.isOnlyClosedTickets
        case 'support_plus':
          return this.isAddingTicket
        case 'cloud_plus':
          return false
      }
    },
    createVDC () {
      this.$router.push('/cloud/new')
    },
    onChange (checkedList) {
      this.indeterminate =
        !!this.checkedList.length &&
        checkedList.length < this.plainOptions.length
      this.checkAll = this.checkedList.length === this.plainOptions.length
      this.updateFilter(this.checkedList)
    },
    onCheckAllChange (e) {
      Object.assign(this, {
        checkedList: e.target.checked ? this.plainOptions : [],
        indeterminate: false,
        checkAll: e.target.checked
      })
      this.updateFilter(this.checkedList)
    },
    onChangeRange (range) {
      this.checkedList = range
      if (range.length < 1) {
        this.updateFilter(range)
        this.isVisible = false
        this.checkedList = []
      }
    },
    openRange (value) {
      this.isOpen = value
      this.isVisible = true
    },
    routeBack () {
      if (this.activeTab.title.includes('iaas') && this.$route.query.product) {
        const query = { ...this.$route.query }

        delete query.product
        this.$router.push({ path: '/iaas', query })
        return
      }

      if (this.activeTab.title.includes('service-')) {
        // if (this.$route.query.service) {
        //   const { service } = this.$route.query;

        //   this.$router.push({ name: 'products', query: { service } });
        // } else {
        this.$router.push('/services')
        // }
        return
      }

      if (this.activeTab.title.includes('invoice')) {
        this.$router.push('/billing')
        return
      }

      switch (this.activeTab.title) {
        case 'cabinet':
          this.$router.push('/settings')
          break
        case 'ticket':
          this.$router.push('/support')
          break
        case 'service':
        case 'products':
        case 'newPaaS':
          this.$router.push('/services')
          break
        default:
          this.$router.go(-1)
          break
      }
    },
    orderVM () {
      this.$router.push({ name: 'newPaaS' })
    },
    updateFilter (info) {
      if (this.active === 'support') {
        const filtered = {}

        if (!info) {
          info = JSON.parse(localStorage.getItem('supportFilters') ?? '[]')
          this.checkedList = info
        } else {
          const filters = info.map((el) => filtered[el])

          localStorage.setItem('supportFilters', JSON.stringify(filters))
        }

        [...this.tickets, ...this.chats.values()].forEach((el) => {
          const status = (typeof el.status === 'number')
            ? Status[el.status].toLowerCase()
            : el.status
          const capitalized = `${status[0].toUpperCase()}${status.slice(1)}`
          const key = this.$t(`filterHeader.${el.status}`)

          filtered[key] = capitalized
        })
        this.supportFilter = info.map((el) => filtered[el])
      }

      if (this.active === 'billing' && this.activeInvoiceTab === 'Detail') {
        const dates = JSON.parse(
          localStorage.getItem('detailFilters') ?? '[]'
        ).map((el) => moment(el))

        if (!info) {
          info = dates
          this.checkedList = info
        } else {
          localStorage.setItem('detailFilters', JSON.stringify(info))
        }

        this.transactionsFilter = info
      } else if (this.active === 'billing') {
        const filtered = {}

        if (!info) {
          info = JSON.parse(localStorage.getItem('invoiceFilters') ?? '[]')
          this.checkedList = info
        } else {
          const filters = info.map((el) => filtered[el])

          localStorage.setItem('invoiceFilters', JSON.stringify(filters))
        }

        this.invoices.forEach((el) => {
          const key = this.$t(`filterHeader.${el.status}`)

          filtered[key] = el.status
        })
        this.invoicesFilter = info.map((el) => filtered[el])
      }
    },
    updateSearch ({ key, target }) {
      if (key !== 'Backspace') return
      if (target.value.length > 1) return

      this.$store.commit('nocloud/vms/setSearch', '')
    }
  }
}
</script>

<style>
.header__wrapper {
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
  font-size: 1.1rem;
}

.header__wrapper--four {
  grid-template-columns: 20% 1fr 20% 20%;
}

.header__left {
  width: 90%;
  height: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.header__title {
  font-weight: bold;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  margin-right: 5px;
  overflow: hidden;
}

.header__title > span {
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.header_back_btn {
  font-size: 1.4rem;
  margin-right: 20px;
}

.header__links {
  display: flex;
  align-items: center;
}

.header__links a {
  color: #fff;
  transition: color 0.2s ease, background-color 0.3s ease, opacity 0.2s ease;
}

.header__links a:hover {
  color: #fff;
}

.header__links a:not(:last-child) {
  margin-right: 20px;
}

.header__links a:first-child {
  opacity: 0.8;
}

.header__links a:first-child:hover {
  opacity: 1;
}

.header__links a:last-child {
  max-width: 100px;
  padding: 10px 15px;
  border-radius: 5px;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0px 0px 0px 1px #fff;
}

.header__links a:last-child:hover {
  background: #fff;
  color: var(--main);
}

.header__right {
  transition: transform 0.2s ease;
}

.header__icon {
  font-size: 1.4rem;
}

.icon__wrapper {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.1s ease, transform 0.2s ease;
}

.btn--no-image {
  min-width: 44px;
  width: auto;
  border-radius: 30px;
  padding: 2px 10px;
}

.header__btn--no-image {
  font-size: 1rem;
}

.icon__wrapper:hover {
  background-color: var(--bright_bg);
  color: var(--main);
  transform: scale(1.2);
}
.icon__wrapper.active__btn {
  background-color: var(--bright_bg);
  color: var(--main);
}

.icon__wrapper:active {
  transform: scale(1.1);
}

.active-rotate.active__btn {
  transform: rotate(45deg);
}

.header__wrapper {
  display: flex;
  justify-content: space-between;
  padding: 0 15px;
}

.header__buttons {
  display: flex;
  justify-content: space-around;
}

.header__button:not(:last-child) {
  margin-right: 15px;
}

.header__right-side {
  display: flex;
  align-items: center;
}

.header__selects {
  display: flex;
  gap: 10px;
  margin-right: 15px;
}

.header__selects .ant-select-selection {
  background: transparent;
  color: var(--bright_bg);
}

.header__selects .ant-select-selection__rendered {
  margin-right: 30px;
}

.header__selects .ant-select-arrow {
  color: inherit;
}

.header__balance {
  margin-left: 10px;
  padding-right: 10px;
}

.header__item-anim-enter-active,
.header__item-anim-leave-active {
  transition: all 0.2s;
}
.header__item-anim-enter,
.header__item-anim-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

@media screen and (max-width: 576px) {
  .header__buttons {
    position: absolute;
    bottom: -35px;
    left: 0;
    z-index: 10;
    width: 100%;
    border-radius: 0 0 10px 10px;
    background: var(--main);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
  }

  .icon__wrapper {
    width: 40px;
    height: 40px;
  }

  .header_back_btn,
  .header__right-side .header__button {
    margin-right: 5px;
  }

  .header__selects {
    position: absolute;
    left: 0;
    top: 62px;
    z-index: 10;
    width: 100%;
    padding: 0 15px 15px;
    border-radius: 0 0 10px 10px;
    background: var(--main);
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
  }

  .header__links a:not(:last-child) {
    margin-right: 10px;
  }
}
</style>
