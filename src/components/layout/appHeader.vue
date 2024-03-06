<template>
  <div class="header__container">
    <div class="container">
      <div v-if="isNeedHeader" class="header__wrapper">
        <div class="header__title">
          <div
            v-if="
              (headers[active] && headers[active].notmain) ||
                isInSpecialType ||
                $route.meta.isNeedBackButton
            "
            class="header_back_btn icon__wrapper"
            @click="routeBack"
          >
            <left-icon />
          </div>
          <!-- {{$t(`headerTitle.${headerTitle}`)}} -->
          <span>{{ headerTitle }}</span>
        </div>

        <div class="header__right-side">
          <div v-if="headers[active] && isLogged && isButtonsVisible" class="header__buttons">
            <transition-group name="header__item-anim">
              <div
                v-for="button in headers[active].buttons"
                :key="button.name"
                class="header__button"
              >
                <div
                  v-if="button.onClickFuncion && button.type == undefined"
                  class="icon__wrapper"
                  :class="[
                    { active__btn: getState(button.name) },
                    button.additionalClass,
                  ]"
                  @click="button.onClickFuncion"
                >
                  <component
                    :is="button.icon"
                    :spin="button.isSpin"
                    class="header__icon"
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

                <a-input-search
                  v-else-if="viewport < 576 && button.name.includes('search')"
                  v-model:value="searchString"
                  search
                  placeholder="Title / Status / IP"
                  @search="(text) => searchString = text"
                  @keydown="updateSearch"
                />

                <div
                  v-else-if="button.name.includes('search')"
                  class="icon__wrapper"
                  :class="[button.additionalClass]"
                  :style="(searchString.length > 0) ? {
                    borderRadius: '50%',
                    background: 'var(--bright_bg)',
                    color: 'var(--main)'
                  } : null"
                >
                  <component
                    :is="button.icon"
                    v-if="!button.popover"
                    class="header__icon"
                  />
                  <a-popover v-else arrow-point-at-center placement="left" :align="{ offset: [-10, 0] }">
                    <template #content>
                      <a-input-search
                        v-model:value="searchString"
                        enter-button
                        placeholder="Title / Status / IP"
                        @search="(text) => searchString = text"
                        @keydown="updateSearch"
                      >
                        <template #suffix>
                          <div style="cursor: pointer" @click="searchString = ''">
                            <close-icon style="color: rgba(0, 0, 0, 0.45)" />
                          </div>
                        </template>
                      </a-input-search>
                    </template>
                    <component :is="button.icon" class="header__icon" />
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
                  <component
                    :is="button.icon"
                    v-if="!button.popover"
                    class="header__icon"
                  />
                  <a-popover
                    v-else
                    arrow-point-at-center
                    placement="bottomRight"
                    :open="isVisible"
                    @open-change="((isOpen) ? isVisible = true : isVisible = !isVisible)"
                  >
                    <template #content>
                      <a-range-picker
                        v-if="active === 'billing' && activeInvoiceTab === 'Detail'"
                        show-time
                        :value="checkedList"
                        @ok="updateFilter"
                        @change="onChangeRange"
                        @open-change="openRange"
                      />
                      <a-checkbox-group
                        v-else
                        v-model:value="checkedList"
                        :options="plainOptions"
                        @change="onChange"
                      />
                    </template>
                    <template #title>
                      <span>{{ capitalize($t("filter")) }}</span>
                    </template>
                    <component
                      :is="button.icon"
                      class="header__icon"
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
          </div>

          <transition name="header__item-anim">
            <div
              v-if="viewport < 576 && headers[active]?.buttons.length > 0 && isLogged"
              class="header__button"
              @click="isButtonsVisible = !isButtonsVisible"
            >
              <div
                class="icon__wrapper" :style="(isButtonsVisible) ? {
                  borderRadius: '50%',
                  background: 'var(--bright_bg)',
                  color: 'var(--main)'
                } : null"
              >
                <down-icon :rotate="(isButtonsVisible) ? 180 : 0" class="header__icon" />
              </div>
            </div>
          </transition>
          <transition name="header__item-anim">
            <div v-if="isNeedBalance && isLogged" class="header__balance">
              <balance />
            </div>
          </transition>

          <transition name="header__item-anim">
            <div
              v-if="viewport < 576 && !isLogged"
              class="header__button"
              @click="isButtonsVisible = !isButtonsVisible"
            >
              <div
                class="icon__wrapper" :style="(isButtonsVisible) ? {
                  borderRadius: '50%',
                  background: 'var(--bright_bg)',
                  color: 'var(--main)'
                } : null"
              >
                <down-icon :rotate="(isButtonsVisible) ? 180 : 0" class="header__icon" />
              </div>
            </div>
          </transition>

          <div v-if="!isLogged && isButtonsVisible" class="header__selects">
            <a-select
              v-model:value="$i18n.locale"
              style="width: 100%; color: var(--bright_font)"
              class="header__inputs"
            >
              <a-select-option v-for="lang in langs" :key="lang">
                {{ $t('localeLang', lang) }}
              </a-select-option>
            </a-select>

            <a-select
              v-model:value="unloginedCurrency"
              style="width: 100%; color: var(--bright_font)"
              class="header__inputs"
            >
              <a-select-option v-for="currency in currencies" :key="currency.code">
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
import { defineAsyncComponent } from 'vue'
import { mapState, mapWritableState, mapActions } from 'pinia'
import dayjs from 'dayjs'

import {
  FilterOutlined as filterIcon,
  ReloadOutlined as reloadIcon,
  SearchOutlined as searchIcon,
  PlusOutlined as plusIcon
} from '@ant-design/icons-vue'

import config from '@/appconfig.js'
import { Status } from '@/libs/cc_connect/cc_pb.js'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useCurrenciesStore } from '@/stores/currencies.js'

import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'

import { useProductsStore } from '@/stores/products.js'
import { useInstancesStore } from '@/stores/instances.js'

import { useInvoicesStore } from '@/stores/invoices.js'
import { useTransactionsStore } from '@/stores/transactions.js'

import balance from '@/components/ui/balance.vue'

const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)
const closeIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CloseOutlined')
)
const downIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/DownOutlined')
)

export default {
  name: 'AppHeader',
  components: { balance, leftIcon, closeIcon, downIcon },
  emits: ['update:isButtonVisible'],
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
              icon: filterIcon,
              popover: true
            },
            {
              name: 'support_plus',
              icon: plusIcon,
              onClickFuncion: () => { this.isAddingTicket = !this.isAddingTicket },
              isActiveState: this.isAddingTicket,
              additionalClass: ['active-rotate']
            },
            {
              name: 'support_reload',
              icon: reloadIcon,
              onClickFuncion: () => {
                this.fetchTickets()
                this.fetchUserData()
              }
            }
          ]
        },
        services: {
          title: '',
          needBalance: true,
          buttons: [
            {
              name: 'cloud_search',
              icon: searchIcon,
              popover: true
            },
            {
              name: 'cloud_reload',
              icon: reloadIcon,
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
              icon: filterIcon,
              popover: true
              // доделать фильтр тут
            },
            {
              name: 'invoice_reload',
              icon: reloadIcon,
              onClickFuncion: () => {
                const params = {
                  account: this.userdata.uuid,
                  page: this.currentPage,
                  limit: this.pageSize,
                  field: 'exec',
                  sort: 'desc'
                }

                if (this.activeInvoiceTab === 'Invoice') this.fetchInvoices()
                else this.fetchTransactions(params, true)
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
          title: 'Create',
          notmain: true,
          needBalance: true,
          buttons: []
        },
        newPaaS: {
          title: 'Create',
          notmain: true,
          needBalance: true,
          buttons: []
        },
        iaas: {
          title: 'Service',
          needBalance: true,
          buttons: []
        },
        openVDC: {
          title: 'VDC',
          needBalance: true,
          buttons: []
        }
      },
      langs: config.languages,
      currencies: []
    }
  },
  computed: {
    ...mapState(useAppStore, ['activeTab']),
    ...mapState(useAuthStore, ['baseURL', 'billingUser', 'userdata', 'isLogged']),
    ...mapState(useChatsStore, ['chats']),
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
    ...mapWritableState(useInstancesStore, ['searchString']),
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

        filterElem = (isInvoice) ? this.invoices : []
      } else {
        filterElem = []
      }
      const statuses = filterElem.map((el) =>
        this.$t(`filterHeader.${el.status}`)
      )

      return arrayUnique(statuses)
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
        return this.capitalize(this.$t('Servers'))
      }

      if (this.$route.query.headerTitle) {
        return this.$route.query.headerTitle
      }

      if (this.headers[this.active]) {
        return this.capitalize(
          this.$t(this.headers[this.active].title)
        )
      } else if (this.$route.meta.headerTitle) {
        // console.log(this.$route.meta.headerTitle);
        // console.log(this.$t(this.$route.meta.headerTitle));
        // return this.$route.meta.headerTitle
        return this.capitalize(
          this.$t(this.$route.meta.headerTitle)
        )
      } else return ''
    },
    viewport () {
      return document.documentElement.offsetWidth
    }
  },
  watch: {
    active (value) {
      if (this.$route.query.service) {
        this.headers.iaas.title = this.$route.query.service
      }

      if (value === 'support') {
        this.isButtonsVisible = true
      }
    },
    activeInvoiceTab () {
      this.checkedList = []
      this.updateFilter()
    },
    plainOptions (statuses) {
      Object.assign(this, {
        checkedList: statuses.filter((status) =>
          (this.active === 'support') ? status !== 'Closed' : true
        ),
        indeterminate: false,
        checkAll: true
      })
      this.updateFilter(this.checkedList)
    },
    isButtonsVisible (value) {
      this.$emit('update:isButtonVisible', value)
    },
    defaultCurrency (value) {
      this.unloginedCurrency = value
    },
    '$i18n.locale' (value) {
      localStorage.setItem('lang', value)
    }
  },
  created () {
    if (config.whmcsSiteUrl) {
      this.$api.get(this.baseURL, { params: { run: 'get_currencies' } })
        .then((res) => { this.currencies = res.currency })
        .catch(err => {
          const message = err.response?.data?.message ?? err.message

          this.$notification.error({ message: this.$t(message) })
          console.error(err)
        })
    }

    if (this.currencies.length < 1) this.fetchCurrencies()
  },
  mounted () {
    if (this.$route.query.service) {
      this.headers.iaas.title = this.$route.query.service
    }

    if (this.viewport < 576) {
      this.isButtonsVisible = false
    }

    const lang = navigator.language.replace(/-[a-z]{2}/i, '')

    if (this.langs.includes(lang) && !localStorage.getItem('lang')) {
      this.$i18n.locale = lang
    }
    this.unloginedCurrency = this.defaultCurrency
  },
  methods: {
    ...mapActions(useAuthStore, ['fetchUserData']),
    ...mapActions(useCurrenciesStore, ['fetchCurrencies']),
    ...mapActions(useProductsStore, { fetchProducts: 'fetch' }),
    ...mapActions(useInstancesStore, { fetchClouds: 'fetch' }),
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
      if (!range || range?.length < 1) {
        this.updateFilter(range ?? [])
        this.isVisible = false
        this.checkedList = []
      } else {
        this.fetchTransactions({
          account: this.userdata.uuid,
          page: this.currentPage,
          limit: this.pageSize,
          field: 'exec',
          sort: 'desc',
          filters: {
            start: { from: Math.round(range[0].toDate().getTime() / 1000) },
            end: { from: Math.round(range[1].toDate().getTime() / 1000) }
          }
        }, true)
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
        const filtered = {};

        [...this.tickets, ...this.chats.values()].forEach((el) => {
          const status = (typeof el.status === 'number')
            ? Status[el.status].toLowerCase()
            : el.status
          const capitalized = `${status[0].toUpperCase()}${status.slice(1)}`
          const key = this.$t(`filterHeader.${el.status}`)

          filtered[key] = capitalized
        })

        if (!info) {
          info = JSON.parse(localStorage.getItem('supportFilters') ?? '[]')
          this.checkedList = info
        } else {
          localStorage.setItem('supportFilters', JSON.stringify(info))
        }

        this.supportFilter = info.map((el) => filtered[el])
      }

      if (this.active === 'billing' && this.activeInvoiceTab === 'Detail') {
        const dates = JSON.parse(
          localStorage.getItem('detailFilters') ?? '[]'
        ).map((date) => dayjs(date))

        if (!info) {
          info = dates
          this.checkedList = info
        } else {
          localStorage.setItem('detailFilters', JSON.stringify(info))
        }

        this.transactionsFilter = info
      } else if (this.active === 'billing') {
        const filtered = {}

        this.invoices.forEach((el) => {
          const key = this.$t(`filterHeader.${el.status}`)

          filtered[key] = el.status
        })

        if (!info) {
          info = JSON.parse(localStorage.getItem('invoiceFilters') ?? '[]')
          this.checkedList = info
        } else {
          localStorage.setItem('invoiceFilters', JSON.stringify(info))
        }

        this.invoicesFilter = info.map((el) => filtered[el])
      }
    },
    updateSearch ({ key, target }) {
      if (key !== 'Backspace') return
      if (target.value.length > 1) return

      this.searchString = ''
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
  margin: 0 20px 0 5px;
}

.ant-select.header__inputs .ant-select-selector {
  background: transparent;
  color: var(--gloomy_font);
  border-color: var(--gloomy_font);
}

.ant-select.header__inputs.ant-select-open .ant-select-selection-item {
  color: var(--gloomy_font);
}

.header__links {
  display: flex;
  align-items: center;
}

.header__links a {
  color: var(--gloomy_font);
  transition: color 0.2s ease, background-color 0.3s ease, opacity 0.2s ease;
}

.header__links a:hover {
  color: var(--gloomy_font);
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
  max-width: 25vw;
  padding: 10px 15px;
  border-radius: 5px;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0px 0px 0px 1px var(--gloomy_font);
}

.header__links a:last-child:hover {
  background: var(--bright_font);
  color: var(--main);
  box-shadow: none;
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

.header__buttons .header__button {
  line-height: 1;
  margin-bottom: 5px;
}

.header__button:not(:last-child) {
  margin-right: 15px;
}

.header__right-side {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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
  color: var(--gloomy_font);
}

.header__balance {
  margin-left: 10px;
  padding-right: 10px;
}

.header__item-anim-enter-active,
.header__item-anim-leave-active {
  transition: all 0.2s;
}
.header__item-anim-enter-from,
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
    align-items: center;
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

  .header__links a:last-child {
    max-width: 36vw;
  }

  .header__links a:not(:last-child) {
    margin-right: 10px;
  }
}
</style>
