<template>
  <div class="chat__footer">
    <div class="chat__container footer__container">
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
          @keydown.enter.exact.prevent="sendChatMessage"
        />

        <upload-files
          v-if="showSendFiles"
          ref="upload"
          :editing="false"
          :replies="[]"
        />
      </div>
      <a-button
        size="large"
        :loading="isSendMessageLoading"
        type="primary"
        shape="circle"
        @click="sendChatMessage"
      >
        <template #icon>
          <arrow-up-icon />
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, ref } from "vue";
import markdown from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import { useAiBotsStore } from "@/stores/aiBots";
import UploadFiles from "@/components/support/upload.vue";

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
  chat: { type: Object, default: () => ({}) },
  messages: { type: Array, required: true },
});
const emits = defineEmits(["update:messages"]);

const aiBotsStore = useAiBotsStore();

const textarea = ref();
const upload = ref();
const message = ref("");
const isSendMessageLoading = ref(false);
const showSendFiles = computed(() => globalThis.VUE_APP_S3_BUCKET);

const columnsStyle = computed(() =>
  showSendFiles.value ? "1fr auto auto" : "1fr auto"
);

function newLine() {
  message.value.replace(/$/, "\n");
}

async function sendChatMessage() {
  await nextTick();

  const files = await upload.value.fileList;

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
  } catch (error) {
    console.log(error);
  } finally {
    isSendMessageLoading.value = false;
    message.value = "";
    upload.value.fileList = [];
  }
}

const tagGridColumn = computed(() => (showSendFiles.value ? "1 / 4" : "1 / 3"));

defineExpose({ message, sendChatMessage });
</script>

<script>
export default { name: "AiBotFooter" };
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

.chat__container.footer__container {
  grid-template-columns: v-bind("columnsStyle");
  align-items: start;
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

.chat__footer {
  padding: 5px;
}
</style>
