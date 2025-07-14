<template>
  <div
    class="chat_item"
    :class="{ compact, base: !header, header: header }"
    @click="header ? null : chatClick(chat.id)"
  >
    <div class="chat_avatar_container">
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
          :src="`/img/chanells/${chat.channel_id.split('_')[0]}.png`"
          class="chat_chanell_icon"
        />
      </div>
    </div>

    <div v-if="!header" class="chat__content">
      <div v-if="chat.need_operator" class="chat_special_status">
        <a-tag style="line-height: 13px" color="red">
          <bell-outlined />
          {{ t("bots.labels.need_operator") }}
        </a-tag>
      </div>

      <div v-else-if="chat.spam_detected" class="chat_special_status">
        <a-tag style="line-height: 13px" color="orange">
          <warning-outlined />
          {{ t("bots.labels.spam_detected") }}
        </a-tag>
      </div>

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
      <div v-if="chat.need_operator" class="chat_special_status header">
        <a-tag style="font-size: 1rem; padding: 3px" color="red">
          <bell-outlined />
          {{ t("bots.labels.need_operator") }}
        </a-tag>
      </div>

      <div v-if="chat.spam_detected" class="chat_special_status header">
        <a-tag style="font-size: 1rem; padding: 3px" color="orange">
          <warning-outlined />
          {{ t("bots.labels.spam_detected") }}
        </a-tag>
      </div>
    </div>

    <div
      :class="{ chat_state: true, header: header }"
      :style="{ top: chat.need_operator || chat.spam_detected ? '25px' : '' }"
    >
      <template v-if="header">
        <a-tooltip placement="top">
          <template #title>
            <span>{{
              t(
                `bots.chat_item_tips.${
                  chat.inactive ? "activate" : "deactivate"
                }`
              )
            }}</span>
          </template>
          <a-button
            @click.stop.capture="toggleInactiveChat"
            type="text"
            :loading="isToggleInactiveLoading"
            shape="circle"
            size="large"
          >
            <template #icon>
              <active-icon style="font-size: 1.4rem" v-if="chat.inactive" />
              <inactive-icon style="font-size: 1.4rem" v-else />
            </template>
          </a-button>
        </a-tooltip>

        <a-tooltip placement="top">
          <template #title>
            <span>{{
              t(
                `bots.chat_item_tips.${chat.archived ? "unarchive" : "archive"}`
              )
            }}</span>
          </template>
          <a-button
            @click.stop.capture="toggleArchivedChat"
            type="text"
            :loading="isToggleArchivedLoading"
            shape="circle"
            size="large"
          >
            <template #icon>
              <unarchive-icon style="font-size: 1.4rem" v-if="chat.archived" />
              <archive-icon style="font-size: 1.4rem" v-else />
            </template>
          </a-button>
        </a-tooltip>
      </template>

      <a-tooltip placement="top">
        <template #title>
          <span>{{
            t(`bots.chat_item_tips.${chat.pause ? "resume_bot" : "pause_bot"}`)
          }}</span>
        </template>
        <a-button
          @click.stop.capture="toggleChatState"
          type="text"
          :loading="isTogglePauseLoading"
          shape="circle"
          size="large"
        >
          <template #icon>
            <play-outlined style="font-size: 1.4rem" v-if="chat.pause" />
            <pause-outlined style="font-size: 1.4rem" v-else />
          </template>
        </a-button>
      </a-tooltip>
    </div>

    <div v-if="chat.unread_count > 0 && !header" class="chat_unread_badge">
      {{ chat.unread_count }}
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

const bellOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/BellOutlined")
);

const warningOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/WarningOutlined")
);

const unarchiveIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/EyeOutlined")
);
const archiveIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/EyeInvisibleOutlined")
);

const activeIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SwapOutlined")
);
const inactiveIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SwapOutlined")
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
const isToggleArchivedLoading = ref(false);
const isToggleInactiveLoading = ref(false);

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
  if (props.compact) {
    router.replace(`/ai-bots/${props.botId}/chats/${id}`);
  } else {
    router.push(`/ai-bots/${props.botId}/chats/${id}`);
  }
}

function beauty(chat) {
  let message = chat.last_message?.body;
  message = decode(message);
  message = message.replace(/-{2,}.*/gi, "");
  message = message.replace(/IP Address.*/gi, "");
  message = message.replace(/<\/?[a-zA-Zа-яА-Я1-9 #-:=";_!?]+>/gi, "");

  return message.trim().length
    ? message.trim()
    : chat.last_message?.attachments?.length > 0
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

const toggleArchivedChat = async () => {
  isToggleArchivedLoading.value = true;
  try {
    await aiBotsStore.updateChat({
      ...props.chat,
      archived: !props.chat.archived,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isToggleArchivedLoading.value = false;
  }
};
const toggleInactiveChat = async () => {
  isToggleInactiveLoading.value = true;
  try {
    await aiBotsStore.updateChat({
      ...props.chat,
      inactive: !props.chat.inactive,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isToggleInactiveLoading.value = false;
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
  padding: 15px 10px 15px 10px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: var(--bright_font);
  transition: 0.2s;
  display: flex;
  position: relative;
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

.chat_special_status {
  display: flex;
  justify-content: start;
  align-items: center;
  font-size: 8px;
}

.chat__content {
  margin-left: 10px;
  max-width: calc(100% - 95px);
  width: 100%;
}

.chat__content.header {
  display: flex;
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
  position: absolute;
  right: 15px;
  font-size: 1.5rem;
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
  width: 40px;
  height: 40px;
}

.chat_avatar_container {
  flex-direction: column;
  justify-content: end;
  display: flex;
}

.chat_chanell_icon {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 15px;
  height: 15px;
}

.chat_unread_badge {
  position: absolute;
  top: 10px;
  right: 13px;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background-color: rgb(219, 46, 46);
  color: white;
  font-size: 12px;
  font-weight: bold;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px white;
  transform: translate(50%, -50%);
}
</style>
