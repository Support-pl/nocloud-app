<template>
  <div
    class="invoice"
    :style="{ cursor: isClickable ? 'pointer' : 'default' }"
    @click="clickOnInvoice(invoice.uuid)"
  >
    <div class="invoice__middle">
      <div class="invoice__cost" :style="{ color: costColor }">
        {{ -formatPrice(invoice.cost) }} {{ currency.code }}
      </div>
      <div class="invoice__date-item invoice__invDate">
        <div class="invoice__date-title">
          {{ $t("transactionDate") }}
        </div>
        <div class="invoice__date">
          {{ toDate(invoice.start) }}
        </div>
      </div>
      <div class="invoice__date-item invoice__dueDate">
        <div class="invoice__date-title">
          {{ $t("transactionPaymentDate") }}
        </div>
        <div class="invoice__date">
          {{ invoice.payment ? toDate(invoice.payment) : "-" }}
        </div>
      </div>
    </div>
    <div class="horisontal-line" />
    <div class="invoice__footer flex-between">
      <div class="invoice__id">
        Instance: {{ getInstance(invoice.instance) }}
        <template v-if="invoice.product || invoice.resource"> - </template>

        <template v-if="invoice.product">
          {{ $t("Product") }}: {{ invoice.product }}
        </template>
        <template v-if="invoice.resource">
          {{ $t("Resource") }}: {{ invoice.resource }}
        </template>
      </div>
      <div v-if="isClickable" class="invoice__btn">
        <right-icon />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from "vue";
import { useRouter } from "vue-router";

import { useAppStore } from "@/stores/app.js";
import { useInstancesStore } from "@/stores/instances.js";
import { useCurrency } from "@/hooks/utils";
import config from "@/appconfig.js";

const rightIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/RightOutlined")
);

const props = defineProps({
  invoice: { type: Object, required: true },
});

const router = useRouter();
const { currency: baseCurrency, formatPrice } = useCurrency();
const { toDate } = useAppStore();
const instancesStore = useInstancesStore();

const currency = computed(() =>
  props.invoice.currency
    ? { code: props.invoice.currency?.title, rate: 1 }
    : baseCurrency.value
);

const costColor = computed(() => {
  if (!props.invoice.payment) {
    return config.colors.gray;
  }

  if (props.invoice?.cost < 0) {
    return config.colors.success;
  } else if (props.invoice?.cost > 0) {
    return config.colors.err;
  } else {
    return null;
  }
});

const isClickable = computed(() => {
  const isRecordsExist = props.invoice.records?.length > 0;
  const isMessageExist = props.invoice.meta.description;
  const isInstancesExist = props.invoice.meta.instances?.length > 0;

  return isRecordsExist || isMessageExist || isInstancesExist;
});

function clickOnInvoice(uuid) {
  console.log(props.invoice);
  if (!isClickable.value) return;

  router.push({ name: "transaction", params: { uuid } });
}

function getInstance(uuid) {
  if (!uuid) return "none";
  return (
    instancesStore.allInstances.find((inst) => inst.uuid === uuid)?.title ??
    uuid
  );
}
</script>

<script>
export default { name: "SingleInvoice" };
</script>

<style>
.invoice {
  position: relative;
  padding: 8px 15px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: var(--bright_font);
  cursor: pointer;
}

.invoice__id {
  font-size: 12px;
  color: var(--gray);
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
  background-color: rgba(0, 0, 0, 0.2);
}

.flex-between {
  display: flex;
  justify-content: space-between;
}
.invoice__middle {
  display: flex;
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

.invoice__middle,
.horisontal-line {
  margin-bottom: 2px;
}

@media (max-width: 400px) {
  .invoice__cost {
    flex: 1.5 1 0;
  }
}
</style>
