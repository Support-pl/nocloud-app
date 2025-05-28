<template>
  <template v-if="Object.keys(fullPrices).length > 1">
    <a-row>
      <a-col v-for="provider in providersOptions" span="8">
        <a-card
          bodyStyle="padding:0px"
          :style="{
            padding: '10px',
            margin: '2px',
            'border-color':
              selectedProvider == provider.value ? 'var(--main)' : 'unset',
          }"
          @click="emits('update:selectedProvider', provider.value)"
        >
          <div style="display: flex; justify-content: center">
            <img
              :src="`/img/ai-providers/${provider.value}.png`"
              style="width: calc(100% - 60px); height: 40px; max-width: 170px"
            />
          </div>

          <div
            style="display: flex; justify-content: space-between; padding: 10px"
          >
            <a-checkbox
              :checked="selectedProvider == provider.value"
              @change="emits('update:selectedProvider', provider.value)"
            >
              {{ provider.label }}
            </a-checkbox>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <a-row style="padding: 0px 5px">
      <a-col span="8" style="min-width: 150px; margin-right: 5px">
        <a-select
          style="width: 100%; margin-right: 5px; margin-top: 10px"
          :value="selectedType"
          @select="emits('update:selectedType', $event)"
          :options="typesOptions"
        ></a-select>
      </a-col>

      <a-col span="15" style="margin-right: 5px">
        <a-auto-complete
          style="margin-right: 10px; width: 100%; margin-top: 10px"
          :value="selectedModel"
          :options="sortedModelsOptions"
          @change="emits('update:selectedModel', $event)"
          @blur="emits('update:selectedModel', modelsOptions[0]?.value)"
        ></a-auto-complete>
      </a-col>

      <a-col
        style="margin: 10px 0px"
        v-if="selectedType !== 'image'"
        v-for="priceItem in pricesItems"
        span="12"
      >
        <div style="padding-bottom: 0; font-weight: 700">
          {{
            t(
              `openai.payment_types.${priceItem.split("|").slice(2).join("_")}`
            )
          }}:
        </div>
        <div style="padding-top: 0; font-size: 18px">
          {{ fullPrices[priceItem] }}
          {{ currency.title }}
        </div>
      </a-col>

      <a-col v-else style="margin: 10px 0px" span="24">
        <a-table
          :pagination="false"
          :dataSource="
            pricesItems.map((key) => ({
              resolution: key.split('|')[2],
              quality: t(`openai.images_quality.${key.split('|')[3]}`),
              price: `${fullPrices[key]} ${currency.title}`,
            }))
          "
          :columns="imagesColumns"
        />
      </a-col>
    </a-row>
  </template>
</template>

<script setup>
import { useCurrency } from "@/hooks/utils";
import { useChatsStore } from "@/stores/chats";
import { usePlansStore } from "@/stores/plans";
import { storeToRefs } from "pinia";
import { capitalize, computed, ref, toRefs, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  planId: { type: String, required: true },
  selectedType: { type: String, required: true },
  selectedModel: { type: String, required: true },
  selectedProvider: { type: String, required: true },
});
const { selectedModel, selectedProvider, selectedType } = toRefs(props);

const emits = defineEmits([
  "update:selectedModel",
  "update:selectedType",
  "update:selectedProvider",
]);

const plansStore = usePlansStore();
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);

const { t } = useI18n();
const { currency } = useCurrency();

const fullPrices = ref({});

const imagesColumns = computed(() => [
  {
    title: t("openai.images_properties.resolution"),
    dataIndex: "resolution",
    key: "resolution",
  },
  {
    title: t("openai.images_properties.quality"),
    dataIndex: "quality",
    key: "quality",
  },
  {
    title: t("openai.images_properties.price"),
    dataIndex: "price",
    key: "price",
  },
]);

const modelByProviders = computed(() => {
  const resources = Object.keys(fullPrices.value)
    .filter((key) => key.split("|").length > 2)
    .filter((key) =>
      (globalModelsList.value[selectedProvider.value] || []).includes(
        key.split("|")[1]
      )
    );

  return resources;
});

const modelsOptions = computed(() => {
  const resources = modelByProviders.value
    .filter((key) => getModelType(key) === selectedType.value)
    .map((key) => key.split("|")[1]);

  return [...new Set(resources).values()].map((key) => ({
    value: key,
    label: `${capitalize(t("model"))}: ${key}`,
  }));
});

const sortedModelsOptions = computed(() => {
  return modelsOptions.value.sort((a, b) => {
    const va = (v, s) =>
      v.toLowerCase().startsWith(s.toLowerCase())
        ? 2
        : v.toLowerCase().includes(s.toLowerCase())
        ? 1
        : 0;
    return va(b.label, selectedModel.value) - va(a.label, selectedModel.value);
  });
});

const typesOptions = computed(() => {
  const resources = modelByProviders.value.map((key) => getModelType(key));

  return [...new Set(resources).values()].map((key) => ({
    value: key,
    label: t(`openai.types.${key}`),
  }));
});

const providersOptions = computed(() => {
  return Object.keys(globalModelsList.value || {}).map((key) => ({
    value: key,
    label: t(`openai.providers.${key}`),
  }));
});

const pricesItems = computed(() => {
  const data = Object.keys(fullPrices.value).filter(
    (r) =>
      getModelType(r) === selectedType.value &&
      selectedModel.value === r.split("|")[1]
  );
  if (selectedType.value === "image") {
    const imagesData = data.filter((resource, index) => {
      const subtype = resource.split("|")[2];
      let reversedSubType = `${subtype.split("x")[1]}x${subtype.split("x")[0]}`;
      reversedSubType += `|${resource.split("|")[3]}`;
      let indexOfReversed = data.findIndex(
        (r) => r.split("|").slice(2).join("|") === reversedSubType
      );

      indexOfReversed =
        indexOfReversed === -1 ? Number.MAX_SAFE_INTEGER : indexOfReversed;

      return !(
        index > indexOfReversed &&
        fullPrices.value[data[indexOfReversed]] === fullPrices.value[resource]
      );
    });

    return imagesData;
  }

  return data;
});

function getModelType(key) {
  const type = key.split("|")[0];

  if (["speech", "translation", "transcription"].includes(type)) {
    return "audio";
  }
  return type;
}

async function fetch() {
  (await plansStore.fetchById(props.planId)).resources.forEach((r) => {
    fullPrices.value[r.key] = r.price;
  });
}

watch(typesOptions, (data) => {
  if (!data.find((v) => v.value === selectedType.value)) {
    emits("update:selectedType", data[0]?.value);
  }
});

watch(modelsOptions, (data) => {
  if (!data.find((v) => v.value === selectedType.value)) {
    emits("update:selectedModel", data[0]?.value);
  }
});
fetch();
</script>
