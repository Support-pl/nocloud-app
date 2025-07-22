<template>
  <div>
    <div v-if="ticket.department === 'openai'" class="chat__generate">
      <a-radio-group
        v-if="!instance"
        v-model:value="sendAdvancedOptions.checked"
      >
        <a-radio-button value="default">
          {{ capitalize($t("send message")) }}
        </a-radio-button>
      </a-radio-group>

      <a-radio-group v-else v-model:value="sendAdvancedOptions.checked">
        <a-radio-button value="default">
          {{ capitalize($t("openai.actions.generate_text")) }}
        </a-radio-button>
        <a-radio-button value="speech">
          {{ capitalize($t("openai.actions.generate_audio")) }}
        </a-radio-button>
        <a-radio-button value="generate">
          {{ capitalize($t("openai.actions.generate_image")) }}
        </a-radio-button>
        <a-radio-button value="video">
          {{ capitalize($t("openai.actions.generate_video")) }}
        </a-radio-button>
      </a-radio-group>
      <a-select
        style="min-width: 200px"
        v-if="
          sendAdvancedOptions.checked === 'speech' &&
          instanceAudioModels.length > 1
        "
        v-model:value="sendAdvancedOptions.model"
        :options="instanceAudioModels"
      />

      <a-select
        style="min-width: 220px"
        v-if="
          sendAdvancedOptions.checked === 'generate' &&
          instanceImageModels.length > 1
        "
        v-model:value="sendAdvancedOptions.model"
        :options="instanceImageModels"
      />

      <a-select
        style="min-width: 120px"
        v-if="sendAdvancedOptions.checked === 'generate'"
        v-model:value="sendAdvancedOptions.size"
        :options="instanceImageSizes"
      />
      <a-select
        style="min-width: 100px"
        v-if="sendAdvancedOptions.checked === 'generate'"
        v-model:value="sendAdvancedOptions.quality"
        :options="instanceImageQualitys"
      />
    </div>

    <send-input
      :disabled="!message.trim()"
      :send-loading="isSendMessageLoading"
      :editing="editing"
      @update:editing="editing = $event"
      :message="message"
      @update:message="message = $event"
      :replies="replies"
      @send-message="sendMessage"
      :file-list="fileList"
      @update:filelist="fileList = $event"
      ref="sendinput"
    />

    <a-modal
      :open="sendAdvancedOptions.checked === 'video'"
      :title="$t('openai.actions.generate_video_confirm')"
      @cancel="sendAdvancedOptions.checked = 'default'"
    >
      <a-form layout="vertical" autocomplete="off">
        <a-form-item :label="$t('openai.videos_properties.promt')">
          <a-textarea
            v-model:value="message"
            type="text"
            :auto-size="{ minRows: 3, maxRows: 5 }"
            :placeholder="$t('openai.videos_properties.promt')"
          />
        </a-form-item>

        <a-form-item :label="capitalize($t('openai.videos_properties.model'))">
          <a-select
            v-if="instanceVideoModels.length > 1"
            v-model:value="sendAdvancedOptions.model"
            :options="instanceVideoModels"
          />
        </a-form-item>

        <a-form-item :label="$t('openai.videos_properties.duration')">
          <a-input-number
            style="width: 100%"
            :value="sendAdvancedOptions.duration"
            @update:value="
              sendAdvancedOptions.duration = $event || videoDurationRange.min
            "
            :min="videoDurationRange.min"
            :max="videoDurationRange.max"
          />
        </a-form-item>

        <a-form-item :label="$t('openai.videos_properties.aspect_ratio')">
          <a-select
            v-model:value="sendAdvancedOptions.aspect_ratio"
            :options="videoAspectRatios"
          />
        </a-form-item>

        <a-form-item :label="$t('openai.videos_properties.with_audio')">
          <a-switch
            :disabled="!isAudioEnabled"
            v-model:checked="sendAdvancedOptions.with_audio"
          />
        </a-form-item>
      </a-form>

      <div style="display: flex; justify-content: center; margin-bottom: 10px">
        <span
          style="font-size: 1rem; text-align: center"
          v-html="
            marked(
              $t('openai.labels.videos_price_tip', {
                perSecond: `${formatPrice(
                  (convertedVideoPrices.get(sendAdvancedOptions.model) || 0) /
                    60
                )}
        ${currency.title}`,
                total: `${formatPrice(
                  ((convertedVideoPrices.get(sendAdvancedOptions.model) || 0) /
                    60) *
                    sendAdvancedOptions.duration
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
          @click="sendAdvancedOptions.checked = 'default'"
          >{{ $t("Cancel") }}</a-button
        >

        <a-button
          :loading="isSendMessageLoading"
          key="submit"
          type="primary"
          @click="sendMessage"
          >{{ $t("openai.actions.generate_video_confirm") }}</a-button
        >
      </template>
    </a-modal>
  </div>
</template>

<script setup>
import { capitalize, computed, nextTick, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import markdown from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import SendInput from "../chats/sendInput.vue";
import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useCurrency, useNotification } from "@/hooks/utils";
import { toDate } from "@/functions.js";
import { storeToRefs } from "pinia";
import { useCurrenciesStore } from "@/stores/currencies";
import { marked } from "marked";

const md = markdown({
  html: true,
  linkify: true,
  typographer: true,
});
md.use(emoji);

const props = defineProps({
  ticket: { type: Object, default: () => ({}) },
  replies: { type: Array, required: true },
  instance: { type: Object, default: () => null },
});
const emits = defineEmits(["update:replies"]);

const route = useRoute();
const i18n = useI18n();
const { currency, formatPrice } = useCurrency();

const authStore = useAuthStore();
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);
const { openNotification } = useNotification();
const currenciesStore = useCurrenciesStore();

const convertedVideoPrices = ref(new Map());

const sendinput = ref();
const fileList = ref([]);
const message = ref("");
const isSendMessageLoading = ref(false);
const editing = ref(null);

const sendAdvancedOptions = reactive({
  checked: "default",
  size: "1024x1024",
  quality: "standard",
  model: "",
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
      label: `${capitalize(i18n.t("model"))}: ${model.name}`,
    }))
);

const instanceImageModels = computed(() =>
  instanceModels.value
    .filter((model) => (model.types || []).includes("image"))
    .map((model) => ({
      value: model.key,
      label: `${capitalize(i18n.t("model"))}: ${model.name}`,
    }))
);

const instanceVideoModels = computed(() =>
  instanceModels.value
    .filter((model) => (model.types || []).includes("video"))
    .map((model) => ({
      value: model.key,
      label: `${capitalize(i18n.t("model"))}: ${model.name}`,
    }))
);

const videoRequestParameters = computed(() => {
  if (sendAdvancedOptions.checked === "video" && sendAdvancedOptions.model) {
    const fullModel = instanceModels.value.find(
      ({ key }) => key === sendAdvancedOptions.model
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
  if (sendAdvancedOptions.checked !== "generate") {
    return [];
  }

  const model = instanceModels.value.find(
    (model) => model.key === sendAdvancedOptions.model
  );

  if (!model) {
    return [];
  }

  return Object.keys(model.billing.images.res_to_quality).map((v) => ({
    value: v,
    label: v,
  }));
});

const instanceImageQualitys = computed(() => {
  if (sendAdvancedOptions.checked !== "generate") {
    return [];
  }

  const model = instanceModels.value.find(
    (model) => model.key === sendAdvancedOptions.model
  );

  if (
    !model ||
    !model.billing.images.res_to_quality[sendAdvancedOptions.size]
  ) {
    return [];
  }

  return Object.keys(
    model.billing.images.res_to_quality[sendAdvancedOptions.size]
  ).map((v) => ({
    value: v,
    label: i18n.t(`openai.images_quality.${v}`),
  }));
});

function updateReplies() {
  const result = {
    admin: "",
    attachment: "",
    contactid: "0",
    date: Date.now(),
    email: authStore.userdata.data?.email ?? "none",
    message: beautufyMessage(md, message.value),
    name: authStore.userdata.title,
    userid: authStore.userdata.uuid,
    sending: true,
  };

  const date = toDate(result.date / 1000, "-", true, true);
  const replies = [...props.replies];
  const { from } = route.query;

  replies.push({ ...result, date, from, requestor_type: "Owner" });
  emits("update:replies", replies);

  return { replies, result };
}

async function sendChatMessage(result, replies) {
  await nextTick();

  isSendMessageLoading.value = true;

  try {
    const files = await sendinput.value.sendFiles();
    const message = {
      uuid: route.params.id,
      content: result.message,
      account: result.userid,
      date: BigInt(result.date),
      attachments: files.map(({ uuid }) => uuid),
      meta: [{ key: "mode", value: sendAdvancedOptions.checked }],
    };

    if (sendAdvancedOptions.checked === "generate") {
      message.meta.push(
        { key: "size", value: sendAdvancedOptions.size },
        { key: "quality", value: sendAdvancedOptions.quality }
      );
    }

    if (sendAdvancedOptions.checked === "video") {
      message.meta.push(
        { key: "duration", value: sendAdvancedOptions.duration },
        { key: "with_audio", value: sendAdvancedOptions.with_audio },
        { key: "aspect_ratio", value: sendAdvancedOptions.aspect_ratio }
      );
    }

    if (sendAdvancedOptions.checked !== "default") {
      message.meta.push({ key: "model", value: sendAdvancedOptions.model });
    }
    sendAdvancedOptions.checked = "default";

    const { uuid } = await chatsStore.sendMessage(message);

    replies[replies.length - 1].uuid = uuid;
    emits("update:replies", replies);
  } catch (error) {
    replies[replies.length - 1].error = true;
    emits("update:replies", replies);
  } finally {
    isSendMessageLoading.value = false;
  }
}

async function sendMessage() {
  if (message.value.trim().length < 1) return;
  if (editing.value) {
    editMessage(editing.value);
    return;
  }

  const { replies, result } = updateReplies();
  await sendChatMessage(result, replies);

  message.value = "";
  fileList = [];
}

function editMessage(uuid) {
  chatsStore
    .editMessage({
      content: message.value,
      uuid,
    })
    .catch((err) => {
      const message = err.response?.data?.message ?? err.message;

      openNotification("error", { message: i18n.t(message) });
      console.error(err);
    });

  editing.value = null;
  message.value = "";
}

watch(
  () => sendAdvancedOptions.checked,
  (v) => {
    if (v === "default") {
      return;
    }

    if (v === "generate") {
      sendAdvancedOptions.model = instanceImageModels.value[0]?.value;
    } else if (v === "audio") {
      sendAdvancedOptions.model = instanceAudioModels.value[0]?.value;
    } else {
      sendAdvancedOptions.model = instanceVideoModels.value[0]?.value;
    }
  }
);

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

watch(instanceImageQualitys, (v) => {
  sendAdvancedOptions.quality = v[0]?.value;
});
watch(instanceImageSizes, (v) => {
  sendAdvancedOptions.size = v[0]?.value;
});

watch(videoRequestParameters, () => {
  if (videoAspectRatios.value.length) {
    sendAdvancedOptions.aspect_ratio = videoAspectRatios.value[0].value;
  }
  sendAdvancedOptions.duration = videoDurationRange.value.min;
  if (!isAudioEnabled.value) {
    sendAdvancedOptions.with_audio = false;
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
</script>

<script>
export default { name: "SupportFooter" };
</script>

<style scoped>
.chat__generate {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  grid-column: 1 / 4;
  justify-self: start;
  border-color: var(--border_color);
}

.chat__generate :deep(.ant-radio-button-wrapper),
.chat__generate :deep(.ant-select-selector) {
  border-color: var(--border_color);
}

.chat__generate :deep(.ant-radio-button-wrapper-checked),
.chat__generate :deep(.ant-select-selector-checked) {
  border-color: var(--main);
}

.chat__input {
  max-width: 725px;
  border: 0;
  outline: 0;
  border-radius: 40px;
  flex: 1 0;
  padding: 7px 0;
}

.chat__input textarea {
  max-height: calc(50vh - 34px) !important;
}

.chat__input :deep(.ant-input-textarea-clear-icon) {
  margin: 9px 2px 0 0;
}

:deep(textarea.ant-input) {
  border-color: var(--border_color);
}

.chat__send {
  background-color: var(--main);
  color: var(--gloomy_font);
  border-radius: 50%;
  height: 35px;
  width: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  margin-bottom: 10px;
  font-size: 1.2rem;
  transition: filter 0.2s ease;
  cursor: pointer;
}

.chat__send:hover {
  filter: brightness(1.05);
}

.chat__send:active {
  filter: brightness(0.95);
}
</style>
