<template>
  <a-modal
    :open="visible"
    :width="416"
    :closable="false"
    :ok-text="$t('Yes')"
    :cancel-text="$t('Cancel')"
    :confirm-loading="isRenewLoading"
    :body-style="{ marginLeft: '34px' }"
    :ok-button-props="{ disabled: isDisabled }"
    @update:open="emits('update:visible', $event)"
    @ok="sendRenew"
  >
    <template #title>
      <span style="display: flex">
        <question-icon
          style="margin-right: 12px; font-size: 22px; color: #faad14"
        />
        {{ $t("Do you want to renew server?") }}
      </span>
    </template>
    <div style="font-weight: 700">
      {{ service.title }}
    </div>
    <div>
      {{ $t("from") }}
      <span style="font-style: italic">{{ currentPeriod }}</span>
    </div>
    <div>
      {{ $t("to") }}
      <span style="font-style: italic">{{ newPeriod }}</span>
    </div>

    <div style="margin-top: 10px">
      <span style="line-height: 1.7">{{ $t("Automatic renewal") }}: </span>
      <a-switch
        v-model:checked="autoRenew"
        size="small"
        :loading="isLoading"
        :disabled="true"
      />

      <a-button
        v-if="currentAutoRenew !== autoRenew"
        size="small"
        type="primary"
        style="margin-left: 5px"
        :loading="isLoading"
        @click="onClick"
      >
        OK
      </a-button>
    </div>

    <div style="margin-top: 10px">
      <div>{{ $t("Manual renewal") }}:</div>
      <span style="font-weight: 700">{{ $t("Tariff price") }}: </span>
      {{ formatPrice(price) }} {{ currency.title }}

      <div v-if="addonsPrice">
        <span style="font-weight: 700">{{ $t("Addons prices") }}:</span>
        <ul style="list-style: '-  '; padding-left: 25px; margin-bottom: 5px">
          <li v-for="(value, key) in addonsPrice" :key="key">
            {{ capitalize(key) }}: {{ formatPrice(value) }} {{ currency.title }}
          </li>
        </ul>
      </div>

      <div>
        <span style="font-weight: 700">{{ $t("Total") }}: </span>
        {{
          formatPrice(
            price +
              Object.values(addonsPrice).reduce((sum, cur) => sum + +cur, 0)
          )
        }}
        {{ currency.title }}
      </div>
    </div>
  </a-modal>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from "vue";
import { Modal } from "ant-design-vue";
import { useI18n } from "vue-i18n";
import { useCurrency, useNotification } from "@/hooks/utils";

import { useInstancesStore } from "@/stores/instances.js";
import { useInvoicesStore } from "@/stores/invoices";

const questionIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/QuestionCircleOutlined")
);

const props = defineProps({
  visible: { type: Boolean, required: true },
  service: { type: Object, required: true },
  currentPeriod: { type: String, default: "00.00.0000" },
  newPeriod: { type: String, default: "00.00.0000" },
  price: { type: Number, default: 0 },
  addonsPrice: { type: Object, default: () => ({}) },
  currentAutoRenew: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
});
const emits = defineEmits(["update:visible"]);

const i18n = useI18n();
const { currency, formatPrice } = useCurrency();
const { openNotification } = useNotification();

const instancesStore = useInstancesStore();
const invoicesStore = useInvoicesStore();

const isLoading = ref(false);
const isDisabled = ref(false);
const autoRenew = ref(false);
const isRenewLoading = ref(false);

async function onClick() {
  const service = instancesStore.services.find(
    ({ uuid }) => uuid === props.service.uuidService
  );
  const instance = service.instancesGroups
    .find(({ sp }) => sp === props.service.sp)
    .instances.find(({ uuid }) => uuid === props.service.uuid);

  try {
    isLoading.value = true;
    instance.config.auto_renew = autoRenew.value;
    await instancesStore.updateService(service);

    Modal.destroyAll();
    openNotification("success", { message: i18n.t("Done") });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function sendRenew() {
  isRenewLoading.value = true;
  try {
    await invoicesStore.createRenewInvoice(props.service);

    isDisabled.value = true;
    openNotification("success", { message: i18n.t("Done") });
  } catch (error) {
    openNotification("error", {
      message: `Error: ${error?.response?.data?.message ?? "Unknown"}.`,
    });
    console.error(error);
  } finally {
    isRenewLoading.value = false;
    emits("update:visible", false);
  }
}

onMounted(() => {
  autoRenew.value = props.currentAutoRenew;
  isDisabled.value = props.blocked;
});
</script>
