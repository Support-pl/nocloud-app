<template>
  <div class="chat__footer">
    <div class="chat__container footer__container">
      <a-tag
        v-if="editing"
        closable
        color="blue"
        class="chat__tag"
        @close="changeEditing"
      >
        <span style="margin-bottom: 7px">{{ capitalize($t("editing")) }}:</span>
        <span
          style="
            font-size: 14px;
            grid-column: 1 / 3;
            order: 1;
            white-space: normal;
          "
        >
          {{ getMessage(editing) }}
        </span>
      </a-tag>

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

      <div style="position: relative; width: 100%">
        <a-textarea
          ref="textarea"
          v-model:value="message"
          allow-clear
          type="text"
          :disabled="['Closed', 3].includes(status)"
          :auto-size="{ minRows: 3, maxRows: 100 }"
          :placeholder="$t('message') + '...'"
          @keyup.shift.enter.exact="newLine"
          @keydown.enter.exact.prevent="sendMessage"
        />

        <upload-files
          v-if="showSendFiles"
          ref="upload"
          :editing="editing"
          :replies="replies"
        />
      </div>
      <div class="chat__send" @click="sendMessage">
        <arrow-up-icon />
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  capitalize,
  computed,
  defineAsyncComponent,
  nextTick,
  reactive,
  ref,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import markdown from "markdown-it";
import { full as emoji } from "markdown-it-emoji";

import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";

import { useNotification } from "@/hooks/utils";
import { toDate } from "@/functions.js";
import api from "@/api.js";

import uploadFiles from "@/components/support/upload.vue";
import { storeToRefs } from "pinia";

const md = markdown({
  html: true,
  linkify: true,
  typographer: true,
});
md.use(emoji);

const arrowUpIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ArrowUpOutlined")
);

const props = defineProps({
  ticket: { type: Object, default: () => ({}) },
  replies: { type: Array, required: true },
  status: { type: [String, Number], default: "Unknown" },
  instance: { type: Object, default: () => null },
});
const emits = defineEmits(["update:replies"]);

const route = useRoute();
const i18n = useI18n();
const authStore = useAuthStore();
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);
const { openNotification } = useNotification();

const upload = ref();
const textarea = ref();
const message = ref("");
const editing = ref(null);
const showSendFiles = computed(() => globalThis.VUE_APP_S3_BUCKET);

const sendAdvancedOptions = reactive({
  checked: "default",
  size: "1024x1024",
  quality: "standard",
  model: "",
});

const columnsStyle = computed(() =>
  showSendFiles.value ? "1fr auto auto" : "1fr auto"
);

function newLine() {
  message.value.replace(/$/, "\n");
}

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
    message: md
      .render(message.value)
      .trim()
      .replace(/^<p>/, "")
      .replace(/<\/p>$/, ""),
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
  try {
    const files = await upload.value.sendFiles();
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

    if (sendAdvancedOptions.checked !== "default") {
      message.meta.push({ key: "model", value: sendAdvancedOptions.model });
    }

    const { uuid } = await chatsStore.sendMessage(message);

    replies[replies.length - 1].uuid = uuid;
    emits("update:replies", replies);
  } catch (error) {
    replies[replies.length - 1].error = true;
    emits("update:replies", replies);
  }
}

async function sendTicket(replies) {
  await nextTick();
  try {
    await api.get(authStore.baseURL, {
      params: {
        run: "answer_ticket",
        id: route.params.id,
        message: message.value,
      },
    });
  } catch (error) {
    replies[replies.length - 1].error = true;
    emits("update:replies", replies);
    console.error(error);
  } finally {
    replies[replies.length - 1].sending = false;
    emits("update:replies", replies);
  }
}

async function sendMessage() {
  if (message.value.trim().length < 1) return;
  if (props.status === "Closed") return;
  if (editing.value) {
    editMessage(editing.value);
    return;
  }

  const { replies, result } = updateReplies();
  if (props.replies[0].gateways) {
    await sendChatMessage(result, replies);
  } else {
    await sendTicket(replies);
  }
  message.value = "";
  upload.value.fileList = [];
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

function changeEditing(reply = {}) {
  editing.value = reply.uuid ?? null;
  message.value =
    reply.message?.replace(
      /<div class="chat__files">[\s\S]{1,}<\/div>$/g,
      ""
    ) ?? "";
  textarea.value.focus();
}

function getMessage(uuid) {
  const result = props.replies?.find((reply) => reply.uuid === uuid)?.message;

  return result.replace(/<div class="chat__files">[\s\S]{1,}<\/div>$/g, "");
}

const tagGridColumn = computed(() => (showSendFiles.value ? "1 / 4" : "1 / 3"));

defineExpose({ message, sendMessage, changeEditing });

watch(
  () => sendAdvancedOptions.checked,
  (v) => {
    if (v === "default") {
      return;
    }

    sendAdvancedOptions.model =
      v === "generate"
        ? instanceImageModels.value[0]?.value
        : instanceAudioModels.value[0]?.value;
  }
);

watch(instanceImageQualitys, (v) => {
  sendAdvancedOptions.quality = v[0]?.value;
});
watch(instanceImageSizes, (v) => {
  sendAdvancedOptions.size = v[0]?.value;
});
</script>

<script>
export default { name: "SupportFooter" };
</script>

<style scoped>
.chat__tag {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-column: v-bind("tagGridColumn");
  padding: 5px 7px;
  margin-right: auto;
  font-size: 18px;
}

.chat__footer {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  grid-column: 2;
  padding: 10px 0;
  background-color: var(--bright_bg);
}

.chat__container.footer__container {
  grid-template-columns: v-bind("columnsStyle");
  align-items: start;
}

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
