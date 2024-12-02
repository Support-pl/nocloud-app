<template>
  <div class="cloud-wrapper">
    <div class="cloud">
      <loading v-if="isLoading" />
      <a-row v-else :gutter="[20, 20]">
        <a-col :span="12">
          <vdc-select v-model:value="selected" :options="options" />
        </a-col>

        <a-col style="align-self: flex-end" :span="12">
          <a-flex align="center" gap="small">
            <dollar-icon style="font-size: 25px" />
            <h3 class="cloud__title">
              <span style="white-space: nowrap">
                {{ capitalize($t("usage")) }}:
              </span>

              <span style="white-space: nowrap">
                {{ formatPrice(price) }} {{ currency.title }}/{{
                  $tc("month", 0)
                }}
              </span>
            </h3>
          </a-flex>
        </a-col>

        <a-col :span="12">
          <a-button
            block
            type="text"
            size="large"
            class="button button--secondary"
            @click="toNetworking"
          >
            {{ $t("Networking") }}
            <template #icon>
              <global-icon style="font-size: 25px" />
            </template>
          </a-button>
        </a-col>

        <a-col :span="12">
          <a-button
            block
            type="primary"
            size="large"
            class="button"
            @click="orderVM"
          >
            {{ $t("Order") }} VM
          </a-button>
        </a-col>
      </a-row>
    </div>

    <div class="cloud cloud__instances">
      <cloud-item
        v-for="inst of filteredInstances"
        :key="inst.orderid"
        :instance="inst"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, defineAsyncComponent, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import { useInstancesStore } from "@/stores/instances.js";

import { useCurrency, useNotification } from "@/hooks/utils";
import useVdcOptions from "@/hooks/cloud/vdcOptions.js";

import loading from "@/components/ui/loading.vue";
import cloudItem from "@/components/cloud/item.vue";
import vdcSelect from "@/components/cloud/vdc/select.vue";
import { transformInstances } from "@/functions";

const dollarIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DollarCircleOutlined")
);
const globalIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/GlobalOutlined")
);

const router = useRouter();
const authStore = useAuthStore();
const instancesStore = useInstancesStore();

const { currency, formatPrice } = useCurrency();
const { instances, options } = useVdcOptions();
const { openNotification } = useNotification();

const selected = ref("");
const isLoading = ref(false);

const price = computed(() => {
  const result = instances.value.map((inst) => {
    const { product, billingPlan, groupUuid } = inst;
    if (selected.value && selected.value !== groupUuid) return 0;

    const { price = 0, period = 2592000 } = billingPlan.products[product] ?? {};

    if (+period === 0) return 0;
    return price / (period / 2592000);
  });

  instances.value.forEach((inst) => {
    if (selected.value && selected.value !== inst.groupUuid) return;
    const type = inst.resources.drive_type.toLowerCase();

    inst.billingPlan.resources.forEach(({ key, price, period }) => {
      switch (key) {
        case `drive_${type}`: {
          const size = inst.resources.drive_size / 1024;
          const value = (price / (period / 2592000)) * size;

          if (value) result.push(value);
          break;
        }

        case "drive_type":
          break;

        default: {
          const size = inst.resources[key];
          const value = (price / (period / 2592000)) * size;

          if (value) result.push(value);
        }
      }
    });
  });

  return +result.reduce((sum, num) => sum + num, 0).toFixed(2);
});

const filteredInstances = computed(() =>
  transformInstances(instances.value).filter((inst) => {
    if (selected.value && selected.value !== inst.groupUuid) {
      return false;
    }
    return true;
  })
);

function orderVM() {
  router.push({ name: "services" });
}

function toNetworking() {
  router.push({ name: "VDCNetworking" });
}

async function fetchInstances() {
  isLoading.value = true;
  try {
    await instancesStore.fetch();
  } catch (error) {
    openNotification("error", {
      message: error.response?.data?.message ?? error.message ?? error,
    });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

if (authStore.userdata.uuid) fetchInstances();
watch(() => authStore.userdata, fetchInstances);
</script>

<script>
export default { name: "VDCCloud" };
</script>

<style scoped>
.cloud-wrapper {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.cloud {
  position: relative;
  height: max-content;
  width: 768px;
  padding: 20px;
  margin: 15px auto;
  border-radius: 20px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.08), 0px 0px 12px rgba(0, 0, 0, 0.05);
  background-color: var(--bright_font);
}

.cloud__title {
  display: flex;
  flex-wrap: wrap;
  gap: 0 4px;
  margin: 0;
}

.cloud__instances {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.button {
  height: auto;
  padding: 12px 15px;
}

.button--secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bright_bg);
  color: var(--main);
}

body.dark .button--secondary {
  color: var(--gloomy_font);
}

body.dark .button--secondary:hover {
  color: var(--main);
}
</style>
