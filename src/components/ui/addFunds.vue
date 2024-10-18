<template>
  <a-modal
    :title="$t('Add Funds')"
    :open="modalVisible"
    :confirm-loading="confirmLoading"
    :cancel-text="$t('Cancel')"
    @ok="handleOk"
    @cancel="hideModal"
  >
    <p v-if="authStore.isLogged">
      {{ $t("Enter value") }} ({{ currency.code }}):
    </p>
    <a-input
      allow-clear
      style="width: 100%"
      :value="amount"
      @change="onChange"
    />

    <a-row
      type="flex"
      justify="space-around"
      align="middle"
      :gutter="[10, 10]"
      style="margin-top: 10px; margin-bottom: 10px"
    >
      <a-col v-for="add in btns" :key="add" :xl="6" :xs="8">
        <a-button style="width: 100%" @click="addAmount(add)">
          +{{ add }}
        </a-button>
      </a-col>
    </a-row>

    <label style="margin-top: 10px">
      <a-checkbox v-model:checked="stay" />
      {{ $t("stay on page") }}
    </label>
  </a-modal>
</template>

<script setup>
import { ref } from "vue";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import { useCurrency } from "@/hooks/utils";
import api from "@/api.js";
import { invoiceReload } from "@/components/layout/appHeader/function";

const props = defineProps({
  modalVisible: { type: Boolean, required: true },
  hideModal: { type: Function, required: true },
  sum: { type: Number, default: 0 },
});

const router = useRouter();
const authStore = useAuthStore();
const { currency } = useCurrency();

const confirmLoading = ref(false);
const amount = ref(5);
const btns = ref([5, 10, 50, 100, 200]);
const stay = ref(false);

function onChange({ target }) {
  const value = target.value.replace(/\D/g, "");

  target.value = value;
  amount.value = +value;
}

async function handleOk() {
  if (amount.value < 1) return;
  confirmLoading.value = true;

  try {
    const response = await api.get(authStore.baseURL, {
      params: { run: "add_func", sum: amount.value },
    });

    props.hideModal();

    if (!stay.value) {
      localStorage.setItem("order", "Invoice");
      router.push("/billing");
    } else {
      message.success(`Now look invoice #${response.invoiceid}`);
    }
    invoiceReload();
  } catch (error) {
    console.error(error);
  } finally {
    confirmLoading.value = false;
  }
}

function addAmount(value) {
  if (amount.value === "") amount.value = 0;
  amount.value += value;
}

amount.value = props.sum ?? 5;
</script>
