<template>
  <div style="width: 100%">
    <div style="display: flex; justify-content: center">
      <span style="font-size: 1.5rem; font-weight: 500; margin-bottom: 15px">{{
        t("openai.labels.create_label")
      }}</span>
    </div>

    <a-collapse
      style="max-width: 900px; margin: auto; background: var(--bright_font)"
    >
      <a-collapse-panel key="1">
        <template #header>
          <div style="display: flex; align-items: center">
            <span>
              {{
                `${t("openai.default_model.label")}: ${
                  chatsStore.globalModelsList.find(
                    (m) => m.key === selectedModel
                  )?.name || selectedModel
                } `
              }}
            </span>

            <a-tooltip>
              <template #title>
                <span v-html="t(`openai.default_model.tip`)" />
              </template>
              <help-icon style="font-size: 19px; margin-left: 5px" />
            </a-tooltip>
          </div>
        </template>
        <openai-prices
          :selected-model="selectedModel"
          @update:selectedModel="selectedModel = $event"
          :selected-provider="selectedProvider"
          @update:selectedProvider="selectedProvider = $event"
          :selected-type="selectedType"
          @update:selectedType="selectedType = $event"
          only-public
          :filter-by-types="['text']"
        />
      </a-collapse-panel>
    </a-collapse>

    <div class="chat__footer_contaner">
      <div class="chat__footer">
        <send-input
          :send-loading="isSendMessageLoading"
          :editing="editing"
          @update:editing="editing = $event"
          :message="message"
          @update:message="message = $event"
          :replies="[]"
          @send-message="createChatAndRedirect"
          :file-list="fileList"
          @update:filelist="fileList = $event"
          :min-rows="6"
          ref="sendinput"
          :placeholder="
            t(`openai.prompts.${sendAdvancedOptions.checked}.placeholder`)
          "
        >
          <template #right-menu>
            <chat-generation-menu
              :options="sendAdvancedOptions"
              @update:options="sendAdvancedOptions[$event.key] = $event.value"
              :is-send-message-loading="isSendMessageLoading"
            />
          </template>
        </send-input>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import SendInput from "../chats/sendInput.vue";
import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useNotification } from "@/hooks/utils";
import { beautufyMessage } from "@/functions.js";
import ChatGenerationMenu from "./chatGenerationMenu.vue";
import OpenaiPrices from "../services/openai/prices.vue";
import markdown from "markdown-it";
import { full as emoji } from "markdown-it-emoji";

const helpIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/QuestionCircleOutlined")
);

const md = markdown({
  html: true,
  linkify: true,
  typographer: true,
});

md.use(emoji);

const props = defineProps({
  ticket: { type: Object, default: () => ({}) },
  instance: { type: Object, default: () => null },
});

const router = useRouter();
const { t } = useI18n();

const authStore = useAuthStore();
const chatsStore = useChatsStore();
const { openNotification } = useNotification();

const sendinput = ref();
const fileList = ref([]);
const message = ref("");
const isSendMessageLoading = ref(false);
const editing = ref(null);

const selectedModel = ref("gpt-4o-mini");
const selectedProvider = ref("openai");
const selectedType = ref("text");

const sendAdvancedOptions = ref({
  checked: "default",
  size: "1024x1024",
  quality: "standard",
  model: "",
});

async function sendChatMessage(result, chatId) {
  await nextTick();

  const files = await chatsStore.sendChatFiles(fileList.value, chatId);
  const message = {
    uuid: chatId,
    content: result.message,
    account: authStore.userdata.uuid,
    date: BigInt(result.date),
    attachments: files.map(({ uuid }) => uuid),
    meta: [{ key: "mode", value: sendAdvancedOptions.value.checked }],
  };

  if (sendAdvancedOptions.value.checked === "generate") {
    message.meta.push(
      { key: "size", value: sendAdvancedOptions.value.size },
      { key: "quality", value: sendAdvancedOptions.value.quality }
    );
  }

  if (sendAdvancedOptions.value.checked === "video") {
    message.meta.push(
      { key: "duration", value: sendAdvancedOptions.value.duration },
      { key: "with_audio", value: sendAdvancedOptions.value.with_audio },
      { key: "aspect_ratio", value: sendAdvancedOptions.value.aspect_ratio }
    );
  }

  if (sendAdvancedOptions.value.checked !== "default") {
    message.meta.push({ key: "model", value: sendAdvancedOptions.value.model });
  }
  sendAdvancedOptions.value.checked = "default";

  await chatsStore.sendMessage(message);
}

async function createChat(message) {
  const { admins } =
    chatsStore.defaults.departments.find(({ key }) => key === "openai") ?? {};

  const response = await chatsStore.createChat({
    gateways: [],
    admins: admins,
    department: "openai",
    chat: {
      message,
      subject: null,
      meta: [
        { key: "instance", value: props.instance?.uuid || null },
        { key: "model", value: selectedModel.value },
      ].filter((v) => !!v),
    },
  });

  if (!response || !response.uuid) {
    throw new Error(t("openai.errors.create_failed"));
  }

  return response;
}

const createChatAndRedirect = async () => {
  let firstMessage = message.value.trim();
  if (!firstMessage) return;

  isSendMessageLoading.value = true;
  try {
    firstMessage = beautufyMessage(md, firstMessage);

    const result = {
      admin: "",
      attachment: "",
      contactid: "0",
      date: Date.now(),
      email: authStore.userdata.data?.email ?? "none",
      message: firstMessage,
      name: authStore.userdata.title,
      userid: authStore.userdata.uuid,
      sending: true,
    };

    const response = await createChat(firstMessage);
    if (response.result === "error") {
      openNotification("error", { message: response.error.message });
      return;
    }

    await sendChatMessage(result, response.uuid);

    const chatId = response.uuid;
    const instanceId = props.instance?.uuid || null;

    router.push(`/openai/chats/${instanceId}/${chatId}`);

    message.value = "";
    fileList.value = [];
  } catch (error) {
    console.log(error);

    openNotification("error", {
      message: t("openai.errors.create_failed"),
    });
  } finally {
    isSendMessageLoading.value = false;
  }
};
</script>

<script>
export default { name: "SupportFooter" };
</script>

<style scoped>
.chat__footer {
  padding-top: 5px;
  padding-bottom: 10px;
  max-width: 900px;
  width: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: filter 0.3s ease, box-shadow 0.3s ease;
  padding: 16px;
  margin-bottom: 10px;
  width: 100%;
  background: var(--bright_font);
}

.chat__footer_contaner {
  display: flex;
  justify-content: center;
  width: 100%;
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
