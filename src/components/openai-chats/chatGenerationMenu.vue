<template>
  <div class="chat__generate">
    <a-radio-group
      :disabled="disabled"
      :value="disabled ? null : options.checked"
      @update:value="updateOptions('checked', $event)"
    >
      <a-radio-button value="default">
        {{ capitalize(t("openai.actions.generate_text")) }}
      </a-radio-button>
      <a-radio-button @click="isAdvancedModalOpen = true" value="speech">
        {{ capitalize(t("openai.actions.generate_audio")) }}
        <checed-icon v-if="options.checked === 'speech'" />
      </a-radio-button>
      <a-radio-button @click="isAdvancedModalOpen = true" value="generate">
        {{ capitalize(t("openai.actions.generate_image")) }}
        {{
          options.checked === "generate" && !isAdvancedModalOpen
            ? `(${formatPrice(convertedImagePrices.get(currentImagePrice))} ${
                currency.title
              })`
            : ""
        }}
        <checed-icon v-if="options.checked === 'generate'" />
      </a-radio-button>
      <a-radio-button @click="isAdvancedModalOpen = true" value="video">
        {{ capitalize(t("openai.actions.generate_video")) }}
        {{
          options.checked === "video" && !isAdvancedModalOpen
            ? `(${formatPrice(
                ((convertedVideoPrices.get(options.model) || 0) / 60) *
                  options.duration
              )} ${currency.title})`
            : ""
        }}
      </a-radio-button>
    </a-radio-group>
  </div>

  <a-modal
    :open="isAdvancedModalOpen"
    :title="advancedModalTitle"
    :closable="false"
    :mask-closable="false"
    @cancel="updateOptions('checked', 'default')"
  >
    <a-form layout="vertical" autocomplete="off">
      <template v-if="options.checked === 'video'">
        <a-form-item
          :label="capitalize(t('openai.chat_action_properties.model'))"
        >
          <a-select
            :value="options.model"
            @update:value="updateOptions('model', $event)"
            :options="instanceVideoModels"
          />
        </a-form-item>

        <a-form-item :label="t('openai.chat_action_properties.duration')">
          <a-input-number
            style="width: 100%"
            :value="options.duration"
            @update:value="
              updateOptions('duration', $event || videoDurationRange.min)
            "
            :min="videoDurationRange.min"
            :max="videoDurationRange.max"
          />
        </a-form-item>

        <a-form-item :label="t('openai.chat_action_properties.aspect_ratio')">
          <a-select
            :value="options.aspect_ratio"
            @update:value="updateOptions('aspect_ratio', $event)"
            :options="videoAspectRatios"
          />
        </a-form-item>

        <a-form-item :label="t('openai.chat_action_properties.with_audio')">
          <a-switch
            :disabled="!isAudioEnabled"
            :checked="options.with_audio"
            @update:checked="updateOptions('with_audio', $event)"
          />
        </a-form-item>
      </template>

      <template v-if="options.checked === 'generate'">
        <a-form-item
          :label="capitalize(t('openai.chat_action_properties.model'))"
        >
          <a-select
            :value="options.model"
            @update:value="updateOptions('model', $event)"
            :options="instanceImageModels"
          />
        </a-form-item>

        <a-form-item
          :label="capitalize(t('openai.chat_action_properties.size'))"
        >
          <a-select
            :value="options.size"
            @update:value="updateOptions('size', $event)"
            :options="instanceImageSizes"
          />
        </a-form-item>
        <a-form-item
          :label="capitalize(t('openai.chat_action_properties.quality'))"
        >
          <a-select
            :value="options.quality"
            @update:value="updateOptions('quality', $event)"
            :options="instanceImageQualitys"
          />
        </a-form-item>

        <div
          style="display: flex; justify-content: center; margin-bottom: 10px"
        >
          <span style="font-size: 1rem; text-align: center">
            {{ t("openai.labels.price") }}: {{ formatPrice(convertedImagePrices.get(currentImagePrice)) }} {{ currency.title }}
          </span>
        </div>
      </template>

      <template v-if="options.checked === 'speech'">
        <a-form-item
          :label="capitalize(t('openai.chat_action_properties.model'))"
        >
          <a-select
            :value="options.model"
            @update:value="updateOptions('model', $event)"
            :options="instanceAudioModels"
          />
        </a-form-item>
      </template>
    </a-form>

    <div
      v-if="options.checked === 'video'"
      style="display: flex; justify-content: center; margin-bottom: 10px"
    >
      <span
        style="font-size: 1rem; text-align: center"
        v-html="
          marked(
            t('openai.labels.videos_price_tip', {
              perSecond: `${formatPrice(
                (convertedVideoPrices.get(options.model) || 0) / 60
              )}
        ${currency.title}`,
              total: `${formatPrice(
                ((convertedVideoPrices.get(options.model) || 0) / 60) *
                  options.duration
              )} ${currency.title}`,
            }).replaceAll('\n', ' ')
          )
        "
      />
    </div>

    <template #footer>
      <a-button
        :disabled="isSendMessageLoading"
        key="back"
        @click="handleCancelOptions"
        >{{ t("Cancel") }}</a-button
      >

      <a-button
        :loading="isSendMessageLoading"
        key="submit"
        type="primary"
        @click="isAdvancedModalOpen = false"
        >{{ t("Save") }}</a-button
      >
    </template>
  </a-modal>
</template>

<script setup>
import { useCurrency } from "@/hooks/utils";
import { useChatsStore } from "@/stores/chats";
import { useCurrenciesStore } from "@/stores/currencies";
import { marked } from "marked";
import { storeToRefs } from "pinia";
import { defineAsyncComponent } from "vue";
import { capitalize, computed, ref, toRefs, watch } from "vue";
import { useI18n } from "vue-i18n";

const checedIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CheckCircleOutlined")
);

const props = defineProps({
  options: { type: Object, default: () => {} },
  isSendMessageLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
const { options } = toRefs(props);

const emit = defineEmits(["update:options"]);

const currenciesStore = useCurrenciesStore();
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);

const { currency, formatPrice } = useCurrency();
const { t } = useI18n();

const convertedVideoPrices = ref(new Map());
const convertedImagePrices = ref(new Map());
const isAdvancedModalOpen = ref(false);
const lastOptionsValue = ref(options.value);

const advancedModalTitle = computed(() => {
  if (options.value.checked === "generate") {
    return t("openai.labels.generate_image");
  }

  if (options.value.checked === "speech") {
    return t("openai.labels.generate_audio");
  }

  return t("openai.labels.generate_video");
});

const instanceModels = computed(() => {
  return globalModelsList.value.filter(
    (m) =>
      ["public"].includes(m.visibility) &&
      m.state.state != "broken" &&
      !m.disabled
  );
});

const instanceAudioModels = computed(() =>
  instanceModels.value
    .filter((model) => (model.types || []).includes("text_to_audio"))
    .map((model) => ({
      value: model.key,
      label: `${capitalize(t("model"))}: ${model.name}`,
    }))
);

const instanceImageModels = computed(() =>
  instanceModels.value
    .filter((model) => (model.types || []).includes("image"))
    .map((model) => ({
      value: model.key,
      label: `${capitalize(t("model"))}: ${model.name}`,
    }))
);

const instanceVideoModels = computed(() =>
  instanceModels.value
    .filter((model) => (model.types || []).includes("video"))
    .map((model) => ({
      value: model.key,
      label: `${capitalize(t("model"))}: ${model.name}`,
    }))
);

const videoRequestParameters = computed(() => {
  if (options.value.checked === "video" && options.value.model) {
    const fullModel = instanceModels.value.find(
      ({ key }) => key === options.value.model
    );
    return fullModel.meta?.request_parameters || {};
  }
});

const videoAspectRatios = computed(() => {
  return (
    videoRequestParameters.value?.["aspect_ratio"]?.enum.map((v) => ({
      value: v,
      label: v,
    })) || []
  );
});

const videoDurationRange = computed(() => {
  return {
    min: videoRequestParameters.value?.["duration"]?.range?.from || 5,
    max: videoRequestParameters.value?.["duration"]?.range?.to || 8,
  };
});

const isAudioEnabled = computed(() => {
  return (videoRequestParameters.value?.["with_audio"]?.enum || []).includes(
    true
  );
});

const instanceImageSizes = computed(() => {
  if (options.value.checked !== "generate") {
    return [];
  }

  const model = instanceModels.value.find(
    (model) => model.key === options.value.model
  );

  if (!model) {
    return [];
  }

  return Object.keys(model.billing.images.res_to_quality || {}).map((v) => ({
    value: v,
    label: v,
  }));
});

const instanceImageQualitys = computed(() => {
  if (options.value.checked !== "generate") {
    return [];
  }

  const model = instanceModels.value.find(
    (model) => model.key === options.value.model
  );

  if (!model || !model.billing.images.res_to_quality?.[options.value.size]) {
    return [];
  }

  return Object.keys(
    model.billing.images.res_to_quality?.[options.value.size] || {}
  ).map((v) => ({
    value: v,
    label: t(`openai.images_quality.${v}`),
  }));
});

const currentImagePrice = computed(() => {
  if (options.value.checked !== "generate") {
    return 0;
  }

  const model = instanceModels.value.find(
    (model) => model.key === options.value.model
  );

  if (!model || !options.value.size || !options.value.quality) {
    return 0;
  }

  return (
    model.billing?.images?.res_to_quality?.[options.value.size]?.[options.value.quality]?.amount || 0
  );
});

const convertPrices = async (uniqueAmounts) => {
  try {
    const amounts = [...uniqueAmounts.values()];

    if (amounts.length > 0) {
      const response = await currenciesStore.convert({
        from: currenciesStore.defaultCurrency.code,
        to: currency.value.code,
        amounts,
      });

      [...uniqueAmounts.keys()].forEach((key, index) => {
        convertedVideoPrices.value.set(key, response.amounts[index]);
      });
    }
  } catch (e) {
    console.log(e);
  }
};

const convertImagePrices = async (uniqueAmounts) => {
  try {
    const amounts = [...uniqueAmounts.values()];

    if (amounts.length > 0) {
      const response = await currenciesStore.convert({
        from: currenciesStore.defaultCurrency.code,
        to: currency.value.code,
        amounts,
      });

      amounts.forEach((price, index) => {
        convertedImagePrices.value.set(price, response.amounts[index]);
      });
    }
  } catch (e) {
    console.log(e);
  }
};

const updateOptions = (key, value) => {
  emit("update:options", { key, value });
};

const handleCancelOptions = () => {
  isAdvancedModalOpen.value = false;
  if (lastOptionsValue.value) {
    Object.keys(lastOptionsValue.value).forEach((key) => {
      updateOptions(key, lastOptionsValue.value[key]);
    });
  } else {
    updateOptions("checked", "default");
  }
};

watch(instanceImageQualitys, (v) => {
  updateOptions(
    "quality",
    v.find((v) => v.value === options.value.quality)?.value || v[0]?.value
  );
});
watch(instanceImageSizes, (v) => {
  updateOptions(
    "size",
    v.find((v) => v.value === options.value.size)?.value || v[0]?.value
  );
});

watch(videoRequestParameters, () => {
  if (videoAspectRatios.value.length) {
    updateOptions(
      "aspect_ratio",
      videoAspectRatios.value.find(
        (v) => v.value === options.value.aspect_ratio
      )?.value || videoAspectRatios.value[0].value
    );
  }
  updateOptions(
    "duration",
    options.value.duration || videoDurationRange.value.min
  );
  if (!isAudioEnabled.value) {
    updateOptions("with_audio", false);
  }
});

watch(isAdvancedModalOpen, () => {
  lastOptionsValue.value = JSON.parse(JSON.stringify(options.value));
});

watch(instanceVideoModels, (value) => {
  const forConvert = new Map();
  value.forEach((model) => {
    const fullModel = instanceModels.value.find(
      ({ key }) => key === model.value
    );

    forConvert.set(
      model.value,
      fullModel?.billing?.media_duration?.duration_price?.price?.amount
    );
  });

  convertPrices(forConvert);
});

watch(
  [instanceImageModels, () => options.value.size, () => options.value.quality],
  () => {
    const uniqueAmounts = new Set();
    instanceImageModels.value.forEach((model) => {
      const fullModel = instanceModels.value.find(
        ({ key }) => key === model.value
      );

      if (fullModel?.billing?.images?.res_to_quality) {
        Object.keys(fullModel.billing.images.res_to_quality).forEach((size) => {
          Object.keys(fullModel.billing.images.res_to_quality[size]).forEach(
            (quality) => {
              const amount =
                fullModel.billing.images.res_to_quality[size][quality]?.amount;
              if (amount) {
                uniqueAmounts.add(amount);
              }
            }
          );
        });
      }
    });

    convertImagePrices(uniqueAmounts);
  },
  { immediate: true }
);

watch(
  () => options.value.checked,
  (current) => {
    if (current === "default") {
      return;
    }

    const getLastModel = (models) =>
      models.find((m) => m.value === options.value.model)?.value ||
      models[0]?.value;

    if (current === "generate") {
      updateOptions("model", getLastModel(instanceImageModels.value));
    } else if (current === "speech") {
      updateOptions("model", getLastModel(instanceAudioModels.value));
    } else {
      updateOptions("model", getLastModel(instanceVideoModels.value));
    }
  }
);
</script>

<style scoped>
.chat__generate {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  grid-column: 1 / 4;
  justify-self: start;
  border-color: var(--border_color);
  margin-bottom: 2px;
}

.chat__generate :deep(.ant-radio-button-wrapper),
.chat__generate :deep(.ant-select-selector) {
  border-color: var(--border_color);
}

.chat__generate :deep(.ant-radio-button-wrapper-checked),
.chat__generate :deep(.ant-select-selector-checked) {
  border-color: var(--main);
}

@media (max-width: 768px) {
  .chat__generate .ant-radio-button-wrapper {
    margin: 0;
    padding-inline: 2px;
    padding-block: 0;
  }
}
</style>
