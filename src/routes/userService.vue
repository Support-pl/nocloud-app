<template>
  <div class="service-page">
    <div class="container">
      <div class="service-page-card">
        <template v-if="service">
          <div class="service-page__header">
            <div class="service-page__title">
              {{ service.name }}
            </div>
            <div v-if="service.domain" class="service-page__domain">
              <a :href="service.domain">{{ service.domain }}</a>
            </div>
          </div>

          <div class="service-page__info">
            <div class="service-page__info-title">
              {{ $t("status") | capitalize }}:
              <a-tag :color="getTagColor">
                {{ $t(service.status) }}
              </a-tag>
            </div>
          </div>

          <div class="service-page__info" v-if="service.ORDER_INFO">
            <div class="service-page__info-title">
              {{ $t("invoice status") | capitalize }}:
              <a-tag :color="getInvoiceStatusColor">
                {{ $t("invoice_" + service.ORDER_INFO.invoicestatus) }}
              </a-tag>
              <router-link
                :to="{
                  name: 'invoiceFS',
                  params: { uuid: service.ORDER_INFO.invoiceid },
                }"
              >
                <a-button size="small" type="primary">
                  {{ $t("open") }}
                </a-button>
              </router-link>
            </div>
          </div>

          <!-- SSL -->
          <div class="service-page__info" v-if="service.groupname === 'SSL'">
            <div
              class="service-page__info-title"
              v-if="true || service.SSL.sslstatus === 'Completed'"
            >
              {{ $t("ssl_product.configuration status") }}:
              <a-tag :color="getTagColorSSL">
                {{ $t("ssl_product.completed") }}
              </a-tag>
              <router-link
                :to="{
                  name: 'ssl',
                  params: {
                    id: $route.params.id,
                  },
                }"
              >
                <a-button size="small" type="primary">
                  {{ $t("open") }}
                </a-button>
              </router-link>
            </div>

            <div class="service-page__info-title" v-else>
              {{ $t("ssl_product.configuration status") }}:
              <a-tag :color="getTagColorSSL">
                {{ $t("ssl_product.awaiting configuration") }}
              </a-tag>
              <router-link
                :to="{
                  name: 'certificate',
                  params: { id: $route.params.id },
                }"
              >
                <a-button size="small" type="primary">
                  {{ $t("ssl_product.configure") }}
                </a-button>
              </router-link>
            </div>
          </div>
          <a-row :gutter="[10, 10]">
            <a-col
              :md="12"
              :xs="12"
              :sm="12"
              v-for="elem in info"
              :key="elem.key"
            >
              <div class="service-page__info">
                <div class="service-page__info-title">
                  {{ $t("userService." + elem.title) | capitalize }}:
                </div>

                <div
                  v-if="elem.type == 'money'"
                  class="service-page__info-value"
                >
                  {{ service[elem.key] }} {{ currency.code }}
                </div>
                <div
                  v-else-if="
                    elem.type == 'date' && service[elem.key] == '0000-00-00'
                  "
                  class="service__info-value"
                >
                  -
                </div>
                <div
                  v-else-if="elem.type == 'date'"
                  class="service-page__info-value"
                >
                  {{ service[elem.key] &&
                    new Intl.DateTimeFormat().format(new Date(service[elem.key])) }}
                </div>
                <div
                  v-else-if="elem.type == 'text'"
                  class="service-page__info-value"
                >
                  {{ service[elem.key] && $t(service[elem.key].toLowerCase()) | capitalize }}
                </div>
                <div v-else class="service-page__info-value">
                  {{ service[elem.key] }}
                </div>
              </div>
            </a-col>
          </a-row>
          <component :is="getModuleButtons" :service="service" />
        </template>

        <loading v-else />
      </div>
    </div>
  </div>
</template>

<script>
import loading from "@/components/loading/loading.vue";

const info = [
  // {
  // 	title: 'first payment',
  // 	key: 'firstpaymentamount',
  // 	type: 'money',
  // },
  {
    title: "billing cycle",
    key: "billingcycle",
    type: "text",
  },
  {
    title: "renewal amount",
    key: "recurringamount",
    type: "money",
  },
  {
    title: "registration date",
    key: "regdate",
    type: "date",
  },
  {
    title: "next payment date",
    key: "nextduedate",
    type: "date",
  },
];

export default {
  name: "user-service-view",
  components: { loading },
  data: () => ({ service: null, info }),
  created() {
    this.$store.dispatch('nocloud/vms/fetch')
      .then(() => {
        const domain = this.$store.getters['nocloud/vms/getInstances']
          .find(({ uuid }) => uuid === this.$route.params.id);
        let groupname = 'Domains';
        let date = 'year';

        if (!domain) return new Promise((resolve) => resolve({ meta: null }));
        if (domain.billingPlan.type === 'goget') {
          domain.data.expiry = {
            expiredate: '0000-00-00',
            regdate: '0000-00-00'
          };
          groupname = 'SSL';
          date = 'month';
        } else {
          const { period } = domain.resources;
          const { expiredate } = domain.data.expiry;
          const year = parseInt(expiredate) - period;

          domain.data.expiry.regdate = `${year}${expiredate.slice(4)}`;
        }

        const { period } = domain.resources;
        const { expiredate, regdate } = domain.data.expiry;

        this.service = {
          ...domain,
          groupname,
          name: domain.title,
          status: `cloudStateItem.${domain.state?.state || 'UNKNOWN'}`,
          domain: domain.resources.domain,
          billingcycle: this.$tc(date, period),
          recurringamount: '?',
          regdate, nextduedate: expiredate
        };
        info[0].type = '';

        return this.$api.servicesProviders.action({
          uuid: domain.sp,
          action: 'get_domain_price',
          params: { domain: this.service.domain },
        });
      })
      .then(({ meta }) => {
        if (meta) {
          const { period } = this.service.resources;

          this.service.recurringamount = meta.prices[period];
        } else {
          return this.$store.dispatch('nocloud/auth/fetchBillingData');
        }
      })
      .then(({ client_id }) => {
        const serviceid = this.$route.params.id;

        return this.$api.get(`${this.baseURL}/services.getInfo.php`, {
          params: { serviceid, userid: client_id }
        });
      })
      .then((res) => this.service = res)
      .catch((err) => console.error(err));

      if (this.$store.getters['nocloud/auth/currencies'].length < 1) {
        this.$store.dispatch('nocloud/auth/fetchCurrencies');
      }
  },
  computed: {
    user() {
      return this.$store.getters['nocloud/auth/billingData'];
    },
    baseURL() {
      return this.$store.getters['products/getURL'];
    },
    currency() {
      const defaultCurrency = this.$store.getters['nocloud/auth/defaultCurrency'];

      return { code: this.user.currency_code ?? defaultCurrency };
    },
    getTagColor() {
      switch (this.service.status) {
        case "Active":
          return "green";
        case "Pending":
          return "orange";
        case "Cancelled":
          return "red";
        default:
          return ""
      }
    },
    getTagColorSSL() {
      switch (this.service.SSL?.sslstatus) {
        case "Completed":
          return "green";
        case "Awaiting Configuration":
          return "red";
        default:
          return "";
      }
    },
    getInvoiceStatusColor() {
      switch (this.service.ORDER_INFO.invoicestatus) {
        case "Paid":
          return "green";
        case "Unpaid":
          return "red";
        default:
          return "";
      }
    },
    getModuleButtons() {
      if (!this.service.groupname) return;
      const { status, state } = this.service;
      const serviceType = this.$config.getServiceType(this.service.groupname)?.toLowerCase();

      if (serviceType === undefined) return;
      if (!(status === 'Active' || state?.state === 'RUNNING')) return;
      return () => import(`@/components/services/${serviceType}/draw`);
    },
  },
};
</script>

<style>
.service-page {
  padding-top: 20px;
}

@media screen and (max-width: 768px) {
  .service-page {
    padding-left: 10px;
    padding-right: 10px;
  }
}

.d-flex {
  display: flex;
}

.service-page-card {
  background: #fff;
  border-radius: 10px;
  padding: 10px 15px 15px;
}

.service-page__header {
  margin-bottom: 10px;
}

.service-page__title {
  font-size: 1.6rem;
}

.service-page__domain {
  font-size: 1rem;
}

.service-page__info:not(:last-of-type) {
  margin-bottom: 5px;
}

.service-page__info-title {
  font-weight: bold;
}

.service-page__info-value {
  font-size: 1.1rem;
}
</style>
