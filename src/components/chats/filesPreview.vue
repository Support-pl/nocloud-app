<template>
  <div v-if="fileList.length > 0" class="files" :style="fileListStyle">
    <div
      v-for="file of fileList"
      :key="file.uid"
      :class="{ files__preview: true, active: hovered === file.uid }"
      @mouseenter="hovered = file.uuid ? '' : file.uid"
      @mouseleave="hovered = ''"
      @click="removeFile(file)"
    >
      <img :src="file.preview" :alt="file.name" />
      <plus-icon
        v-if="!file.uuid"
        style="color: var(--gloomy_font)"
        :rotate="45"
      />
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, ref } from "vue";

const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusOutlined")
);

const props = defineProps({
  fileListStyle: { type: [String, Array, Object], default: null },
  fileList: { type: Array, required: true },
});
const emits = defineEmits(["update:file-list"]);

const hovered = ref("");

function removeFile(file) {
  if (file.uuid) return;
  const i = props.fileList.indexOf(file);
  const data = [...props.fileList];
  data.splice(i, 1);
  emits("update:file-list", data);
}
</script>

<style scoped>
.files {
  margin-top: 5px;
  display: flex;
  gap: 5px;
  justify-self: start;
  flex-wrap: wrap;
}

.files__preview {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px;
  width: 100px;
  height: 100px;
  border: 1px solid var(--border_color);
  border-radius: 10px;
  overflow: hidden;
}

.files__preview::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  transition: background 0.3s;
}

.files__preview.active::before {
  background: rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.files__preview > img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: cover;
}

.files__preview :deep(.anticon-plus) {
  position: absolute;
  font-size: 28px;
  cursor: pointer;
  opacity: 0;
  transition: 0.3s;
}

.files__preview.active :deep(.anticon-plus) {
  opacity: 1;
}
</style>
