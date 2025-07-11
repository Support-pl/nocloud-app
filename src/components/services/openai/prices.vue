<template>
  <a-row>
    <a-col span="24" v-if="filterOptions.length > 1">
      <a-radio-group
        :value="selectedFilter"
        @click="handleFilterChange"
        class="filter-radio-group"
      >
        <a-radio-button
          v-for="type of filterOptions"
          :key="type.value"
          :value="type.value"
          class="filter-radio-btn"
        >
          {{ capitalize(type.label) }}

          <component v-if="type.icon" :is="type.icon" />
        </a-radio-button>
      </a-radio-group>
    </a-col>

    <a-col
      v-for="provider in providersOptions"
      :xs="{ span: 12 }"
      :sm="{ span: 8 }"
    >
      <a-card
        bodyStyle="padding:0px"
        :class="{
          provider_item: true,
          active: selectedProvider == provider.value,
        }"
        @click="emits('update:selectedProvider', provider.value)"
      >
        <div class="provider_image">
          <img
            :src="`/img/ai-providers/${provider.value}.png`"
            class="openai_provider_img"
          />
        </div>

        <div class="provider_description">
          <a-checkbox
            style="max-height: 22px"
            :checked="selectedProvider == provider.value"
            @change="emits('update:selectedProvider', provider.value)"
          >
            {{ provider.label }}
          </a-checkbox>

          <div class="provider_tags" v-if="!filterByTypes.length">
            <a-tag
              class="provider_tag"
              v-for="(type, index) in (
                providersTypesMap?.[provider.value] || []
              ).slice(0, 3)"
              :color="type.color"
            >
              {{ type.label }}
            </a-tag>
          </div>
        </div>
      </a-card>
    </a-col>
  </a-row>

  <a-row style="padding: 0px 5px">
    <a-col
      v-if="typesOptions.length > 1"
      :xs="{ span: 24 }"
      :sm="{ span: 8 }"
      style="min-width: 200px; margin-right: 5px"
    >
      <a-select
        style="width: 100%; margin-right: 5px; margin-top: 10px"
        :value="selectedType"
        @select="emits('update:selectedType', $event)"
        :options="typesOptions"
      />
    </a-col>

    <a-col
      :xs="{ span: 24 }"
      :sm="{ span: typesOptions.length < 2 ? 24 : 15 }"
      style="margin-right: 5px"
    >
      <a-select
        show-search
        style="margin-right: 10px; width: 100%; margin-top: 10px"
        :value="selectedModel"
        :options="modelsOptions"
        @change="emits('update:selectedModel', $event)"
      />
    </a-col>

    <a-col
      style="margin: 10px 0px"
      v-for="{ subkey, amount, type, items } in pricesForModel"
      :span="type !== 'images' ? 12 : 24"
    >
      <template v-if="type !== 'images'">
        <div style="padding-bottom: 0; font-weight: 700">
          {{ t(`openai.payment_types.${subkey}`) }}:
        </div>
        <div style="padding-top: 0; font-size: 18px">
          <template v-if="isConvertPricesLoading">
            <a-spin class="price__spin" size="small" spinning />
          </template>

          <span v-else>
            {{ convertedPrices.get(amount) }}
            {{ currency.title }}

            <a-popover
              v-if="t(`openai.payment_types_tips.${subkey}`) != 'null'"
            >
              <template #content>
                <div style="width: 40vw; font-style: italic">
                  <span style="font-weight: bold">{{
                    t(`openai.payment_types_tips.${subkey}.title`)
                  }}</span>
                  <span>{{
                    t(`openai.payment_types_tips.${subkey}.description`)
                  }}</span>
                </div>
              </template>
              <question-circle-outlined />
            </a-popover>
          </span>
        </div>
      </template>
      <template v-else>
        <template v-if="isConvertPricesLoading">
          <a-spin class="price__spin" size="small" spinning />
        </template>
        <a-table
          v-else
          :pagination="false"
          :loading="isConvertPricesLoading"
          :dataSource="
            items.map((item) => ({
              resolution: item.resolution,
              quality: t(`openai.images_quality.${item.quality}`),
              price: `${convertedPrices.get(item.amount)} ${currency.title}`,
            }))
          "
          :columns="imagesColumns"
        >
          <template #headerCell="{ column }">
            <template v-if="column.key === 'price'">
              <div style="display: flex; align-items: center">
                <span>
                  {{ t("openai.images_properties.price") }}
                </span>

                <a-popover>
                  <template #content>
                    <div style="width: 40vw; font-style: italic">
                      <span style="font-weight: bold">{{
                        t(`openai.payment_types_tips.images.title`)
                      }}</span>
                      <span>{{
                        t(`openai.payment_types_tips.images.description`)
                      }}</span>
                    </div>
                  </template>
                  <question-circle-outlined
                    style="font-size: 19px; margin-left: 10px"
                  />
                </a-popover>
              </div>
            </template>
          </template>
        </a-table>
      </template>
    </a-col>
  </a-row>
</template>

<script setup>
import { useCurrency } from "@/hooks/utils";
import { useChatsStore } from "@/stores/chats";
import { useCurrenciesStore } from "@/stores/currencies";
import { storeToRefs } from "pinia";
import {
  capitalize,
  computed,
  defineAsyncComponent,
  ref,
  toRefs,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";

const imageIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FileImageOutlined")
);
const videoIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/VideoCameraOutlined")
);
const textIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FileTextOutlined")
);
const audioIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/AudioOutlined")
);

const props = defineProps({
  planId: { type: String, required: true },
  selectedType: { type: String, required: true },
  selectedModel: { type: String, required: true },
  selectedProvider: { type: String, required: true },
  filterByTypes: { type: Array, default: () => [] },
  onlyPublic: { type: Boolean, default: false },
});
const {
  selectedModel,
  selectedProvider,
  selectedType,
  filterByTypes,
  onlyPublic,
} = toRefs(props);

const pricesForModel = ref({});
const selectedFilter = ref("all");
const convertedPrices = ref(new Map());
const isConvertPricesLoading = ref(false);

const emits = defineEmits([
  "update:selectedModel",
  "update:selectedType",
  "update:selectedProvider",
]);

const questionCircleOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/QuestionCircleOutlined")
);

const fieldsForTypes = {
  text: {
    type: "default",
    fields: [{ "tokens.text_output": "number", "tokens.text_input": "number" }],
  },
  text_to_audio: {
    type: "default",
    fields: [
      {
        "tokens.text_output": "number",
        "tokens.text_input": "number",
        "media_duration.duration_price": "number",
        "other.sampling_step_price": "number",
        "other.characters_price": "number",
      },
    ],
  },
  audio_to_text: {
    type: "default",
    fields: [
      {
        "tokens.text_output": "number",
        "tokens.text_input": "number",
        "media_duration.duration_price": "number",
      },
    ],
  },
  video: {
    type: "default",
    fields: [
      {
        "media_duration.duration_price": "number",
      },
    ],
  },
  image: {
    type: "variant",
    fields: [
      { "images.res_to_quality": "map-map-number" },
      {
        "tokens.text_input": "number",
        "tokens.image_input": "number",
        "tokens.image_output": "number",
      },
    ],
  },
};

const chatsStore = useChatsStore();
const currenciesStore = useCurrenciesStore();
const { globalModelsList } = storeToRefs(chatsStore);

const { t } = useI18n();
const { currency } = useCurrency();

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

const availableModels = computed(() =>
  globalModelsList.value.filter(
    (m) =>
      (onlyPublic.value ? ["public"] : ["api_only", "public"]).includes(
        m.visibility
      ) &&
      m.state.state != "broken" &&
      !m.disabled
  )
);

const modelByProviders = computed(() => {
  const models =
    availableModels.value.filter((m) => m.provider == selectedProvider.value) ||
    [];

  return models;
});

const modelsOptions = computed(() => {
  const models = modelByProviders.value.filter((item) =>
    (item.types || []).includes(selectedType.value)
  );
  return models.map((item) => ({
    value: item.key,
    label: `${capitalize(t("model"))}: ${item.name}`,
  }));
});

const typesOptions = computed(() => {
  const types = modelByProviders.value
    .reduce((acc, item) => {
      (item?.types || []).forEach((type) => {
        if (!acc.includes(type)) {
          acc.push(type);
        }
      });
      return acc;
    }, [])
    .filter((t) => {
      const globalFilter =
        filterByTypes.value.length == 0 || filterByTypes.value.includes(t);

      const typesForLocalFilter = selectedFilter.value.split("|");
      const localFilter =
        typesForLocalFilter.includes("all") || typesForLocalFilter.includes(t);

      return globalFilter && localFilter;
    });

  const desiredOrder = [
    "text",
    "image",
    "video",
    "text_to_audio",
    "audio_to_text",
    "embedding",
  ];

  const sorted = types.sort(
    (a, b) => desiredOrder.indexOf(a) - desiredOrder.indexOf(b)
  );

  return sorted.map((key) => ({
    value: key,
    label: t(`openai.types.${key}`),
  }));
});

const filterOptions = computed(() => {
  const types = availableModels.value
    .reduce((acc, item) => {
      (item?.types || []).forEach((type) => {
        if (!acc.includes(type)) {
          acc.push(type);
        }
      });
      return acc;
    }, [])
    .filter(
      (t) => filterByTypes.value.length == 0 || filterByTypes.value.includes(t)
    );

  const result = [];

  if (types.includes("text")) {
    result.push({
      label: t("openai.filters.text"),
      value: "text",
      icon: textIcon,
    });
  }

  if (types.includes("image")) {
    result.push({
      label: t("openai.filters.image"),
      value: "image",
      icon: imageIcon,
    });
  }

  if (types.includes("video")) {
    result.push({
      label: t("openai.filters.video"),
      value: "video",
      icon: videoIcon,
    });
  }

  if (types.includes("text_to_audio") || types.includes("audio_to_text")) {
    result.push({
      label: t("openai.filters.audio"),
      value: "text_to_audio|audio_to_text",
      icon: audioIcon,
    });
  }

  return result;
});

const providersOptions = computed(() => {
  return availableModels.value
    .reduce((acc, item) => {
      const isAlreadyExist = !item.provider || acc.includes(item.provider);
      const globalFilter =
        filterByTypes.value.length == 0 ||
        filterByTypes.value.find((type) => item?.types.includes(type));

      const typesForLocalFilter = selectedFilter.value.split("|");
      const localFilter =
        typesForLocalFilter.includes("all") ||
        typesForLocalFilter.some((type) => item?.types.includes(type));

      if (!isAlreadyExist && globalFilter && localFilter) {
        acc.push(item.provider);
      }
      return acc;
    }, [])
    .map((key) => ({
      value: key,
      label: t(`openai.providers.${key}`),
    }));
});

const providersTypesMap = computed(() => {
  const result = {};
  availableModels.value.forEach((item) => {
    if (!result[item.provider]) {
      result[item.provider] = [];
    }
    item.types.forEach((type) => {
      let option = {};
      if (type === "text" || type == "embedding") {
        option = {
          label: t("openai.filters.text"),
          color: "blue",
          key: "text",
        };
      }

      if (type == "image") {
        option = {
          label: t("openai.filters.image"),
          color: "green",
          key: "image",
        };
      }

      if (type == "video") {
        option = {
          label: t("openai.filters.video"),
          color: "red",
          key: "video",
        };
      }

      if (type == "text_to_audio" || type == "audio_to_text") {
        option = {
          label: t("openai.filters.audio"),
          color: "purple",
          key: "audio",
        };
      }

      if (!result[item.provider].find((t) => t.key === option.key)) {
        result[item.provider].push(option);
      }
    });
  });

  const desiredOrder = ["video", "image", "audio", "text"];

  Object.keys(result).forEach((key) => {
    result[key].sort(
      (a, b) => desiredOrder.indexOf(a.key) - desiredOrder.indexOf(b.key)
    );
  });

  return result;
});

const convertPrices = async (uniqueAmounts) => {
  isConvertPricesLoading.value = true;
  try {
    [...uniqueAmounts.values()].forEach((value) => {
      if (
        currency.value.code === currenciesStore.defaultCurrency.code ||
        convertedPrices.value.get(value)
      ) {
        convertedPrices.value.set(
          value,
          convertedPrices.value.get(value) || value
        );
        uniqueAmounts.delete(value);
      }
    });
    const amounts = [...uniqueAmounts.values()];

    if (amounts.length > 0) {
      const response = await currenciesStore.convert({
        from: currenciesStore.defaultCurrency.code,
        to: currency.value.code,
        amounts,
      });

      amounts.forEach((price, index) => {
        convertedPrices.value.set(price, response.amounts[index]);
      });
    }
  } finally {
    isConvertPricesLoading.value = false;
  }
};

function handleFilterChange(value) {
  value = value.target.value;
  if (!value) {
    return;
  }

  if (selectedFilter.value === value) {
    selectedFilter.value = "all";
  } else {
    selectedFilter.value = value;
  }
}

async function setPrices() {
  const result = [];
  const uniqueAmounts = new Set();
  const fullModel = modelByProviders.value.find(
    (v) => v.key === selectedModel.value
  );
  if (!fullModel) {
    return;
  }

  fieldsForTypes[selectedType.value].fields.forEach((fields) => {
    Object.keys(fields).forEach((field) => {
      const type = fields[field];
      const [key, subkey] = field.split(".");

      if (type === "number") {
        if (fullModel.billing[key][subkey]?.price?.amount) {
          uniqueAmounts.add(fullModel.billing[key][subkey].price.amount);
          result.push({
            subkey,
            key,
            amount: fullModel.billing[key][subkey].price.amount,
            type: "number",
          });
        }
      } else {
        result.push({ key, subkey, items: [], type: "images" });

        Object.keys(fullModel.billing[key][subkey]).forEach((resolution) => {
          Object.keys(fullModel.billing[key][subkey][resolution]).forEach(
            (quality) => {
              const amount =
                fullModel.billing[key][subkey][resolution][quality]?.amount;
              if (amount) {
                uniqueAmounts.add(amount);

                result[result.length - 1].items.push({
                  quality,
                  resolution,
                  amount,
                });
              }
            }
          );
        });
      }
    });
  });
  result.sort((a, b) => a.subkey.localeCompare(b.subkey));

  result.sort((r) => (r.type === "number" ? -1 : 1));

  pricesForModel.value = result;

  convertPrices(uniqueAmounts);
}
setPrices();

watch(providersOptions, (data) => {
  if (!data.find((v) => v.value === selectedProvider.value)) {
    emits("update:selectedProvider", data[0]?.value);
  }
});

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

watch(selectedModel, () => {
  setPrices();
});
</script>

<style scoped>
.openai_provider_img {
  width: calc(100% - 60px);
  height: 40px;
  max-width: 170px;
}

@media screen and (max-width: 768px) {
  .openai_provider_img {
    width: calc(100%);
    height: 40px;
    max-width: 170px;
  }
}

.filter-radio-group {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  margin-bottom: 5px;
}

.filter-radio-btn {
  flex: 1;
  text-align: center;
  white-space: nowrap;
  padding: 1px 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 250px;
}

.provider_item {
  padding: 10px;
  margin: 2px;
  border-color: unset;
  height: 105px;
}

.provider_item.active {
  border-color: var(--main);
}

.provider_image {
  display: flex;
  justify-content: center;
}
.provider_description {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  position: relative;
}
.provider_tags {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  flex-direction: column;
  position: absolute;
  right: 3px;
  max-width: 60%;
  top: 0px;
}
.provider_tag {
  width: 100%;
  text-align: center;
  font-size: 10px;
  line-height: 13px;
  margin-inline-end: 3px;
  padding-inline: 3px;
  margin-bottom: 2px;
}
</style>
