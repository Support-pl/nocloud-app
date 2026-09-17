<template>
  <div class="audio" style="display: flex; align-items: center">
    <div style="width: 250px; padding: 0px 10px">
      <audio
        ref="nativeAudio"
        :src="currentTrack?.src"
        controls
        @ended="playNext"
      />

      <div class="name">
        {{ currentTrack?.title || name }}
        <a-button
          v-if="currentTrack?.src || url"
          style="margin-left: 10px; margin-bottom: 4px"
          size="small"
          @click="downloadFile(currentTrack?.src || url, currentTrack?.title || name)"
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
import { computed, defineAsyncComponent, nextTick, ref, watch } from "vue";

const props = defineProps({
  url: { type: String, default: "" },
  name: { type: String, default: "" },
  tracks: { type: Array, default: () => [] },
  autoplay: { type: Boolean, default: false },
});

const nativeAudio = ref();
const currentIndex = ref(0);
const started = ref(false);
const downloadIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DownloadOutlined")
);

const list = computed(() => {
  if (props.tracks.length) {
    return props.tracks
      .map((track) => ({
        src: track.url || track.src,
        title: track.name || track.title,
      }))
      .filter((track) => track.src);
  }
  if (props.url) {
    return [{ src: props.url, title: props.name }];
  }
  return [];
});

const currentTrack = computed(
  () => list.value[currentIndex.value] || list.value[0]
);

function playCurrent() {
  nextTick(() => {
    nativeAudio.value?.play?.().catch(() => {});
  });
}

function playNext() {
  if (currentIndex.value < list.value.length - 1) {
    currentIndex.value += 1;
    playCurrent();
  }
}

watch(
  () => list.value.map((track) => track.src).join("|"),
  (srcs, previous) => {
    if (!srcs) return;
    if (props.autoplay && !started.value) {
      started.value = true;
      currentIndex.value = 0;
      playCurrent();
    }
    if (
      props.autoplay &&
      started.value &&
      previous &&
      srcs.startsWith(previous) &&
      nativeAudio.value?.paused &&
      currentIndex.value >= (previous.split("|").length - 1)
    ) {
      playNext();
    }
  },
  { immediate: true }
);
</script>

<style>
.audio .name {
  display: flex;
  justify-content: center;
  justify-items: center;
  margin-bottom: 10px;
  color: var(--main);
}

.audio audio {
  width: 230px;
}
</style>
