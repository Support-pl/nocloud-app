<template>
  <div
    style="display: flex; justify-content: space-between; width: 100%"
    @click="isVisible = !isVisible"
  >
    <div
      style="
        display: flex;
        justify-content: space-between;
        width: 100%;
        position: relative;
      "
    >
      <chat-item header :chat="chat" />
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, ref, nextTick, defineAsyncComponent } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";
import { toRefs } from "vue";
import ChatItem from "./chatItem.vue";

const props = defineProps({
  chat: { type: Object, required: true },
  bot: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
});
const { chat } = toRefs(props);
const emits = defineEmits(["update:paddingTop"]);

const router = useRouter();
const i18n = useI18n();
const { openNotification } = useNotification();

watch(
  () => props.isLoading,
  (value) => {
    if (value) return;
    nextTick(() => {
      emits(
        "update:paddingTop",
        `${notification.value?.$el.offsetHeight + 15}px`
      );
    });
  }
);

const isVisible = ref(false);
const isEditLoading = ref(false);
const notification = ref();

watch(chat, (value) => {
  setOptions(value);
});

onMounted(() => {
  window.addEventListener("resize", () => {
    emits(
      "update:paddingTop",
      `${notification.value?.$el.offsetHeight + 15}px`
    );
  });
  emits("update:paddingTop", `${notification.value?.$el.offsetHeight + 15}px`);
});

watch(isVisible, async (value) => {
  await nextTick();
  emits(
    "update:paddingTop",
    `${notification.value?.$el.offsetHeight + (value ? 30 : 0)}px`
  );
});

router.beforeEach((_, __, next) => {
  emits("update:paddingTop", `${notification.value?.$el.offsetHeight + 15}px`);
  next();
});

function setOptions(value) {}

setOptions(props.chat);
</script>

<script>
export default { name: "AiBotChatAlert" };
</script>

<style scoped>
.alert__notification {
  position: absolute;
  right: max(25px, (100vw - 1148px) / 2);
  top: 15px;
  z-index: 10;
  width: 100%;
  max-width: min(65vw - 50px, 768px - 30px);
  transition: 0.3s;
}

.alert__notification.ant-alert-with-description {
  padding: 15px;
}

.alert__notification :deep(.ant-alert-message) > span {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  font-size: 14px;
  cursor: pointer;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider-item {
  box-shadow: inset 0 0 0 1px var(--border_color);
  height: 100%;
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1rem;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.order__slider-item--active {
  background-color: var(--main);
  color: var(--gloomy_font);
}

.order__grid .order__slider-name > .img_prod {
  display: block;
  max-height: 20px;
}

.order__grid .order__slider-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

@media (max-width: 768px) {
  .alert__notification {
    right: 15px;
    max-width: calc(100% - 30px);
  }
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}

.ant-tag {
  color: unset !important;
}
</style>
