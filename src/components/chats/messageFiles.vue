<template>
  <div class="message_files">
    <a-image
      v-for="file of files"
      :key="file.url"
      class="files__preview"
      :src="file.url"
      :alt="file.name"
      @error="onImageError"
    />
  </div>
</template>

<script setup>
import { downloadFile } from "@/functions";
import { defineAsyncComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";

const fileIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FileOutlined")
);

const props = defineProps({ files: { type: Array, required: true } });

async function onImageError(e) {
  const element = await renderToString(h(fileIcon));
  const parent = e.target.parentElement;

  e.target.outerHTML = `
    ${element}
    <span style="font-size: 14px;display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;">${e.target.alt}</span>
  `;
  parent.classList.add("files__preview");
  parent.classList.add("files__preview--placeholder");
  parent.onclick = () => {
    downloadFile(e.target.src, e.target.alt);
  };
}
</script>

<style>
.message_files {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.files__preview {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 114px !important;
  height: 100px !important;
  padding: 5px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  object-fit: cover;
}

.files__preview > img {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: cover;
}

.files__preview--placeholder {
  flex-direction: column;
  gap: 4px;
  width: 104px !important;
  height: 90px !important;
  font-size: 24px;
  border: 1px solid var(--border_color);
}
</style>
