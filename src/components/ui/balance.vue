<template>
  <div v-if="authStore.isLogged" class="balance">
    <a-spin v-if="isLoading" :spinning="isLoading">
      <template #indicator>
        <LoadingOutlined style="color: var(--gloomy_font)" />
      </template>
    </a-spin>
    <div v-else class="balance__item" :class="{ clickable }" @click="showModal">
      {{ formatedBalance }}

      <span class="currency__suffix">{{ currency.title }}</span>
      <span v-if="clickable" class="badge">
        <plus-icon />
      </span>
    </div>
    <add-funds :modal-visible="modalVisible" :hide-modal="hideModal" />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, ref } from "vue";
import { LoadingOutlined } from "@ant-design/icons-vue";
import { useAuthStore } from "@/stores/auth.js";
import { useCurrency } from "@/hooks/utils";
import addFunds from "@/components/ui/addFunds.vue";

const props = defineProps({
  clickable: { type: Boolean, default: true },
});

const authStore = useAuthStore();
const { currency, formatPrice } = useCurrency();

const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusOutlined")
);

const isLoading = ref(false);
const modalVisible = ref(false);

const formatedBalance = computed(() => {
  const balance = (authStore.userdata.balance || 0).toFixed(2);
  if (Math.abs(balance) == 0) {
    return 0;
  }
  return formatPrice(authStore.userdata.balance);
});

// function URLparameter (obj, outer = '') {
//   let str = ''
//   for (const key in obj) {
//     if (key === 'price') continue
//     if (str !== '') {
//       str += '&'
//     }
//     if (typeof obj[key] === 'object') {
//       str += URLparameter(obj[key], outer + key)
//     } else {
//       str += outer + key + '=' + encodeURIComponent(obj[key])
//     }
//   }
//   return str
// }

function showModal() {
  if (props.clickable) modalVisible.value = true;
}

function hideModal() {
  modalVisible.value = false;
}

async function fetch() {
  try {
    isLoading.value = true;
    await authStore.fetchBillingData();
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

fetch();
</script>

<script>
export default { name: "BalanceView" };
</script>

<style>
.balance__item.clickable {
  cursor: pointer;
}
.currency__suffix {
  font-size: 14px;
}
.badge {
  position: absolute;
  font-size: 12px;
  right: 3px;
  top: 7px;
  background: var(--err);
  border-radius: 50%;
  border: 1.6px solid var(--gloomy_font);
  width: 22px;
  height: 22px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
