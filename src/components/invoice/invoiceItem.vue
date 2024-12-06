<template>
  <div
    class="invoice"
    @click="
      isLoading = true;
      openInvoiceDocument(invoice);
    "
  >
    <div class="invoice__header flex-between">
      <div class="invoice__status" :style="{ color: statusColor }">
        {{ $t(`invoice_${invoice.status}`) }}
      </div>
    </div>
    <div class="invoice__middle">
      <div class="invoice__prefix">{{ capitalize($t("net total")) }}:</div>
      <div class="invoice__cost" :style="{ color: statusColor }">
        {{ total }} {{ invoice.currencycode.title || invoice.currencycode }}
      </div>
      <div class="invoice__date-item invoice__invDate">
        <div class="invoice__date-title">
          {{ $t("invoiceDate") }}
        </div>
        <div class="invoice__date">
          {{ invoice.created }}
        </div>
      </div>
      <div class="invoice__date-item invoice__deadlineDate">
        <div class="invoice__date-title">
          {{ $t("deadlineDate") }}
        </div>
        <div class="invoice__date">
          {{ invoice.deadline ? invoice.deadline : "-" }}
        </div>
      </div>
      <div class="invoice__date-item invoice__dueDate">
        <div class="invoice__date-title">
          {{ $t("dueDate") }}
        </div>
        <div class="invoice__date">
          {{ invoice.payment ? invoice.payment : "-" }}
        </div>
      </div>
    </div>
    <div class="horisontal-line" />
    <div class="invoice__footer flex-between">
      <div class="invoice__id">#{{ getInvoiceNumber(invoice) }}</div>

      <template v-if="invoice.status === 'Unpaid'">
        <template
          v-if="
            invoice.total <= authStore.userdata.balance &&
            ActionType[invoice.type] !== ActionType.BALANCE
          "
        >
          <a-popconfirm
            :title="$t('Payment will be made from your account balance.')"
            :ok-text="$t('Yes')"
            :cancel-text="$t('Cancel')"
            @confirm="payByBalance"
          >
            <div class="invoice__btn" style="margin-left: auto" @click.stop>
              <span class="invoice__pay invoice__balance-pay">
                {{ $t("pay from balance") }}
                <component
                  :is="isBalanceLoading ? loadingIcon : rightIcon"
                  color="success"
                />
              </span>
            </div>
          </a-popconfirm>
        </template>

        <div class="invoice__btn" @click.stop="paidInvoice">
          <span class="invoice__pay">
            {{ $t("Pay").toLowerCase() }}
            <component
              :is="isLoading ? loadingIcon : rightIcon"
              color="success"
            />
          </span>
        </div>
      </template>

      <component
        :is="isLoading ? loadingIcon : rightIcon"
        v-else
        style="margin-top: 5px"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ActionType } from "nocloud-proto/proto/es/billing/billing_pb";

import { useAuthStore } from "@/stores/auth.js";
import { useInvoicesStore } from "@/stores/invoices.js";
import { useCurrency, useNotification } from "@/hooks/utils";

import config from "@/appconfig.js";
import { getInvoiceNumber } from "@/functions";
import api from "@/api";

const props = defineProps({
  invoice: { type: Object, required: true },
});

const i18n = useI18n();
const authStore = useAuthStore();
const invoicesStore = useInvoicesStore();
const { openNotification } = useNotification();
const { formatPrice } = useCurrency();

const loadingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LoadingOutlined")
);
const rightIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/RightOutlined")
);

const isLoading = ref(false);
const isBalanceLoading = ref(false);

const statusColor = computed(() => {
  switch (props.invoice.status?.toLowerCase()) {
    case "paid":
      return config.colors.success;
    case "canceled":
    case "terminated":
      return config.colors.gray;
    case "returned":
      return config.colors.warn;
    default:
      return config.colors.err;
  }
});

const total = computed(() => {
  const total = props.invoice.subtotal ?? props.invoice.total;

  return formatPrice(Math.abs(total));
});

async function paidInvoice() {
  isLoading.value = true;
  try {
    await openInvoiceDocument(props.invoice);

    openNotification("success", { message: i18n.t("Done") });
  } catch (error) {
    openNotification("error", {
      message: error.response?.data?.message ?? error.message ?? error,
    });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function openInvoiceDocument(invoice) {
  let paymentLink;

  if (!invoice.uuid) {
    //whmcs
    const response = await api.get(authStore.baseURL, {
      params: {
        run: "download_invoice",
        account: authStore.billingUser.userid,
        invoiceid: getInvoiceNumber(invoice),
      },
    });
    paymentLink = response[0];
  } else {
    paymentLink = await invoicesStore.getPaymentLink(invoice.uuid);
  }

  window.location.href = paymentLink;
}

async function payByBalance() {
  isLoading.value = true;
  try {
    if (props.invoice.uuid) {
      await invoicesStore.payWithBalance({ invoiceUuid: props.invoice.uuid });
    } else {
      await invoicesStore.payWithBalance({ whmcsId: props.invoice.id });
    }

    invoicesStore.fetch();
    authStore.fetchUserData(true);

    openNotification("success", { message: i18n.t("Done") });
  } catch (error) {
    openNotification("error", {
      message: error.response?.data?.message ?? error.message ?? error,
    });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<script>
export default { name: "InvoiceView" };
</script>

<style scoped>
.invoice {
  position: relative;
  padding: 8px 15px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: var(--bright_font);
  cursor: pointer;
}

.invoice__id,
.invoice__service {
  font-size: 12px;
  color: var(--gray);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.invoice__pay {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  padding: 4px 8px;
  line-height: 1;
  border-radius: 12px;
  color: var(--gloomy_font);
  background: var(--success);
  white-space: nowrap;
}

.invoice__balance-pay {
  background: var(--main);
}

.invoice__status {
  font-weight: 600;
}

.invoice:not(:last-child) {
  margin-bottom: 20px;
}

.invoice__dueDate {
  text-align: right;
}

.invoice__cost {
  font-size: 28px;
  color: var(--main);
}

.horisontal-line {
  width: 100%;
  height: 1px;
  background-color: var(--border_color);
}

.flex-between {
  display: flex;
  justify-content: space-between;
}
.invoice__middle {
  display: flex;
  align-items: center;
}
.invoice__prefix {
  margin-right: 5px;
  color: var(--gray);
}
.invoice__cost {
  flex: 2 1 0;
}
.invoice__invDate {
  flex: 1 1 0;
}
.invoice__dueDate {
  flex: 1 1 0;
}
.invoice__deadlineDate {
  flex: 1 1 0;
}

.invoice__header,
.invoice__middle,
.horisontal-line {
  margin-bottom: 2px;
}

.invoice__footer {
  align-items: center;
  gap: 5px;
}

@media (max-width: 576px) {
  .invoice__middle {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .invoice__cost {
    text-align: right;
  }
}
</style>
