<template>
  <div
    class="chat_item"
    :class="{ compact, base: !header, header: header }"
    @click="header ? null : chatClick(chat.id)"
  >
    <div class="chat_avatar_wrapper">
      <a-avatar size="large" class="chat__avatar">
        {{
          chat.name
            .split(/[\s_]+/)
            .map((word) => word[0]?.toUpperCase())
            .filter((char) => /[A-ZА-ЯЁ]/i.test(char))
            .slice(0, 2)
            .join("")
        }}
      </a-avatar>
      <img
        :src="`/img/icons/${chat.channel_id.split('_')[0]}.png`"
        class="chat_chanell_icon"
      />
    </div>

    <div v-if="!header" class="chat__content">
      <div class="chat__upper">
        <div class="chat__title">
          {{ chat.name }}
        </div>
      </div>
      <div class="chat__lower">
        <div class="chat__message">
          {{ beauty(chat) }}
        </div>
        <div class="chat__time">
          {{ formatDate(chat.last_message_at) }}
        </div>
      </div>
    </div>

    <div v-else class="chat__content header">
      <div class="chat__upper header">
        <div class="chat__title header">
          {{ chat.name }}
        </div>
      </div>
    </div>

    <div :class="{ chat_state: true, header: header }">
      <a-button
        @click.stop.capture="toggleChatState"
        type="text"
        :loading="isTogglePauseLoading"
        shape="circle"
        size="large"
      >
        <template #icon>
          <play-outlined style="font-size: 1.5rem" v-if="chat.pause" />
          <pause-outlined style="font-size: 1.5rem" v-else />
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { defineAsyncComponent, ref } from "vue";
import { useAiBotsStore } from "@/stores/aiBots";

const playOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlayCircleOutlined")
);
const pauseOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PauseCircleOutlined")
);

const props = defineProps({
  chat: { type: Object, required: true },
  botId: { type: String, required: true },
  compact: { type: Boolean, default: false },
  header: { type: Boolean, default: false },
});

const router = useRouter();
const aiBotsStore = useAiBotsStore();
const { t } = useI18n();

const isTogglePauseLoading = ref(false);

function formatDate(date) {
  date = new Date(date);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // месяцы 0-11
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function chatClick(id) {
  router.push(`/ai-bots/${props.botId}/chats/${id}`);
}

function beauty(chat) {
  let message = chat.last_message?.body;
  message = decode(message);
  message = message.replace(/-{2,}.*/gi, "");
  message = message.replace(/IP Address.*/gi, "");
  message = message.replace(/<\/?[a-zA-Zа-яА-Я1-9 #-:=";_!?]+>/gi, "");

  return message.trim().length
    ? message.trim()
    : chat.attachments?.length > 0
    ? t("attachedFiles")
    : "empty";
}

const toggleChatState = async () => {
  isTogglePauseLoading.value = true;
  try {
    await aiBotsStore.toggleChatPause(props.chat);
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isTogglePauseLoading.value = false;
  }
};

function decode(text) {
  const txt = document.createElement("textarea");

  txt.innerHTML = text;
  return txt.value;
}
</script>

<script>
export default { name: "chatItem" };
</script>

<style scoped>
.chat_item {
  position: relative;
  padding: 15px 20px 15px 40px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: var(--bright_font);
  transition: 0.2s;
  display: flex;
}

.chat_item.base {
  cursor: pointer;
}

.chat_item.header {
  width: 100%;
}

.chat_item.base:hover {
  filter: contrast(0.7);
  transition: 0.2s;
}

.chat_item.base.compact {
  box-shadow: none;
  border-radius: 0;
  padding: 10px;
}

.chat_item.base:not(:last-child) {
  margin-bottom: 20px;
}

.chat_item.base.compact:not(:last-child) {
  margin-bottom: 0;
  border-bottom: 1px solid var(--border_color);
}

.chat__upper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.chat__lower {
  display: flex;
  justify-content: space-between;
}

.chat__content {
  margin-left: 10px;
  max-width: calc(100% - 90px);
  width: 100%;
}

.chat__title.header {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  font-size: 1.2rem;
}

.chat__upper.header {
  height: 100%;
}

.chat__message,
.chat__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-right: 10px;
}

.chat__title {
  font-weight: bold;
}

.chat_state {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  margin-left: 10px;
  margin-right: 10px;
}

.chat_state.header {
  margin-right: 20px;
}

.chat__time {
  font-size: 0.8rem;
  color: var(--gray);
  font-weight: 600;
  flex-shrink: 0;
}

.chat_avatar_wrapper {
  position: relative;
  display: inline-block;
}

.chat_chanell_icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 15px;
  height: 15px;
}
</style>
