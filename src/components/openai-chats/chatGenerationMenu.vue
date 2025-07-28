<template>
  <div class="chat__generate">
    <a-radio-group
      :value="options.checked"
      @update:value="updateOptions('checked', $event)"
    >
      <a-radio-button value="default">
        {{ capitalize(t("openai.actions.generate_text")) }}
      </a-radio-button>
      <a-radio-button value="speech">
        {{ capitalize(t("openai.actions.generate_audio")) }}
      </a-radio-button>
      <a-radio-button value="generate">
        {{ capitalize(t("openai.actions.generate_image")) }}
      </a-radio-button>
      <a-radio-button @click="isVideoModalOpen = true" value="video">
        {{ capitalize(t("openai.actions.generate_video")) }}
        {{
          options.checked === "video"
            ? `(${formatPrice(
                ((convertedVideoPrices.get(options.model) || 0) / 60) *
                  options.duration
              )} ${currency.title})`
            : ""
        }}
      </a-radio-button>
    </a-radio-group>
    <a-select
      style="min-width: 200px"
      v-if="options.checked === 'speech' && instanceAudioModels.length > 1"
      :value="options.model"
      @update:value="updateOptions('model', $event)"
      :options="instanceAudioModels"
    />

    <a-select
      style="min-width: 220px"
      v-if="options.checked === 'generate' && instanceImageModels.length > 1"
      :value="options.model"
      @update:value="updateOptions('model', $event)"
      :options="instanceImageModels"
    />

    <a-select
      style="min-width: 120px"
      v-if="options.checked === 'generate'"
      :value="options.size"
      @update:value="updateOptions('size', $event)"
      :options="instanceImageSizes"
    />
    <a-select
      style="min-width: 100px"
      v-if="options.checked === 'generate'"
      :value="options.quality"
      @update:value="updateOptions('quality', $event)"
      :options="instanceImageQualitys"
    />
  </div>

  <a-modal
    :open="isVideoModalOpen"
    :title="t('openai.actions.generate_video_confirm')"
    @cancel="updateOptions('checked', 'default')"
  >
    <a-form layout="vertical" autocomplete="off">
      <a-form-item
        v-if="!videoConfirm"
        :label="t('openai.videos_properties.promt')"
      >
        <a-textarea
          :value="promt"
          @update:value="emit('update:promt', $event)"
          type="text"
          :auto-size="{ minRows: 3, maxRows: 5 }"
          :placeholder="t('openai.prompts.video.placeholder')"
        />
      </a-form-item>

      <a-form-item :label="capitalize(t('openai.videos_properties.model'))">
        <a-select
          v-if="instanceVideoModels.length > 1"
          :value="options.model"
          @update:value="updateOptions('model', $event)"
          :options="instanceVideoModels"
        />
      </a-form-item>

      <a-form-item :label="t('openai.videos_properties.duration')">
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

      <a-form-item :label="t('openai.videos_properties.aspect_ratio')">
        <a-select
          :value="options.aspect_ratio"
          @update:value="updateOptions('aspect_ratio', $event)"
          :options="videoAspectRatios"
        />
      </a-form-item>

      <a-form-item :label="t('openai.videos_properties.with_audio')">
        <a-switch
          :disabled="!isAudioEnabled"
          :checked="options.with_audio"
          @update:checked="updateOptions('with_audio', $event)"
        />
      </a-form-item>
    </a-form>

    <div style="display: flex; justify-content: center; margin-bottom: 10px">
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
        @click="isVideoModalOpen = false"
        >{{ t("Cancel") }}</a-button
      >

      <a-button
        :loading="isSendMessageLoading"
        key="submit"
        type="primary"
        @click="videoConfirm ? emit('click:send') : (isVideoModalOpen = false)"
        >{{
          videoConfirm
            ? t("Confirm")
            : t("openai.actions.generate_video_confirm")
        }}</a-button
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
import { capitalize, computed, ref, toRefs, watch } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  options: { type: Object, default: () => {} },
  isSendMessageLoading: { type: Boolean, default: false },
  promt: { type: String, default: "" },
  videoConfirm: { type: Boolean, default: false },
});
const { options } = toRefs(props);

const emit = defineEmits(["update:options", "update:promt", "click:send"]);

const currenciesStore = useCurrenciesStore();
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);

const { currency, formatPrice } = useCurrency();
const { t } = useI18n();

const convertedVideoPrices = ref(new Map());
const isVideoModalOpen = ref(false);

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
    max: videoRequestParameters.value?.["duration"]?.to || 8,
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

const updateOptions = (key, value) => {
  emit("update:options", { key, value });
};

watch(instanceImageQualitys, (v) => {
  updateOptions("quality", v[0]?.value);
});
watch(instanceImageSizes, (v) => {
  updateOptions("size", v[0]?.value);
});

watch(videoRequestParameters, () => {
  if (videoAspectRatios.value.length) {
    updateOptions("aspect_ratio", videoAspectRatios.value[0].value);
  }
  updateOptions("duration", videoDurationRange.value.min);
  if (!isAudioEnabled.value) {
    updateOptions("with_audio", false);
  }
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
  () => options.value.checked,
  (current, previous) => {
    if (current !== previous && previous === "video") {
      isVideoModalOpen.value = false;
    }

    if (current === "default") {
      return;
    }

    if (current === "generate") {
      updateOptions("model", instanceImageModels.value[0]?.value);
    } else if (current === "speech") {
      updateOptions("model", instanceAudioModels.value[0]?.value);
    } else {
      isVideoModalOpen.value = true;
      updateOptions("model", instanceVideoModels.value[0]?.value);
    }
  }
);

watch(isVideoModalOpen, (value) => {
  if (!value && !props.videoConfirm) {
    updateOptions("checked", "default");
  }
});
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
</style>
