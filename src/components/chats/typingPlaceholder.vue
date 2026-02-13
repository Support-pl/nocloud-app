<template>
  <div v-if="type === 'text'" class="text" style="margin-top: auto">
    {{ text }}
  </div>
  <div v-else-if="type === 'image'" class="image-skeleton">
    <div class="skeleton-shimmer"></div>
  </div>
  <div v-else-if="type === 'audio'" class="audio-skeleton">
    <div class="skeleton-shimmer"></div>
  </div>
  <div v-else-if="type === 'video'" class="video-skeleton">
    <div class="skeleton-shimmer"></div>
  </div>
</template>

<script setup>
import { capitalize, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  type: {
    type: String,
    default: 'text' // 'text', 'image', 'audio', 'video'
  }
})

const i18n = useI18n()

const elipsis = ref(0)
setInterval(() => {
  if (elipsis.value > 2) elipsis.value = 0
  else elipsis.value++
}, 500)


const text = computed(() =>
  capitalize(`${i18n.t('bot is typing')}${'.'.repeat(elipsis.value)}`)
)
</script>

<style scoped>
.text {
  animation: glowing 1s linear infinite alternate;
  margin-left: 10px;
}

@keyframes glowing {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}

.image-skeleton {
  width: 400px;
  height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.skeleton-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.audio-skeleton {
  width: 350px;
  height: 60px;
  background: #f5f5f5;
  border-radius: 30px;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.audio-waveform {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 1;
}

.audio-waveform span {
  width: 5px;
  height: 30px;
  background: var(--main);
  border-radius: 3px;
  animation: wave 1.2s ease-in-out infinite;
}

.audio-waveform span:nth-child(1) {
  animation-delay: 0s;
}

.audio-waveform span:nth-child(2) {
  animation-delay: 0.1s;
}

.audio-waveform span:nth-child(3) {
  animation-delay: 0.2s;
}

.audio-waveform span:nth-child(4) {
  animation-delay: 0.3s;
}

.audio-waveform span:nth-child(5) {
  animation-delay: 0.4s;
}

.audio-waveform span:nth-child(6) {
  animation-delay: 0.5s;
}

.audio-waveform span:nth-child(7) {
  animation-delay: 0.6s;
}

.audio-waveform span:nth-child(8) {
  animation-delay: 0.7s;
}

@keyframes wave {
  0%, 100% {
    height: 15px;
  }
  50% {
    height: 40px;
  }
}

.video-skeleton {
  width: 500px;
  height: 350px;
  background: #f5f5f5;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
</style>
