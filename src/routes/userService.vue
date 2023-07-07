<template>
  <div class="service-page">
    <div class="container">
      <div class="service-page-card">
        <template v-if="service">
          <div class="service-page__header">
            <div class="service-page__title">{{ service.name }}</div>
            <!-- <div v-if="service.domain" class="service-page__domain">
              <a :href="service.domain">{{ service.domain }}</a>
            </div> -->
          </div>

          <div class="service-page__info" v-if="service.domain">
            <div class="service-page__info-title">
              {{ $t('key') | capitalize }}:
              <span style="font-weight: 400">{{ service.domain }}</span>
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

          <div class="service-page__info" v-if="isActionsActive">
            <div class="service-page__info-title">
              {{ $t('Actions') }}:
              <div style="display: inline-flex; gap: 8px">
                <a-button size="small" @click="sendRenew">
                  {{ $t('renew') | capitalize }}
                </a-button>
                <a-button size="small" type="danger" @click="sendDelete">
                  {{ $t('Delete') }}
                </a-button>
              </div>
            </div>
          </div>

          <div class="service-page__info" v-if="service.ORDER_INFO">
            <div class="service-page__info-title">
              {{ $t("invoice status") | capitalize }}:
              <a-tag :color="getInvoiceStatusColor">
                {{ $t("invoice_" + service.ORDER_INFO.invoicestatus) }}
              </a-tag>
              <a-button
                size="small"
                type="primary"
                @click="clickOnInvoice(service.ORDER_INFO.invoiceid)"
              >
                {{ $t("open") }}
              </a-button>
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

          <div class="service-page__info" v-if="description">
            <div class="service-page__info-title">
              {{ $t("description") | capitalize }}:
            </div>
            <div class="service-page__info-value">
              <div :style="(service.desc_product) ? 'padding: 0 15px' : ''" v-html="description"></div>
            </div>
          </div>

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
  methods: {
    clickOnInvoice(invoice_id) {
      const url = this.$store.getters['nocloud/auth/getURL'];

      this.$api.get(url, { params: {
        run: 'get_pay_token', invoice_id
      }})
        .then((res) => {
          window.location.href = res;
        });
    },
    sendRenew() {
			this.$confirm({
        title: this.$t('Do you want to renew service?'),
        okText: this.$t('Yes'),
        cancelText: this.$t('Cancel'),
        okButtonProps: {
          props: { disabled: (this.service.data.blocked) },
        },
        onOk: async () => {
          const data = { uuid: this.service.uuid, action: 'manual_renew' };

          return this.$store.dispatch('nocloud/vms/actionVMInvoke', data)
            .then(() => {
              this.$notification.success({ message: `Done!` });
              this.$set(this.service.data, 'blocked', true);
            })
            .catch((err) => {
              this.$notification.error({
                message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`,
              });
              console.error(err);
            });
        },
        onCancel() {},
      });
		},
    sendDelete() {
      this.$confirm({
        title: this.$t('Do you want to delete this service?'),
        okType: 'danger',
        okText: this.$t('Yes'),
        cancelText: this.$t('Cancel'),
        content: () => (
          <div style="color:red">{ this.$t('All data will be deleted!') }</div>
        ),
        onOk: async () => {
          return this.$store
            .dispatch("nocloud/vms/deleteInstance", this.service.uuid)
            .then(() => {
              this.$notification.success({ message: `Done!` });
              this.$router.push({ path: '/cloud' });
            })
            .catch((err) => {
              this.$notification.error({
                message: `Error: ${err?.response?.data?.message ?? 'Unknown'}.`,
              });
              console.error(err);
            });
        },
        onCancel() {},
      });
    },
    date(timestamp) {
      if (timestamp < 1) return '0000-00-00';

      const date = new Date(timestamp * 1000);

      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      return `${year}-${month}-${day}`;
    }
  },
  created() {
    this.$store.dispatch('nocloud/auth/fetchBillingData');
    this.$store.dispatch('nocloud/vms/fetch')
      .then(() => {
        const domain = this.$store.getters['nocloud/vms/getInstances']
          .find(({ uuid }) => uuid === this.$route.params.id);
        let groupname = 'Domains';
        let date = 'year';

        if (!domain) return new Promise((resolve) => resolve({ meta: null }));
        switch (domain.billingPlan.type) {
          case 'virtual': {
            domain.data.expiry = {
              expiredate: this.date(domain.data.last_monitoring ?? 0),
              regdate: domain.data.creation ?? '0000-00-00'
            };
            groupname = 'Custom';
            date = 'month';
            break;
          }
          case 'goget': {
            domain.data.expiry = {
              expiredate: '0000-00-00',
              regdate: domain.data.creation ?? '0000-00-00'
            };
            groupname = 'SSL';
            date = 'month';
            break;
          }

          case 'opensrs': {
            const { period } = domain.resources;
            const { expiredate } = domain.data.expiry;
            const year = parseInt(expiredate) - period;

            domain.data.expiry.regdate = `${year}${expiredate.slice(4)}`;
            break;
          }

          default: {
            const key = Object.keys(domain.config.items)[0];
            const { period } = domain.billingPlan.products[key];

            domain.resources = {
              period: this.date(period),
              recurringamount: domain.config.items.reduce((sum, key) =>
                sum + domain.billingPlan.products[key].price, 0
              )
            };
            domain.data.expiry = {
              expiredate: domain.data.expires_at.split('T')[0],
              regdate: domain.data.creation ?? '0000-00-00'
            };
          }
        }

        const { period } = domain.resources;
        const { expiredate, regdate } = domain.data.expiry;

        this.service = {
          ...domain,
          groupname,
          regdate,
          name: domain.title,
          status: `cloudStateItem.${domain.state?.state || 'UNKNOWN'}`,
          domain: domain.resources.domain,
          billingcycle: this.$tc(date, period),
          recurringamount: domain.billingPlan.products[domain.product]?.price ?? '?',
          nextduedate: expiredate
        };
        info[0].type = '';

        if (this.service.recurringamount === '?') {
          return this.$api.servicesProviders.action({
            uuid: domain.sp,
            action: 'get_domain_price',
            params: { domain: this.service.domain },
          });
        }
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
        if (this.products.length < 1) {
          return this.$store.dispatch('products/fetch', client_id);
        }

        this.service = this.products.find(({ id }) => id == this.$route.params.id);
      })
      .then(() => {
        this.service = this.products.find(({ id }) => id == this.$route.params.id);
      })
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
    products() {
      return this.$store.getters['products/getProducts'];
    },
    getTagColor() {
      switch (this.service.status.replace('cloudStateItem.', '')) {
        case "RUNNING":
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
    isActionsActive() {
      const key = this.service.product ?? this.service.config?.product;
      const { meta } = this.service.billingPlan?.products[key] ?? {};

      return !this.service.clientid && meta?.renew !== false;
    },
    description() {
      const key = this.service.product ?? this.service.config?.product;
      const { meta } = this.service.billingPlan?.products[key] ?? {};
      const description = this.service.desc_product
        ?.replace('/templates', `${this.$config.WHMCSsiteurl}$&`);

      return meta?.description ?? description;
    }
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

.service-page__info-value div > .img_prod {
  display: block;
  max-width: 200px;
  margin: 0 auto 10px;
}
</style>
