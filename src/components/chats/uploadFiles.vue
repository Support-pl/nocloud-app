<template>
  <a-upload
    multiple
    list-type="picture"
    :file-list="fileList"
    :before-upload="beforeUpload"
    :show-upload-list="false"
  >
    <slot>
      <div class="upload__button">
        <a-button shape="circle" :icon="h(uploadIcon)" />
      </div>
    </slot>
  </a-upload>
</template>

<script setup>
import { defineAsyncComponent, watch } from "vue";
import { h } from "vue";

const uploadIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PaperClipOutlined")
);

const props = defineProps({
  editing: { type: String, default: null },
  replies: { type: Array, default: () => [] },
  fileList: { type: Array, required: true },
});
const emits = defineEmits(["update:file-list"]);

watch(
  () => props.editing,
  (value) => {
    if (value) {
      const { message, attachments } =
        props.replies?.find((reply) => reply.uuid === value) ?? {};
      const template = (message.match(
        /<div class="chat__files">[\s\S]{1,}<\/div>$/g
      ) ?? [])[0];
      const urls = template?.match(/https:\/\/[\S ]{1,}\.\w{1,}/g) ?? [];

      urls.forEach((url) => {
        const [preview, name] = url.split('" alt="');
        const uuid = attachments.find((id) => preview.includes(id));

        emits("update:file-list", [...props.fileList, { preview, name, uuid }]);
      });
    } else {
      emits("update:file-list", []);
    }
  }
);

async function beforeUpload(file) {
  await setPreview(file);
  emits("update:file-list", [...props.fileList, file]);

  return false;
}

async function setPreview(file) {
  file.preview = await getBase64(file.originFileObj ?? file);
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

defineExpose();
</script>

<script>
export default { name: "UploadFiles" };
</script>
