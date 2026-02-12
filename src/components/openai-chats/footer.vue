<template>
  <div style="position: relative">
    <div class="chat__footer_contaner">
      <div class="chat__footer">
        <send-input
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
          :placeholder="
            $t(`openai.prompts.${sendAdvancedOptions.checked}.placeholder`)
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
import { nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import SendInput from "../chats/sendInput.vue";
import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useNotification } from "@/hooks/utils";
import { beautufyMessage, toDate } from "@/functions.js";
import ChatGenerationMenu from "./chatGenerationMenu.vue";
import markdown from "markdown-it";
import { full as emoji } from "markdown-it-emoji";

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

const authStore = useAuthStore();
const chatsStore = useChatsStore();
const { openNotification } = useNotification();

const sendinput = ref();
const fileList = ref([]);
const message = ref("");
const isSendMessageLoading = ref(false);
const editing = ref(null);

const sendAdvancedOptions = ref({
  checked: "default",
  size: "1024x1024",
  quality: "standard",
  model: "",
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
    const files = await chatsStore.sendChatFiles(
      fileList.value,
      props.ticket.uuid
    );
    const message = {
      uuid: props.ticket.uuid,
      content: result.message,
      account: result.userid,
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
      message.meta.push({
        key: "model",
        value: sendAdvancedOptions.value.model,
      });
    }
    sendAdvancedOptions.value.checked = "default";

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

  const { replies, result } = updateReplies();
  await sendChatMessage(result, replies);

  message.value = "";
  fileList.value = [];
  editing.value = null;
}

function changeEditing(d) {
  sendinput.value.changeEditing(d);
}

defineExpose({ changeEditing });
</script>

<script>
export default { name: "ChatsFooter" };
</script>

<style scoped>
.chat__footer {
  padding-top: 5px;
  padding-bottom: 10px;
  max-width: 900px;
  width: 100%;
  background-color: var(--bright_bg);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: filter 0.3s ease, box-shadow 0.3s ease;
  padding: 16px;
  margin-bottom: 10px;
}

.chat__footer_contaner {
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 0px;
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
