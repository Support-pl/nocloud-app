<template>
  <div style="padding-bottom: 10px">
    <send-input
      :send-loading="isSendMessageLoading"
      :message="message"
      @update:message="message = $event"
      :replies="messages"
      @send-message="sendChatMessage"
      :file-list="fileList"
      @update:filelist="fileList = $event"
      ref="sendinput"
    />
  </div>
</template>

<script setup>
import { nextTick, ref } from "vue";
import { useAiBotsStore } from "@/stores/aiBots";
import { useNotification } from "@/hooks/utils";
import SendInput from "@/components/chats/sendInput.vue";

const props = defineProps({
  chat: { type: Object },
  messages: { type: Array, required: true },
});
const emits = defineEmits(["update:messages"]);

const aiBotsStore = useAiBotsStore();

const { openNotification } = useNotification();

const message = ref("");
const isSendMessageLoading = ref(false);
const fileList = ref([]);

async function sendChatMessage() {
  await nextTick();

  const files = fileList.value;

  const result = message.value.trim();
  if (result.length < 1 && !files.length) {
    return;
  }

  isSendMessageLoading.value = true;

  try {
    const data = {
      text: result,
      files: files.map((f) => ({
        data: f.preview,
        filename: f.name,
      })),
    };

    await aiBotsStore.sendMessage(data, props.chat.id);
    emits("update:messages", props.messages);
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isSendMessageLoading.value = false;
    message.value = "";
    fileList.value = [];
  }
}

defineExpose({ message, sendChatMessage });
</script>

<script>
export default { name: "AiBotFooter" };
</script>

<style scoped></style>
