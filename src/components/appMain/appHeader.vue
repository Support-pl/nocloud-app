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
            v-if="headers[active] && isLogged"
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
              >
                <a-icon
                  v-if="!button.popover"
                  class="header__icon"
                  :type="button.icon"
                />
                <a-popover v-else placement="bottomRight" arrow-point-at-center>
                  <template slot="content">
                    <div>
                      <a-input-search
                        placeholder="title/status/IP"
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
                    </div>
                  </template>
                  <template slot="title">
                    <span>{{ $t("search") | capitalize }}</span>
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
                <a-popover v-else placement="bottomRight" arrow-point-at-center>
                  <template slot="content">
                    <div>
                      <a-checkbox-group
                        v-model="checkedList"
                        :options="plainOptions"
                        @change="onChange"
                      />
                    </div>
                  </template>
                  <template slot="title">
                    <span>{{ $t("filter") | capitalize }}</span>
                  </template>
                  <a-icon class="header__icon" :type="button.icon" />
                </a-popover>
              </div>
            </div>
          </transition-group>
          <transition name="header__item-anim">
            <div v-if="isNeedBalance && isLogged" class="header__balance">
              <balance />
            </div>
          </transition>

          <div class="header__links" v-if="!isLogged">
            <router-link :to="{ name: 'login' }">{{ $t("login") }}</router-link>
            <router-link :to="{ name: 'register' }">{{
              $t("unregistered.sign up")
            }}</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from "vuex";
import balance from "../balance/balance.vue";

export default {
  name: "appHeader",
  components: {
    balance,
  },
  data() {
    return {
      indeterminate: true,
      checkAll: false,
      checkedList: [],
      headers: {
        cloud: {
          title: "Cloud",
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
                this.fetchUserData();
              },
            },
          ],
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
          buttons: [],
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
                this.fetchInvoices();
                this.fetchTransactions()
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
      },
    };
  },
  methods: {
    ...mapActions("support", { fetchTickets: "fetch" }),
    ...mapActions("invoices", { fetchInvoices: "fetch" }),
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
    routeBack() {
      this.$router.go(-1);
    },
    orderVM() {
      this.$router.push({ name: "newPaaS" });
    },
    updateFilter(info) {
      if (this.active == "support") {
        const filtered = {};
        this.getAllTickets.forEach((el) => {
          const key = this.$t(`filterHeader.${el.status}`);

          filtered[key] = el.status;
        });
        this.$store.commit("support/updateFilter", info.map((el) => filtered[el]));
      } else if (this.active == "invoice") {
        const filtered = {};
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
    active() {
      const headerTitle = this.$route.meta?.headerTitle;
      const layoutTitle = this.$route.meta?.layoutTitle;
      if (headerTitle) {
        return headerTitle;
      }
      if (layoutTitle) {
        return layoutTitle;
      }
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
        filterElem = this.getAllInvoices;
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
      if (this.headers[this.active])
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
</style>
