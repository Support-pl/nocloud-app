<template>
  <div
    class="invoice"
    @click="
      if (needVerification) {
        isVerificationOpen = true;
      } else {
        isLoading = true;
        openInvoiceDocument(invoice);
      }
    "
  >
    <div class="invoice__header">
      <div class="invoice__status" :style="{ color: statusColor }">
        {{ $t(`invoice_${invoice.status}`) }}
      </div>
    </div>
    <div class="invoice__middle">
      <div class="invoice__prefix">
        <span> {{ capitalize($t("net total")) }}: </span>
      </div>
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
    <div class="invoice__divider" />
    <div class="invoice__footer">
      <div class="invoice__tags">
        <div class="invoice__id">#{{ getInvoiceNumber(invoice) }}</div>

        <instance-tags :instances="invoice.instances" />
      </div>

      <div class="invoice__btns">
        <template v-if="invoice.status === 'Unpaid' && !needVerification">
          <a-popconfirm
            v-if="
              invoice.total <= userBalance &&
              ActionType[invoice.type] !== ActionType.BALANCE
            "
            :title="$t('Payment will be made from your account balance.')"
            :ok-text="$t('Yes')"
            :cancel-text="$t('Cancel')"
            @confirm="payByBalance"
          >
            <a-button
              :loading="isBalanceLoading"
              type="primary"
              shape="round"
              size="small"
              @click.stop
            >
              {{ $t("pay from balance") }}
            </a-button>
          </a-popconfirm>

          <a-button
            style="background-color: var(--success)"
            :loading="isLoading"
            @click.stop="paidInvoice"
            type="primary"
            shape="round"
            size="small"
          >
            {{ $t("Pay") }}
          </a-button>
        </template>

        <template v-else-if="invoice.status === 'Unpaid'">
          <a-button
            :loading="isLoading"
            type="primary"
            shape="round"
            size="small"
          >
            {{ $t("phone_verification.labels.verify") }}
          </a-button>

          <verification-modal
            show-user-profile-link
            :open="isVerificationOpen"
            @update:open="isVerificationOpen = $event"
            @confirm="onCodeConfirm"
          />
        </template>

        <component
          :is="isLoading ? loadingIcon : rightIcon"
          v-else
          class="invoice__icon"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref, toRefs } from "vue";
import { useI18n } from "vue-i18n";
import { ActionType } from "nocloud-proto/proto/es/billing/billing_pb";
import VerificationModal from "../settings/verificationModal.vue";
import { useAuthStore } from "@/stores/auth.js";
import { useInvoicesStore } from "@/stores/invoices.js";
import { useCurrency, useNotification } from "@/hooks/utils";

import config from "@/appconfig.js";
import { getInvoiceNumber } from "@/functions";
import api from "@/api";
import { storeToRefs } from "pinia";
import InstanceTags from "./instanceTags.vue";

const props = defineProps({
  invoice: { type: Object, required: true },
});
const { invoice } = toRefs(props);

const i18n = useI18n();
const authStore = useAuthStore();
const invoicesStore = useInvoicesStore();
const { openNotification } = useNotification();
const { formatPrice } = useCurrency();
const { userBalance, userdata } = storeToRefs(authStore);

const loadingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LoadingOutlined")
);
const rightIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/RightOutlined")
);

const isLoading = ref(false);
const isBalanceLoading = ref(false);
const isVerificationOpen = ref(false);

const statusColor = computed(() => {
  switch (invoice.value.status?.toLowerCase()) {
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
  const total = invoice.value.subtotal ?? invoice.value.total;

  return formatPrice(Math.abs(total));
});

const needVerification = computed(
  () =>
    !!invoice.value.properties.phoneVerificationRequired &&
    !userdata.value.isPhoneVerified
);

async function paidInvoice() {
  isLoading.value = true;
  try {
    await openInvoiceDocument(invoice.value);

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

  isLoading.value = false;

  window.open(paymentLink, "_blank");
}

async function payByBalance() {
  isBalanceLoading.value = true;
  try {
    if (invoice.value.uuid) {
      await invoicesStore.payWithBalance({ invoiceUuid: invoice.value.uuid });
    } else {
      await invoicesStore.payWithBalance({ whmcsId: invoice.value.id });
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
    isBalanceLoading.value = false;
  }
}

function onCodeConfirm() {
  authStore.fetchUserData(true);
  authStore.fetchUserData(true);
}
</script>

<script>
export default { name: "InvoiceView" };
</script>

<style lang="scss" scoped>
$border-radius: 15px;
$small-border-radius: 12px;
$spacing-xs: 2px;
$spacing-sm: 5px;
$spacing-md: 8px;

.invoice {
  position: relative;
  padding: $spacing-md 16px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: $border-radius;
  background-color: var(--bright_font);
  cursor: pointer;

  &:not(:last-child) {
    margin-bottom: 8px;
  }
}

.invoice__header {
  display: flex;
  justify-content: space-between;
  margin-bottom: $spacing-xs;
}

.invoice__status {
  font-weight: 600;
}

.invoice__middle {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-xs;

  @media (max-width: 576px) {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr; 
  }
}

.invoice__prefix {
  margin-right: $spacing-sm;
  margin-top: $spacing-sm;
  color: var(--gray);
  
  @media (max-width: 576px) {
    grid-column: span 2;
  }
}

.invoice__cost {
  font-size: 28px;
  color: var(--main);
  flex: 2 1 0;

  @media (max-width: 576px) {
    text-align: right;
    grid-column: span 2; 
  }
}

.invoice__date-item {
  flex: 1 1 0;
  
  @media (max-width: 576px) {
    grid-column: span 1; 
  }
}

.invoice__date-item.invoice__dueDate {
  text-align: right;
}

.invoice__date-title {
  font-size: 14px;
  color: var(--gray);
  margin-bottom: 2px;
}

.invoice__date {
  font-size: 14px;
}

.invoice__divider {
  width: 100%;
  height: 1px;
  background-color: var(--border_color);
  margin-bottom: $spacing-xs;
}

.invoice__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-sm;
  margin-top: 5px;
}

.invoice__btns {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
}

.invoice__id {
  font-size: 14px;
  color: var(--gray);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.invoice__btn {
  margin-left: auto;

  &:first-of-type {
    margin-left: 0;
  }
}

.invoice__icon {
  margin-top: $spacing-sm;
}

.invoice__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}
</style>
