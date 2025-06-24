<template>
  <div class="chat_item" :class="{ compact }" @click="chatClick(chat.id)">
    <div class="chat__status" :style="{ 'background-color': statusColor }" />
    <div class="chat__content">
      <div class="chat__upper">
        <div class="chat__title">
          #{{ chat.id.split("-")[0] }} - {{ chat.name }}
        </div>
      </div>
      <div class="chat__lower">
        <div class="chat__message">
          {{ beauty(chat) }}
        </div>
        <div class="chat__time">
          {{ toDate(chat.last_message_at) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { toDate } from "@/functions.js";
import config from "@/appconfig.js";
import { useI18n } from "vue-i18n";

const props = defineProps({
  chat: { type: Object, required: true },
  botId: { type: String, required: true },
  compact: { type: Boolean, default: false },
});

const router = useRouter();
const { t } = useI18n();

const statusColor = computed(() => {
  return config.colors.main;
});

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
  cursor: pointer;
  transition: 0.2s;
}

.chat_item:hover {
  filter: contrast(0.7);
  transition: 0.2s;
}

.chat_item.compact {
  box-shadow: none;
  border-radius: 0;
}

.chat_item:not(:last-child) {
  margin-bottom: 20px;
}

.chat_item.compact:not(:last-child) {
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

.chat__status {
  width: 10px;
  height: 10px;
  position: absolute;
  border-radius: 50%;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
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

.chat__time {
  font-size: 0.8rem;
  color: var(--gray);
  font-weight: 600;
  flex-shrink: 0;
}

.chat__status-text {
  white-space: nowrap;
}
</style>
