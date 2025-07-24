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

      <div style="position: relative; width: 100%">
        <a-textarea
          ref="textarea"
          :value="message"
          @update:value="emits('update:message', $event)"
          allow-clear
          type="text"
          :disabled="disabled"
          :auto-size="{ minRows: 3, maxRows: 100 }"
          :placeholder="$t('message') + '...'"
          @keyup.shift.enter.exact="newLine"
          @keydown.enter.exact.prevent="emits('sendMessage')"
        />

        <div
          :style="{
            position: 'absolute',
            bottom: fileList.length > 0 ? '110px' : '5px',
            right: '5px',
            'z-index': '100',
          }"
        >
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
            :loading="sendLoading"
            type="primary"
            shape="circle"
            @click="emits('sendMessage')"
            style="margin-left: 10px"
          >
            <template #icon>
              <arrow-up-icon />
            </template>
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { capitalize, computed, defineAsyncComponent, ref } from "vue";
import UploadFiles from "./uploadFiles.vue";

const arrowUpIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ArrowUpOutlined")
);

const props = defineProps({
  replies: { type: Array, required: true },
  sendLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  message: { type: String, default: false },
  editing: { type: Boolean, default: false },
  fileList: { type: Array, required: true },
});

const emits = defineEmits([
  "update:replies",
  "sendMessage",
  "update:message",
  "update:editing",
  "update:filelist",
]);

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

defineExpose({ changeEditing });
</script>

<script>
export default { name: "SupportFooter" };
</script>

<style scoped>
.chat__tag {
  display: grid;
  padding: 5px 7px;
  margin-right: auto;
  font-size: 18px;
}
</style>
