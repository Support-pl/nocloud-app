<template>
  <div class="audio" style="display: flex; align-items: center">
    <div style="width: 250px; padding: 0px 10px">
      <vue-audio-player
        :show-prev-button="false"
        :show-next-button="false"
        :isLoop="false"
        ref="audioPlayer"
        theme-color="#3d73da"
        :audio-list="audioList"
        :show-playback-rate="false"
      >
      </vue-audio-player>

      <div class="name">
        {{ audioList[0].title }}
        <a-button
          style="margin-left: 10px; margin-bottom: 4px"
          size="small"
          @click="downloadFile(url, name)"
          shape="round"
          type="primary"
        >
          <template #icon>
            <download-icon />
          </template>
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { downloadFile } from "@/functions";
import VueAudioPlayer from "@liripeng/vue-audio-player";
import { computed, defineAsyncComponent } from "vue";
const props = defineProps(["url", "name"]);

const downloadIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DownloadOutlined")
);

const audioList = computed(() => [
  {
    src: props.url,
    title: props.name,
  },
]);
</script>

<style>
.audio .name {
  display: flex;
  justify-content: center;
  justify-items: center;
  margin-bottom: 10px;
  color: var(--main);
}

.vue-audio-player__btn-wrap svg {
  width: 30px !important;
  height: 30px !important;
}

.vue-audio-player__progress-wrap {
  margin-top: 10px !important;
}
.vue-audio-player__play-volume-icon-wrap {
  display: none !important;
}
</style>
