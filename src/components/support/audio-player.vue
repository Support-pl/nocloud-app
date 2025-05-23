<template>
  <div style="display: flex; align-items: center">
    <vue-sound :file="url" :title="name" />
    <a-button @click="download(url, name)" shape="round" type="primary">
      <template #icon>
        <download-icon />
      </template>
    </a-button>
  </div>
</template>

<script setup>
import "vue-sound/style.css";
import { VueSound } from "vue-sound";
import { defineAsyncComponent } from "vue";
const props = defineProps(["url", "name"]);

const downloadIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DownloadOutlined")
);

function download(url, filename) {
  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    })
    .catch(console.error);
}
</script>

<style>
:root {
  --player-background: var(--bright_bg);
  --player-font-family: "Open Sans", sans-serif;
  --player-font-size: 0.9rem;
  --player-font-size-small: 0.7rem;
  --player-font-weight: 300;
  --player-font-weight-bold: 600;
  --player-text-color: #3d73da;
  --player-icon-color: #3d73da;
  --player-link-color: #3d73da;
  --player-progress-color: #3d73da;
  --player-buffered-color: #749ae0;
  --player-seeker-color: #3d73da;
  --player-input-range-color: #3d73da;
}

.player-volume {
  display: none;
}

.player-track {
  padding: 0rem;
  padding-left: 2rem;
}
</style>
