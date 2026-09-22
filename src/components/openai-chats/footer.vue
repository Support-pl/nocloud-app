<template>
  <div style="position: relative">
    <div class="chat__footer_contaner">
      <div class="chat__footer">
        <send-input
          :send-loading="isSendMessageLoading"
          :generating="isGenerating"
          :recording="isRecording"
          show-mic
          :editing="editing"
          @update:editing="editing = $event"
          :message="message"
          @update:message="message = $event"
          :replies="replies"
          @send-message="sendMessage"
          @stop="stopGeneration"
          @toggle-mic="toggleMic"
          :file-list="fileList"
          @update:filelist="fileList = $event"
          ref="sendinput"
          :placeholder="composerPlaceholder"
        >
          <template #right-menu>
            <chat-generation-menu
              :options="sendAdvancedOptions"
              @update:options="sendAdvancedOptions[$event.key] = $event.value"
              :is-send-message-loading="isSendMessageLoading || isGenerating"
            />
          </template>
        </send-input>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import SendInput from "../chats/sendInput.vue";
import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useNotification } from "@/hooks/utils";
import { beautufyMessage, toDate } from "@/functions.js";
import ChatGenerationMenu from "./chatGenerationMenu.vue";
import { buildMessageMeta } from "./helpers.js";
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
const isRecording = ref(false);

const sendAdvancedOptions = ref({
  checked: "default",
  size: "1024x1024",
  quality: "standard",
  model: "",
});

let mediaRecorder = null;
let recordedChunks = [];

const isGenerating = computed(() =>
  chatsStore.isChatGenerating(props.ticket?.uuid)
);

const composerPlaceholder = computed(() => {
  if (isRecording.value) {
    return i18n.t("openai.prompts.transcribe.recording");
  }
  return i18n.t(`openai.prompts.${sendAdvancedOptions.value.checked}.placeholder`);
});

function updateReplies(content) {
  const result = {
    admin: "",
    attachment: "",
    contactid: "0",
    date: Date.now(),
    email: authStore.userdata.data?.email ?? "none",
    message: content,
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

async function sendChatMessage(result, replies, extraMeta = []) {
  await nextTick();

  isSendMessageLoading.value = true;

  try {
    const files = await chatsStore.sendChatFiles(
      fileList.value,
      props.ticket.uuid
    );
    const payload = {
      uuid: props.ticket.uuid,
      content: result.message,
      account: result.userid,
      date: BigInt(result.date),
      attachments: files.map(({ uuid }) => uuid),
      meta: buildMessageMeta(sendAdvancedOptions.value, [
        { key: "speak_reply", value: chatsStore.speakReplies },
        ...extraMeta,
      ]),
    };

    sendAdvancedOptions.value.checked = "default";

    const { uuid } = await chatsStore.sendMessage(payload);

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
  if (isGenerating.value) {
    await stopGeneration();
    return;
  }

  const text = message.value.trim();
  if (text.length < 1 && fileList.value.length < 1) return;

  if (editing.value) {
    await applyEditAndRegenerate(editing.value, text);
    return;
  }

  const content = beautufyMessage(md, text || " ");
  const { replies, result } = updateReplies(content);
  await sendChatMessage(result, replies);

  message.value = "";
  fileList.value = [];
  editing.value = null;
}

async function applyEditAndRegenerate(uuid, text) {
  isSendMessageLoading.value = true;
  try {
    const content = beautufyMessage(md, text);
    await chatsStore.editMessage({ uuid, content });

    const replies = props.replies.map((reply) =>
      reply.uuid === uuid ? { ...reply, message: content } : reply
    );
    emits("update:replies", replies);

    await chatsStore.sendMessage({
      uuid: props.ticket.uuid,
      content: " ",
      account: authStore.userdata.uuid,
      date: BigInt(Date.now()),
      attachments: [],
      meta: [
        { key: "mode", value: "regenerate" },
        { key: "from", value: uuid },
        { key: "hidden", value: true },
        { key: "speak_reply", value: chatsStore.speakReplies },
      ],
    });

    message.value = "";
    editing.value = null;
  } catch (error) {
    openNotification("error", {
      message: error.message || i18n.t("openai.errors.create_failed"),
    });
  } finally {
    isSendMessageLoading.value = false;
  }
}

async function regenerateFrom(reply) {
  const replies = props.replies;
  const index = replies.findIndex((item) => item.uuid === reply.uuid);
  const previousUser = [...replies]
    .slice(0, index === -1 ? replies.length : index)
    .reverse()
    .find((item) => item.userid === authStore.userdata.uuid);

  if (!previousUser) return;

    await chatsStore.sendMessage({
      uuid: props.ticket.uuid,
      content: " ",
      account: authStore.userdata.uuid,
      date: BigInt(Date.now()),
      attachments: [],
      meta: [
        { key: "mode", value: "regenerate" },
        { key: "from", value: previousUser.uuid },
        { key: "hidden", value: true },
        { key: "speak_reply", value: chatsStore.speakReplies },
      ],
    });
}

async function stopGeneration() {
  if (!props.ticket?.uuid) return;
  try {
    await chatsStore.stopGeneration(props.ticket.uuid);
  } catch (error) {
    openNotification("error", { message: error.message });
  }
}

async function toggleMic() {
  if (isRecording.value) {
    mediaRecorder?.stop();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      isRecording.value = false;
      const blob = new Blob(recordedChunks, {
        type: mediaRecorder?.mimeType || "audio/webm",
      });
      if (blob.size < 1) return;
      const file = new File([blob], "voice.webm", { type: blob.type });
      await sendVoice(file);
    };
    mediaRecorder.start();
    isRecording.value = true;
  } catch (error) {
    openNotification("error", {
      message: i18n.t("openai.errors.microphone"),
    });
  }
}

async function sendVoice(file) {
  fileList.value = [file];
  const content = beautufyMessage(md, i18n.t("openai.labels.voice_message"));
  const { replies, result } = updateReplies(content);
  await sendChatMessage(result, replies, [
    { key: "mode", value: "transcribe" },
  ]);
  message.value = "";
  fileList.value = [];
}

function changeEditing(d) {
  sendinput.value.changeEditing(d);
}

function setMessage(value) {
  message.value = value;
}

onBeforeUnmount(() => {
  if (isRecording.value) {
    mediaRecorder?.stop();
  }
});

defineExpose({
  changeEditing,
  sendMessage,
  setMessage,
  stopGeneration,
  regenerateFrom,
});
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
