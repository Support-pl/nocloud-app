<template>
  <div
    class="invoice"
    :style="{ cursor: isClickable ? 'pointer' : 'default' }"
    @click="clickOnInvoice(invoice.uuid)"
  >
    <div class="invoice__middle">
      <div class="invoice__cost" :style="{ color: costColor }">
        {{ -formatPrice(invoice.cost) }} {{ currency.title }}
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
    <div class="invoice__footer flex-between">
      <div class="invoice__id">
        <a-tag v-if="getInstance(invoice.instance)">
          {{ capitalize($t("service")) }}: {{ getInstance(invoice.instance) }}
        </a-tag>

        <a-tag v-if="invoice.product">
          {{ $t("Product") }}: {{ invoice.product }}
        </a-tag>

        <template v-if="model">
          <a-tag v-if="model.provider">
            {{ capitalize($t("provider")) }}:
            {{ $t("openai.providers." + model.provider) }}
          </a-tag>
          <a-tag v-if="invoice.meta.agent">
            {{ capitalize($t("agent")) }}:
            {{ $t("openai.agents." + invoice.meta.agent) }}
          </a-tag>
          <a-tag> {{ capitalize($t("model")) }}: {{ model.name }} </a-tag>
        </template>

        <a-tag v-else-if="invoice.resource">
          {{ $t("Resource") }}: {{ invoice.resource }}
        </a-tag>
      </div>
      <div v-if="isClickable" class="invoice__btn">
        <right-icon />
      </div>
    </div>
  </div>
</template>

<script setup>
import { capitalize, computed, defineAsyncComponent } from "vue";
import { useRouter } from "vue-router";

import { useAppStore } from "@/stores/app.js";
import { useInstancesStore } from "@/stores/instances.js";
import { useCurrency } from "@/hooks/utils";
import config from "@/appconfig.js";
import { useChatsStore } from "@/stores/chats";
import { storeToRefs } from "pinia";

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
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);

const currency = computed(() =>
  props.invoice.currency
    ? { title: props.invoice.currency?.title, rate: 1 }
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

const model = computed(() => {
  if (!props.invoice?.meta?.model) return null;

  return (
    globalModelsList.value.find(
      (model) => model.key === props.invoice.meta.model
    ) || { name: props.invoice.meta.model }
  );
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
  if (!uuid) return null;

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

.invoice__footer {
  margin-top: 5px;
  display: flex;
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
