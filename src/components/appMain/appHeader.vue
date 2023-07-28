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
          {{ headerTitle }}
        </div>

        <div class="header__right-side">
          <transition-group
            name="header__item-anim"
            class="header__buttons"
            v-if="headers[active] && isLogged && isButtonsVisible"
            tag="div"
          >
            <div
              class="header__button"
              v-for="button in headers[active].buttons"
              :key="button.icon"
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
                <div class="header__btn--no-image">{{ button.name }}</div>
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
                <a-popover arrow-point-at-center v-else placement="left" :align="{ offset: [-10, 0] }">
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
                        @click="$store.commit('nocloud/vms/setSearch', '')"
                        style="cursor: pointer"
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
                  <template slot="content">
                    <div>
                      <a-checkbox-group
                        v-if="activeInvoiceTab === 'Invoice'"
                        v-model="checkedList"
                        :options="plainOptions"
                        @change="onChange"
                      />
                      <a-range-picker
                        v-else-if="active === 'invoice'"
                        show-time
                        :value="checkedList"
                        @ok="updateFilter"
                        @change="onChangeRange"
                        @openChange="openRange"
                      />
                    </div>
                  </template>
                  <template slot="title">
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
            name="header__item-anim"
            v-if="viewport < 576 && headers[active]?.buttons.length > 0 && isLogged"
          >
            <div class="header__button" @click="isButtonsVisible = !isButtonsVisible">
              <div class="icon__wrapper" :style="(isButtonsVisible) ? {
                borderRadius: '50%',
                background: 'var(--bright_bg)',
                color: 'var(--main)'
              } : null">
                <a-icon class="header__icon" type="down" />
              </div>
            </div>
          </transition>
          <transition name="header__item-anim">
            <div v-if="isNeedBalance && isLogged" class="header__balance">
              <balance />
            </div>
          </transition>

          <div class="header__selects" v-if="!isLogged">
            <a-select style="width: 100%; border: none" v-model="$i18n.locale">
              <a-select-option v-for="lang in langs" :key="lang" :value="lang">
                {{ $t('localeLang', lang) }}
              </a-select-option>
            </a-select>

            <a-select style="width: 100%; border: none" v-model="currencyCode">
              <a-select-option v-for="currency in currencies" :key="currency.code" :value="currency.code">
                {{ currency.code }}
              </a-select-option>
            </a-select>
          </div>
          <div class="header__links" v-if="!isLogged">
            <router-link :to="{ name: 'login' }">{{ $t("login") }}</router-link>
            <router-link :to="{ name: 'register' }">{{ $t("unregistered.sign up") }}</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from "vuex";
import balance from "@/components/balance/balance.vue";
import moment from "moment";

export default {
  name: "appHeader",
  components: {
    balance,
  },
  data() {
    return {
      isOpen: false,
      isVisible: false,
      isButtonsVisible: true,
      indeterminate: true,
      checkAll: false,
      checkedList: [],
      headers: {
        cloud: {
          title: "Cloud",
          needBalance: true,
          buttons: [],
        },
        support: {
          title: "Support",
          needBalance: true,
          buttons: [
            {
              name: "support_filter",
              icon: "filter",
              popover: true,
            },
            {
              name: "support_plus",
              icon: "plus",
              onClickFuncion: this.inverseAddTicketState,
              isActiveState: this.isAddTicketState,
              additionalClass: ["active-rotate"],
            },
            {
              name: "support_reload",
              icon: "reload",
              onClickFuncion: () => {
                this.fetchTickets();
                this.fetchUserData();
              },
            },
          ],
        },
        services: {
          title: "services",
          needBalance: true,
          buttons: [
            {
              name: "cloud_search",
              icon: "search",
              popover: true,
            },
            {
              name: "cloud_reload",
              icon: "reload",
              onClickFuncion: () => {
                this.fetchClouds();
                this.fetchProducts();
                this.fetchUserData();
              },
            },
          ],
        },
        invoice: {
          title: "Invoice",
          needBalance: true,
          buttons: [
            {
              name: "invoice_filter",
              icon: "filter",
              popover: true,
              // доделать фильтр тут
            },
            {
              name: "invoice_reload",
              icon: "reload",
              onClickFuncion: () => {
                const params = {
                  account: this.userdata.uuid,
                  page: this.$store.getters["nocloud/transactions/page"],
                  limit: this.$store.getters["nocloud/transactions/size"],
                  field: "proc",
                  sort: "desc"
                };

                this.fetchInvoices();
                this.fetchTransactions(params)
                this.fetchUserData();
              },
            },
          ],
        },
        settings: {
          title: "Settings",
          buttons: [],
        },
        newVDC: {
          title: "Create VM",
          notmain: true,
          needBalance: true,
          buttons: [],
        },
        newPaaS: {
          title: "Create VM",
          notmain: true,
          needBalance: true,
          buttons: [],
        },
        iaas: {
          title: "Service",
          needBalance: true,
          buttons: [],
        }
      },
      langs: this.$config.languages,
      currencies: [],
      currencyCode: ''
    };
  },
  methods: {
    ...mapActions("support", { fetchTickets: "fetch" }),
    ...mapActions("invoices", { fetchInvoices: "fetch" }),
    ...mapActions("products", { fetchProducts: "fetch" }),
    ...mapActions("nocloud/vms", { fetchClouds: "fetch" }),
    ...mapActions("nocloud/transactions", { fetchTransactions: "fetch" }),
    ...mapActions("nocloud/auth", ["fetchUserData"]),
    ...mapMutations("support", ["inverseAddTicketState"]),
    getState(name) {
      switch (name) {
        case "support_filter":
          return this.isOnlyClosedTickets;
        case "support_plus":
          return this.isAddTicketState;
        case "cloud_plus":
          return false;
      }
    },
    createVDC() {
      this.$router.push("/cloud/new");
    },
    onChange(checkedList) {
      this.indeterminate =
        !!this.checkedList.length &&
        checkedList.length < this.plainOptions.length;
      this.checkAll = this.checkedList.length === this.plainOptions.length;
      this.updateFilter(this.checkedList);
    },
    onCheckAllChange(e) {
      Object.assign(this, {
        checkedList: e.target.checked ? this.plainOptions : [],
        indeterminate: false,
        checkAll: e.target.checked,
      });
      this.updateFilter(this.checkedList);
    },
    onChangeRange(range) {
      this.checkedList = range;
      if (range.length < 1) {
        this.updateFilter(range);
        this.isVisible = false;
        this.checkedList = [];
      }
    },
    openRange(value) {
      this.isOpen = value;
      this.isVisible = true;
    },
    routeBack() {
      if (this.getActiveTab.title.includes('iaas') && this.$route.query.product) {
        const query = { ...this.$route.query };

        delete query.product;
        this.$router.push({ path: '/iaas', query });
        return;
      }
      if (this.getActiveTab.title.includes('service-')) {
        if (this.$route.query.service) {
          const { service } = this.$route.query;

          this.$router.push({ name: 'products', query: { service } });
        } else {
          this.$router.push('/services');
        }
        return;
      }
      if (this.getActiveTab.title.includes('invoice')) {
        this.$router.push('/invoice');
        return;
      }

      switch (this.getActiveTab.title) {
        case 'cabinet':
          this.$router.push('/settings');
          break;
        case 'ticket':
          this.$router.push('/support');
          break;
        case 'products':
        case 'newPaaS':
          this.$router.push('/services');
          break;
        default:
          this.$router.go(-1);
          break;
      }
    },
    orderVM() {
      this.$router.push({ name: "newPaaS" });
    },
    updateFilter(info) {
      if (this.active == "support") {
        const filtered = {};

        if (!info) {
          info = JSON.parse(localStorage.getItem("supportFilters") ?? "[]");
          this.checkedList = info;
        } else {
          const filters = info.map((el) => filtered[el]);

          localStorage.setItem("supportFilters", JSON.stringify(filters));
        }

        this.getAllTickets.forEach((el) => {
          const key = this.$t(`filterHeader.${el.status}`);

          filtered[key] = el.status;
        });
        this.$store.commit("support/updateFilter", info.map((el) => filtered[el]));
      }

      if (this.active == "invoice" && this.activeInvoiceTab == "Detail") {
        const dates = JSON.parse(
          localStorage.getItem("detailFilters") ?? "[]"
        ).map((el) => moment(el));

        if (!info) {
          info = dates;
          this.checkedList = info;
        } else {
          localStorage.setItem("detailFilters", JSON.stringify(info));
        }

        this.$store.commit("nocloud/transactions/updateFilter", info);
      } else if (this.active == "invoice") {
        const filtered = {};

        if (!info) {
          info = JSON.parse(localStorage.getItem("invoiceFilters") ?? "[]");
          this.checkedList = info;
        } else {
          const filters = info.map((el) => filtered[el]);

          localStorage.setItem("invoiceFilters", JSON.stringify(filters));
        }

        this.getAllInvoices.forEach((el) => {
          const key = this.$t(`filterHeader.${el.status}`);

          filtered[key] = el.status;
        });
        this.$store.commit("invoices/updateFilter", info.map((el) => filtered[el]));
      }
    },
    updateSearch({ key, target }) {
      if (key !== 'Backspace') return;
      if (target.value.length > 1) return;

      this.$store.commit('nocloud/vms/setSearch', '');
    }
  },
  created() {
    this.$api.get(this.baseURL, { params: { run: 'get_currencies' } })
      .then((res) => { this.currencies = res.currency })
			.catch(err => {
        const message = err.response?.data?.message ?? err.message;

				this.openNotificationWithIcon('error', {
          message: this.$t(message)
        });
				console.error(err);
			});
  },
  mounted() {
    if (this.$route.query.service) {
      this.headers.iaas.title = this.$route.query.service;
    }

    if (this.viewport < 576) {
      this.isButtonsVisible = false;
    }

    this.currencyCode = this.defaultCurrency;
  },
  computed: {
    ...mapGetters("support", [
      "isAddTicketState",
      "isOnlyClosedTickets",
      "getTickets",
      "getAllTickets",
    ]),
    ...mapGetters("app", ["getActiveTab"]),
    ...mapGetters("nocloud/vms", { searchString: "getString" }),
    ...mapGetters("invoices", ["getInvoices", "getAllInvoices"]),
    ...mapGetters("nocloud/transactions", {
      transactions: "all",
      activeInvoiceTab: "activeTab"
    }),
    active() {
      const { headerTitle, layoutTitle } = this.$route.meta;

      if (headerTitle) return headerTitle;
      if (layoutTitle) return layoutTitle;
      return this.getActiveTab.title;
    },
    isInSpecialType() {
      return this.$route.query?.type !== undefined;
    },
    plainOptions() {
      function arrayUnique(arr) {
        return arr.filter((e, i, a) => a.indexOf(e) == i);
      }

      let filterElem;
      if (this.active == "support") {
        filterElem = this.getAllTickets;
      } else if (this.active == "invoice") {
        const isInvoice = this.activeInvoiceTab === 'Invoice';

        filterElem = (isInvoice) ? this.getAllInvoices : this.transactions;
      } else {
        filterElem = [];
      }
      let statuses = filterElem.map((el) =>
        this.$t(`filterHeader.${el.status}`)
      );

      statuses = arrayUnique(statuses);

      Object.assign(this, {
        checkedList: statuses,
        indeterminate: false,
        checkAll: true,
      });

      return statuses;
    },
    isNeedHeader() {
      const conditions = [
        this.headers[this.active],
        this.isInSpecialType,
        this.$route.meta.headerTitle,
      ];
      return conditions.some((el) => !!el);
    },
    isNeedBalance() {
      if (this.user.paid_stop) return false;
      else if (this.headers[this.active])
        return this.headers[this.active].needBalance;
      else if (this.$route.meta.isNeedBalance)
        return this.$route.meta.isNeedBalance;
    },
    headerTitle() {
      if (this.headers[this.active] && this.$route.query.type == "PaaS") {
        return this.$options.filters.capitalize(this.$t("Servers"));
      }

      if (this.headers[this.active])
        return this.$options.filters.capitalize(
          this.$t(this.headers[this.active].title)
        );
      else if (this.$route.meta.headerTitle) {
        // console.log(this.$route.meta.headerTitle);
        // console.log(this.$t(this.$route.meta.headerTitle));
        // return this.$route.meta.headerTitle
        return this.$options.filters.capitalize(
          this.$t(this.$route.meta.headerTitle)
        );
      } else return "";
    },
    isLogged() {
      return this.$store.getters['nocloud/auth/isLoggedIn'];
    },
    baseURL(){
      return this.$store.getters['support/getURL'];
    },
    userdata() {
      return this.$store.getters['nocloud/auth/userdata'];
    },
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    defaultCurrency() {
      return this.$store.getters['nocloud/auth/defaultCurrency'];
    },
    viewport() {
      return document.documentElement.offsetWidth;
    }
  },
  watch: {
    active() {
      if (this.$route.query.service) {
        this.headers.iaas.title = this.$route.query.service;
      }
    },
    activeInvoiceTab() {
      this.checkedList = [];
      this.updateFilter();
    },
    currencyCode(value) {
      this.$store.commit('nocloud/auth/setUnloginedCurrency', value);
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
}

.header_back_btn {
  font-size: 1.4rem;
  margin-right: 20px;
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
  box-shadow: 0px 0px 0px 1px #fff;
  border-radius: 5px;
  padding: 10px 15px;
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
}
</style>
