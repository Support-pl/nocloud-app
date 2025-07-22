<template>
  <send-input
    :disabled="['Closed', 3].includes(status)"
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
</template>

<script setup>
import { nextTick, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import markdown from "markdown-it";
import { full as emoji } from "markdown-it-emoji";

import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import SendInput from "../chats/sendInput.vue";

import { useNotification } from "@/hooks/utils";
import { beautufyMessage, toDate } from "@/functions.js";
import api from "@/api.js";

const md = markdown({
  html: true,
  linkify: true,
  typographer: true,
});
md.use(emoji);

const props = defineProps({
  ticket: { type: Object, default: () => ({}) },
  replies: { type: Array, required: true },
  status: { type: [String, Number], default: "Unknown" },
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

const sendFiles = async () => {
  for await (const file of fileList.value) {
    if (file.uuid) continue;

    const { uuid, object_id: objectId } = await api.put("/attachments", {
      title: file.name,
      chat: route.params.id,
    });
    await fetch(objectId, { method: "PUT", body: file });

    const { url } = await api.get(`/attachments/${uuid}`);
    file.url = `https://${url}`;
    file.uuid = uuid;
  }

  return fileList.value;
};

async function sendChatMessage(result, replies) {
  await nextTick();

  isSendMessageLoading.value = true;

  try {
    const files = await sendFiles();
    const message = {
      uuid: route.params.id,
      content: result.message,
      account: result.userid,
      date: BigInt(result.date),
      attachments: files.map(({ uuid }) => uuid),
      meta: [{ key: "mode", value: "default" }],
    };

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
  fileList.value = [];
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

function changeEditing(d) {
  sendinput.value.changeEditing(d);
}

defineExpose({ changeEditing });
</script>

<script>
export default { name: "SupportFooter" };
</script>

<style scoped></style>
