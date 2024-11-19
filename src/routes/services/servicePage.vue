<template>
  <div class="service-page">
    <div class="container">
      <div class="service-page-card">
        <template v-if="service">
          <div class="service-page__header">
            <div class="service-page__title">
              {{ service.name }}
            </div>
            <!-- <div v-if="service.domain" class="service-page__domain">
              <a :href="service.domain">{{ service.domain }}</a>
            </div> -->
          </div>

          <div v-if="service.domain" class="service-page__info">
            <div class="service-page__info-title">
              {{
                /^[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i.test(service.domain)
                  ? $t("ssl_product.domain")
                  : capitalize($t("key"))
              }}:
              <span style="font-weight: 400">{{ service.domain }}</span>
            </div>
          </div>

          <div
            class="service-page__info"
            :style="
              service.groupname === 'OpenAI'
                ? { display: 'inline-block', width: '50%' }
                : null
            "
          >
            <div class="service-page__info-title">
              {{ capitalize($t("status")) }}:
              <a-tag :color="getTagColor">
                {{ $t(service.status) }}
              </a-tag>
            </div>
          </div>

          <div
            v-if="isActionsActive"
            class="service-page__info"
            :style="
              service.groupname === 'OpenAI'
                ? { display: 'inline-block', width: '50%' }
                : null
            "
          >
            <div class="service-page__info-title">
              {{ $t("Actions") }}:
              <div style="display: inline-flex; gap: 8px">
                <a-button
                  v-if="service.nextduedate !== '0000-00-00'"
                  size="small"
                  @click="sendRenew"
                >
                  {{ capitalize($t("renew")) }}
                </a-button>
                <a-button danger size="small" @click="sendDelete">
                  {{ $t("Delete") }}
                </a-button>
              </div>
            </div>
          </div>

          <div v-if="service.ORDER_INFO" class="service-page__info">
            <div class="service-page__info-title">
              {{ capitalize($t("invoice status")) }}:
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
          <div v-if="service.groupname === 'SSL'" class="service-page__info">
            <div
              v-if="true || service.SSL.sslstatus === 'Completed'"
              class="service-page__info-title"
            >
              {{ $t("ssl_product.configuration status") }}:
              <a-tag :color="getTagColorSSL">
                {{ $t("ssl_product.completed") }}
              </a-tag>

              <router-link
                :to="{ name: 'ssl', params: { id: $route.params.id } }"
              >
                <a-button size="small" type="primary">
                  {{ $t("open") }}
                </a-button>
              </router-link>
            </div>

            <div v-else class="service-page__info-title">
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

          <service-info
            v-if="service.groupname !== 'OpenAI'"
            :service="service"
            :info="info"
          />
          <a-collapse v-else class="service-page__collapse" :bordered="false">
            <template #expandIcon="{ isActive }">
              <caret-right-icon :rotate="isActive ? 90 : 0" />
            </template>

            <a-collapse-panel :header="capitalize($t('info'))">
              <service-info :service="service" :info="info" />
            </a-collapse-panel>
          </a-collapse>

          <div
            v-if="description"
            class="service-page__info"
            style="margin-top: 10px"
          >
            <div class="service-page__info-title">
              {{ capitalize($t("description")) }}:
            </div>
            <div class="service-page__info-value">
              <div
                v-if="typeof description === 'string'"
                style="margin-top: 15px"
                :style="service.desc_product ? 'padding: 0 15px' : ''"
                v-html="description"
              />
              <table v-else class="product__specs">
                <tr
                  v-for="resource of description.properties"
                  :key="resource.GROUP"
                >
                  <td>
                    {{ capitalize($t(`virtual_product.${resource.GROUP}`)) }}
                  </td>
                  <td>{{ resource.TITLE }}</td>
                </tr>
              </table>
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
import { defineAsyncComponent, h } from "vue";
import { mapStores, mapState } from "pinia";
import { usePeriod } from "@/hooks/utils";
import config from "@/appconfig.js";

import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useProductsStore } from "@/stores/products.js";
import { useNamespasesStore } from "@/stores/namespaces.js";
import { useInstancesStore } from "@/stores/instances.js";

import loading from "@/components/ui/loading.vue";
import serviceInfo from "@/components/ui/serviceInfo.vue";
import { useInvoicesStore } from "@/stores/invoices";

const info = [
  // {
  //  title: 'first payment',
  //  key: 'firstpaymentamount',
  //  type: 'money',
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
  {
    title: "auto renew",
    key: "autorenew",
    type: "text",
  },
];

const caretRightIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CaretRightOutlined")
);

export default {
  name: "UserServiceView",
  components: { loading, serviceInfo, caretRightIcon },
  setup() {
    const { getPeriod } = usePeriod();

    return { getPeriod };
  },
  data: () => ({ service: null, info }),
  computed: {
    ...mapStores(
      useChatsStore,
      useProductsStore,
      useInstancesStore,
      useNamespasesStore,
      useInvoicesStore
    ),
    ...mapState(useAuthStore, ["baseURL", "userdata", "fetchBillingData"]),
    getTagColor() {
      const status = this.service.status.replace("cloudStateItem.", "");

      switch (status.toLowerCase()) {
        case "running":
        case "active":
          return "green";
        case "operation":
        case "pending":
          return "blue";
        case "stopped":
        case "suspended":
          return "orange";
        case "cancelled":
        default:
          return "red";
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
      const serviceType = config
        .getServiceType(this.service.groupname)
        ?.toLowerCase();

      const components = import.meta.glob("@/components/services/*/draw.vue");
      const component = Object.keys(components).find((key) =>
        key.includes(`/${serviceType}/draw.vue`)
      );

      if (!components[component]) return;
      if (serviceType === undefined) return;
      if (!(status === "Active" || state?.state === "RUNNING")) return;
      return defineAsyncComponent(() => components[component]());
    },
    isActionsActive() {
      const key = this.service.product ?? this.service.config?.product;
      const { meta } = this.service.billingPlan?.products[key] ?? {};

      return !this.service.clientid && meta?.renew !== false;
    },
    description() {
      const key = this.service.product ?? this.service.config?.product;
      const { meta } = this.service.billingPlan?.products[key] ?? {};
      let description = this.service.desc_product?.replace(
        "/templates",
        `${config.whmcsSiteUrl}$&`
      );

      try {
        description = JSON.parse(description);
      } catch {}

      return meta?.description ?? description;
    },
  },
  created() {
    this.fetchBillingData();
    this.instancesStore
      .fetch()
      .then(() => {
        const domain = this.instancesStore.getInstances.find(
          ({ uuid }) => uuid === this.$route.params.id
        );
        let groupname = "Domains";
        let date = "year";

        if (!domain) return { meta: "product" };
        switch (domain.billingPlan.type) {
          case "cpanel": {
            const { period } = domain.billingPlan.products[domain.product];

            domain.data.expiry = {
              expiredate: this.date(domain.data.next_payment_date ?? 0),
              regdate: domain.data.creation * 1000 || "0000-00-00",
            };
            domain.resources.period = this.getPeriod(period);
            groupname = "Shared Hosting";
            break;
          }
          case "openai": {
            const products = Object.values(domain.billingPlan.resources).reduce(
              (result, resource) => ({
                ...result,
                [resource.key]: resource.price,
              }),
              {}
            );

            domain.resources = {
              period: this.$t("PayG"),
              recurringamount: 0,
              inputKilotoken: products.input_kilotoken,
              outputKilotoken: products.output_kilotoken,
            };

            domain.data.expiry = {
              expiredate: this.date(domain.data.next_payment_date ?? 0),
              regdate: domain.data.creation * 1000 || "0000-00-00",
            };
            groupname = "OpenAI";

            this.chatsStore.startStream();
            break;
          }

          case "virtual":
          case "empty": {
            const { period } = domain.billingPlan.products[domain.product];

            domain.data.expiry = {
              expiredate: this.date(domain.data.next_payment_date ?? 0),
              regdate: domain.data.creation * 1000 || "0000-00-00",
            };
            domain.resources.period = this.getPeriod(period);
            groupname = "Custom";
            break;
          }

          case "goget": {
            domain.data.expiry = {
              expiredate: this.date(domain.data.next_payment_date ?? 0),
              regdate: domain.data.creation * 1000 || "0000-00-00",
            };
            groupname = "SSL";
            date = "month";
            break;
          }

          case "opensrs": {
            domain.data.expiry = {
              expiredate: this.date(domain.data.next_payment_date ?? 0),
              regdate: domain.data.creation * 1000 || "0000-00-00",
            };
            groupname = "Domains";
            break;
          }

          default: {
            const key = Object.keys(domain.config.items)[0];
            const { period } = domain.billingPlan.products[key];

            domain.resources = {
              period: this.getPeriod(period),
              recurringamount: domain.config.items.reduce(
                (sum, key) => sum + domain.billingPlan.products[key].price,
                0
              ),
            };
            domain.data.expiry = {
              expiredate: domain.data.expires_at.split("T")[0],
              regdate: domain.data.creation * 1000 || "0000-00-00",
            };
          }
        }

        const { period, recurringamount } = domain.resources;
        const { expiredate, regdate } = domain.data.expiry;

        this.service = {
          ...domain,
          groupname,
          regdate,
          name: domain.title,
          status: `cloudStateItem.${domain.state?.state || "UNKNOWN"}`,
          domain: domain.resources.domain ?? domain.config.domain,
          autorenew: domain.config.auto_renew ? "enabled" : "disabled",
          billingcycle:
            typeof period === "string" ? period : this.$tc(date, period),
          recurringamount:
            recurringamount ??
            domain.billingPlan.products[domain.product]?.price ??
            "?",
          nextduedate: expiredate,
        };
        info[0].type = "";

        if (groupname === "Domains") {
          return this.$api.servicesProviders.action({
            uuid: domain.sp,
            action: "get_domain_price",
            params: { domain: this.service.domain },
          });
        } else {
          return { meta: "done" };
        }
      })
      .then(({ meta }) => {
        if (meta?.prices) {
          const { period } = this.service.resources;

          this.service.recurringamount = meta.prices[period];
          return { client_id: null };
        } else if (meta !== "done") {
          return this.fetchBillingData();
        } else {
          return { client_id: null };
        }
      })
      .then(({ client_id: id }) => {
        if (!id) return "done";
        if (this.productsStore.products.length < 1) {
          return this.productsStore.fetch(id);
        }
      })
      .then((result) => {
        if (result === "done") return;
        const product = this.productsStore.products.find(
          ({ id }) => `${id}` === `${this.$route.params.id}`
        );

        if (product) {
          this.service = product;
          this.info.pop();
        }
      })
      .catch((error) => {
        console.error(error);
      });
  },
  methods: {
    async clickOnInvoice(uuid) {
      const paymentLink = await this.invoicesStore.getPaymentLink(uuid);

      window.location.href = paymentLink;
    },
    sendRenew() {
      this.$confirm({
        title: this.$t("Do you want to renew service?"),
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        okButtonProps: { disabled: this.service.data.blocked },
        onOk: async () => {
          return this.invoicesStore
            .createRenewInvoice(this.service)
            .then(() => {
              this.$notification.success({ message: "Done!" });
              this.service.data.blocked = true;
            })
            .catch((err) => {
              this.$notification.error({
                message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
              });
              console.error(err);
            })
            .finally(this.$destroyAll);
        },
        onCancel() {},
      });
    },
    sendDelete() {
      this.$confirm({
        title: this.$t("Do you want to delete this service?"),
        okType: "danger",
        okText: this.$t("Yes"),
        cancelText: this.$t("Cancel"),
        content: () =>
          h(
            "div",
            { style: "color: red" },
            this.$t("All data will be deleted!")
          ),
        onOk: async () => {
          return this.instancesStore
            .deleteInstance(this.service.uuid)
            .then(() => {
              this.$notification.success({ message: "Done!" });
              this.$router.push({ path: "/services" });
            })
            .catch((err) => {
              this.$notification.error({
                message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
              });
              console.error(err);
            });
        },
        onCancel() {},
      });
    },
    date(timestamp) {
      if (timestamp < 1) return "0000-00-00";

      const date = new Date(timestamp * 1000);

      const year = date.getFullYear();
      let month = date.getMonth() + 1;
      let day = date.getDate();

      if (`${month}`.length < 2) month = `0${month}`;
      if (`${day}`.length < 2) day = `0${day}`;

      return `${year}-${month}-${day}`;
    },
  },
};
</script>

<style scoped>
.service-page {
  padding-top: 20px;
}

.service-page-card {
  background: var(--bright_font);
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

.service-page__collapse,
.service-page__collapse :deep(.ant-collapse-content) {
  color: inherit;
}

.service-page__collapse :deep(.ant-collapse-header) {
  font-weight: 700;
  color: inherit;
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
  color: rgba(0, 0, 0, 0.7);
}

.product__specs tr {
  border-bottom: var(--border-line-weight) var(--border-line-type)
    var(--border-color);
}

.product__specs td:last-child::before {
  content: "";
  width: 2px;
  height: 50%;
  background: #f5f5f5;
  display: block;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

@media screen and (max-width: 768px) {
  .service-page {
    padding-left: 10px;
    padding-right: 10px;
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
