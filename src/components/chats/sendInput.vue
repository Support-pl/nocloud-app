<template>
  <div class="send_input_container">
    <div class="send_input">
      <a-tag
        v-if="editing"
        closable
        color="blue"
        class="chat__tag"
        @close="changeEditing"
      >
        <span style="margin-bottom: 7px">{{ capitalize(t("editing")) }}:</span>
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

      <div style="position: relative; width: 100%">
        <a-textarea
          ref="textarea"
          class="chat__input_textarea"
          :value="message"
          @update:value="emits('update:message', $event)"
          allow-clear
          type="text"
          :disabled="disabled"
          :auto-size="{ minRows: minRows, maxRows: 10 }"
          :placeholder="placeholder ? placeholder : t('message') + '...'"
          @keyup.shift.enter.exact="newLine"
          @keydown.enter.exact.prevent="emits('sendMessage')"
          @paste="handlePaste"
        />

        <div
          :style="{
            position: 'absolute',
            bottom: fileList.length > 0 ? '110px' : '5px',
            right: '5px',
            'z-index': '100',
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
          }"
        >
          <div style="margin-left: 10px">
            <slot name="right-menu" />
          </div>

          <div style="min-width: 85px; display: flex; align-items: center">
            <a-tooltip v-if="showMic" :title="recording ? t('openai.actions.stop_record') : t('openai.actions.voice')">
              <a-button
                size="large"
                shape="circle"
                :type="recording ? 'primary' : 'default'"
                :danger="recording"
                :disabled="disabled || generating"
                @click="emits('toggleMic')"
              >
                <template #icon>
                  <audio-icon />
                </template>
              </a-button>
            </a-tooltip>

            <upload-files
              v-if="showSendFiles"
              ref="upload"
              :editing="editing"
              :replies="replies"
              :file-list="fileList"
              @update:file-list="emits('update:filelist', $event)"
            />

            <a-button
              size="large"
              :loading="sendLoading && !generating"
              type="primary"
              :danger="generating"
              shape="circle"
              @click="generating ? emits('stop') : emits('sendMessage')"
              style="margin-left: 10px"
            >
              <template #icon>
                <stop-icon v-if="generating" />
                <arrow-up-icon v-else />
              </template>
            </a-button>
          </div>
        </div>

        <files-preview
          :file-list="fileList"
          @update:file-list="emits('update:filelist', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { capitalize, computed, defineAsyncComponent, ref } from "vue";
import UploadFiles from "./uploadFiles.vue";
import FilesPreview from "./filesPreview.vue";
import { useI18n } from "vue-i18n";

const arrowUpIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ArrowUpOutlined")
);
const stopIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/BorderOutlined")
);
const audioIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/AudioOutlined")
);

const props = defineProps({
  replies: { type: Array, required: true },
  sendLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  message: { type: String, default: false },
  editing: { type: Boolean, default: false },
  fileList: { type: Array, required: true },
  placeholder: { type: String, required: false },
  minRows: { type: Number, default: 2 },
  generating: { type: Boolean, default: false },
  recording: { type: Boolean, default: false },
  showMic: { type: Boolean, default: false },
});

const emits = defineEmits([
  "update:replies",
  "sendMessage",
  "update:message",
  "update:editing",
  "update:filelist",
  "stop",
  "toggleMic",
]);

const { t } = useI18n();

const upload = ref();
const textarea = ref();
const showSendFiles = computed(() => globalThis.VUE_APP_S3_BUCKET);

function newLine() {
  emits("update:message", props.message.replace(/$/, "\n"));
}

function changeEditing(reply = {}) {
  emits("update:editing", reply.uuid ?? null);
  emits(
    "update:message",
    reply.message?.replace(
      /<div class="chat__files">[\s\S]{1,}<\/div>$/g,
      ""
    ) ?? ""
  );
  textarea.value.focus();
}

function getMessage(uuid) {
  const result = props.replies?.find((reply) => reply.uuid === uuid)?.message;

  return result.replace(/<div class="chat__files">[\s\S]{1,}<\/div>$/g, "");
}

async function handlePaste(event) {
  const items = event.clipboardData?.items;
  if (!items) return;

  const newFiles = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].kind !== "file") continue;
    const file = items[i].getAsFile();
    if (!file) continue;
    if (items[i].type.includes("image")) {
      await setPreview(file);
    }
    newFiles.push(file);
  }

  if (newFiles.length > 0) {
    emits("update:filelist", [...props.fileList, ...newFiles]);
    event.preventDefault();
  }
}

async function setPreview(file) {
  file.preview = await getBase64(file);
}

function getBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
  });
}

defineExpose({ changeEditing });
</script>

<script>
export default { name: "SendInput" };
</script>

<style scoped>
.chat__tag {
  display: grid;
  padding: 5px 7px;
  margin-right: auto;
  font-size: 18px;
}

:deep(.chat__input_textarea) {
  padding-bottom: 45px;
}
</style>
