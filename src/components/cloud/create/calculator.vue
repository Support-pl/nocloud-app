<template>
  <div v-if="filteredPlans.length > 0" class="newCloud__calculate order__field">
    <editor-container
      v-if="locationDescription && activeKey === 'location'"
      :value="locationDescription"
    />

    <template v-else>
      <!-- Location Tarif CPU RAM GPU Drive os network -->
      <cloud-resources
        :min-product="activeKey === 'location' ? minProduct : {}"
        :product-size="productSize"
        :tarification="tarification"
      />

      <!-- addons -->
      <transition-group v-if="activeKey !== 'location'" name="networkApear">
        <a-row
          v-for="(price, key) in addons"
          :key="key"
          justify="space-between"
          style="font-size: 1.1rem"
        >
          <a-col>
            {{ capitalize(getAddonsTitle(key)) }}{{ getAddonsValue(key) }}:
          </a-col>
          <a-col>
            <template v-if="isFlavorsLoading">
              <a-spin class="price__spin" size="small" spinning />
            </template>
            <template v-else>
              {{ formatPrice(price) }} {{ currency.title }}
            </template>
          </a-col>
        </a-row>
      </transition-group>

      <selects-to-create
        v-model:plan="cloudStore.planId"
        v-model:service="cloudStore.serviceId"
        v-model:namespace="cloudStore.namespaceId"
        :plans-list="filteredPlans"
        :is-plans-visible="false"
      />
    </template>

    <transition name="networkApear">
      <a-row
        v-if="minProduct.installationFee"
        justify="space-between"
        style="
          font-size: 1.2rem;
          padding-top: 5px;
          margin-top: 10px;
          border-top: 1px solid #e8e8e8;
        "
      >
        <a-col> {{ capitalize($t("installation")) }}: </a-col>
        <a-col style="margin-left: auto">
          <template v-if="isFlavorsLoading">
            <a-spin class="price__spin" size="small" spinning />
          </template>
          <template v-else>
            {{ formatPrice(minProduct.installationFee) }} {{ currency.title }}
          </template>
        </a-col>
      </a-row>
    </transition>

    <transition name="networkApear">
      <a-row
        justify="space-between"
        style="font-size: 1.2rem; gap: 5px"
        :style="
          !minProduct.installationFee
            ? {
                paddingTop: '5px',
                marginTop: '10px',
                borderTop: '1px solid #e8e8e8',
              }
            : null
        "
      >
        <a-col> {{ capitalize($t("recurring payment")) }}: </a-col>
        <a-col style="margin-left: auto">
          <template v-if="isFlavorsLoading">
            <a-spin class="price__spin" size="small" spinning />
          </template>
          <template v-else>
            {{ formatPrice(periodicPrice, currency) }}
            {{ currency.title }}
          </template>
        </a-col>
      </a-row>
    </transition>

    <a-divider orientation="left" style="margin-bottom: 0; margin-top: 5px">
      {{ $t("Total") }}:
    </a-divider>
    <a-row justify="center" style="margin-top: 15px">
      <a-col>
        <a-radio-group
          default-value="Monthly"
          :value="tarification"
          :style="{
            display: 'grid',
            textAlign: 'center',
            gridTemplateColumns: periodColumns,
          }"
          @update:value="emits('update:tarification', $event)"
        >
          <a-radio-button
            v-for="period of periods"
            :key="period.value"
            :value="period.value"
          >
            {{ capitalize($t(period.label || period.value)) }}
          </a-radio-button>
        </a-radio-group>
      </a-col>
    </a-row>

    <a-row
      ref="sumOrder"
      justify="center"
      :style="{ 'font-size': '1.4rem', 'margin-top': '10px' }"
    >
      <a-col
        v-if="activeKey === 'location' && tarification"
        style="margin-right: 4px"
      >
        {{ capitalize($t("from")) }}:
      </a-col>
      <transition name="textchange" mode="out-in">
        <a-col>
          <template v-if="isFlavorsLoading">
            <a-spin class="price__spin" size="small" spinning />
          </template>
          <template v-else>
            <div v-if="isSaleApply" class="price__sale" style="">
              <span class="without_sale">
                {{ formatPrice(startPrice, currency) }} {{ currency.title }}
              </span>

              <span>
                {{ formatPrice(startPriceWithSale, currency) }}
                {{ currency.title }}
              </span>
            </div>
            <template v-else>
              {{ formatPrice(startPrice, currency) }} {{ currency.title }}
            </template>
          </template>
        </a-col>
      </transition>
    </a-row>

    <promocode-menu
      :is-flavors-loading="isFlavorsLoading"
      :plan-id="cloudStore.planId"
      :applyed-promocode="promocode"
      @update:promocode="promocode = $event"
    />

    <cloud-create-button
      :product-size="productSize"
      :tarification="tarification"
      :create-order="createOrder"
      :panels="panels"
      :skip-password-check="cloudStore.plan?.type == 'ione-vpn'"
    />
  </div>
</template>

<script setup>
import { computed, inject, toRefs, ref } from "vue";
import { useI18n } from "vue-i18n";
import { EditorContainer } from "nocloud-ui";

import { useCloudStore } from "@/stores/cloud.js";
import useCloudPrices from "@/hooks/cloud/prices.js";
import { useAddonsStore } from "@/stores/addons.js";
import { useCurrency } from "@/hooks/utils";
import { checkPayg } from "@/functions.js";

import selectsToCreate from "@/components/ui/selectsToCreate.vue";
import cloudResources from "@/components/cloud/create/resources.vue";
import cloudCreateButton from "@/components/cloud/create/button.vue";
import promocodeMenu from "@/components/ui/promocode-menu.vue";
import { storeToRefs } from "pinia";

const props = defineProps({
  productSize: { type: String, required: true },
  tarification: { type: String, required: true },
  filteredPlans: { type: Array, required: true },
  periods: { type: Object, required: true },
  panels: { type: Array, required: true },
  isFlavorsLoading: { type: Boolean, default: false },
});
const emits = defineEmits(["update:tarification"]);

const i18n = useI18n();
const { currency, formatPrice } = useCurrency();
const cloudStore = useCloudStore();
const { promocode } = storeToRefs(useCloudStore());
const addonsStore = useAddonsStore();

const [product] = inject("useProduct", () => [])();
const [options] = inject("useOptions", () => [])();
const [priceOVH] = inject("usePriceOVH", () => [])();

const sumOrder = ref();
const checkBalance = inject("checkBalance", () => {});

const addons = computed(() => {
  const addons = { ...priceOVH.addons };

  if (cloudStore.plan.type?.includes("dedicated")) {
    delete addons.disk;
  }

  delete addons.os;
  delete addons.ram;
  return addons;
});

const locationDescription = computed(() => {
  const { showcase: id } =
    cloudStore.locations.find((el) => el.id === cloudStore.locationId) ?? {};
  const showcase = cloudStore.showcases.find(({ uuid }) => uuid === id);

  if (!showcase?.promo) return;
  return showcase?.promo[i18n.locale.value]?.service?.description;
});

const periodColumns = computed(() => {
  const { length } = Object.keys(props.periods);

  if (length === 4) return "repeat(2, 1fr)";
  return `repeat(${length < 3 ? length : 3}, 1fr)`;
});

const [activeKey] = inject("useActiveKey", () => [])();
const { tarification, productSize } = toRefs(props);
const {
  periodicPrice,
  startPrice,
  minProduct,
  startPriceWithSale,
  isSaleApply,
} = useCloudPrices(product, tarification, activeKey, options, priceOVH);

function getAddonsValue(key) {
  const addon = options.config.addons?.find((el) => el.includes(key));
  const value = parseFloat(addon?.split("-")?.at(-1));

  return isFinite(value) ? ` (${value} Gb)` : "";
}

function getAddonsTitle(key) {
  if (cloudStore.plan.type === "ione") {
    return addonsStore.addons.find(({ uuid }) => uuid === key)?.title ?? key;
  } else {
    return i18n.t(key);
  }
}

async function createOrder() {
  const instance = { config: options.config, billingPlan: cloudStore.plan };
  const price = startPrice.value;

  if (checkPayg(instance) && !checkBalance(price)) return;
  await cloudStore.createOrder(options, product);
}
</script>

<script>
export default { name: "CalculatorBlock" };
</script>

<style>
.price__spin {
  margin-left: 5px;
  margin-top: 3px;
}

.price__sale {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.price__sale .without_sale {
  text-decoration: line-through;
  margin-right: 10px;
}
</style>
