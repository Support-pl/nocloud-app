<template>
  <div class="chat">
    <template v-if="isLoading">
      <div />
      <loading />
    </template>

    <template v-else>
      <chat-header
        v-if="!isLoading && chat"
        style="margin: 10px auto 0"
        :chat="chat"
        :bot="bot"
      />
      <div v-else />

      <div ref="content" class="chat__content">
        <template v-for="(reply, i) in messages" :key="i">
          <span v-if="isDateVisible(messages, i)" class="chat__date">
            {{ reply.created_at.split("T")[0] }}
          </span>

          <a-popover
            :overlay-class-name="
              reply.error ? 'chat__tooltip error' : 'chat__tooltip'
            "
            :trigger="reply.error ? 'click' : 'hover'"
            :placement="isAdminSent(reply) ? 'rightBottom' : 'leftBottom'"
          >
            <template #content>
              <div
                style="cursor: pointer"
                @click="addToClipboard(reply.message)"
              >
                <copy-icon /> {{ capitalize($t("copy")) }}
              </div>
            </template>

            <div
              :key="`${i}_message`"
              class="chat__message"
              :class="[
                isAdminSent(reply) ? 'chat__message--in' : 'chat__message--out',
              ]"
            >
              <pre>
              <message-content :uuid="reply.id" :message="reply.body"/>

               <audio-player
                v-if="reply.attachments?.length===1 &&['audio/mp3','audio/mpeg'].includes(reply.attachments[0]?.mime_type) "
                :url="reply.attachments[0]?.storage_url"
                :name="reply.attachments[0]?.filename"
              />
              <div v-else class="chat__files">
                <a-image
                  v-for="file of reply.attachments" :key="file.storage_url" class="files__preview"
                  :src="file.storage_url"
                  :alt="file.filename"
                  @error="onImageError"
                  @click="openModal"
                />
              </div>
            </pre>

              <div class="chat__info">
                <span>{{
                  chatParticipants[chat.id]?.find(
                    (p) => p.ext_id === reply.sender_ext_id
                  )?.name
                }}</span>
                <span>{{ getMessageTime(reply) }}</span>
              </div>

              <loading-icon v-if="reply.sending" class="msgStatus loading" />
              <a-popover v-else-if="reply.error" :title="$t('Send error')">
                <template #content>
                  <a class="popover-link" @click="deleteMessage(reply)">
                    {{ $t("chat_Delete_message") }}
                  </a>
                  <a class="popover-link" @click="resendMessage(reply)">
                    {{ $t("chat_Resend_message") }}
                  </a>
                </template>
                <div class="msgStatus error">
                  <exclamation-icon />
                </div>
              </a-popover>
            </div>
          </a-popover>
        </template>

        <typing-placeholder v-if="isPlaceholderVisible" />
      </div>
    </template>

    <div ref="chatList" class="chat__list">
      <a-input
        style="margin: 10px; padding: 5px; max-width: 90%"
        v-model:value="searchParam"
        :placeholder="$t('bots.labels.search')"
      >
        <template #suffix>
          <search-icon style="font-size: 20px" />
        </template>
      </a-input>

      <a-radio-group style="margin: 0px 10px;" v-model:value="currentChatsFilter">
        <a-radio-button value="active">
          {{ capitalize($t("bots.chats_filter.active")) }}
        </a-radio-button>
        <a-radio-button value="inactive">
          {{ capitalize($t("bots.chats_filter.inactive")) }}
        </a-radio-button>
        <a-radio-button value="archived">
          {{ capitalize($t("bots.chats_filter.archived")) }}
        </a-radio-button>
        <a-radio-button value="all">
          {{ capitalize($t("bots.chats_filter.all")) }}
        </a-radio-button>
      </a-radio-group>

      <div
        v-if="filtredChats.length === 0 && !isLoading"
        class="no_chats_compact"
      >
        <span>
          {{ $t("bots.labels.no_chats_compact") }}
        </span>
      </div>
      <template v-else>
        <chat-item
          v-for="item of filtredChats"
          :key="item.id"
          :chat="item"
          :bot-id="botId"
          :style="item.id == chatId ? 'filter: contrast(0.8)' : null"
          compact
        />
      </template>
    </div>
    <div></div>
    <chat-footer ref="footer" v-model:messages="messages" :chat="chat" />
  </div>
</template>

<script setup>
import "highlight.js/styles/base16/classic-light.css";
import {
  defineAsyncComponent,
  nextTick,
  ref,
  computed,
  watch,
  toRefs,
} from "vue";
import { onBeforeRouteUpdate, useRoute } from "vue-router";
import { useClipboard } from "@/hooks/utils";
import { useChatsStore } from "@/stores/chats.js";
import loading from "@/components/ui/loading.vue";
import typingPlaceholder from "@/components/support/typingPlaceholder.vue";
import MessageContent from "@/components/support/messageContent.vue";
import { sortAiBotChats, useAiBotsStore } from "@/stores/aiBots";
import ChatItem from "@/components/services/bots/chatItem.vue";
import ChatHeader from "@/components/services/bots/chatHeader.vue";
import ChatFooter from "@/components/services/bots/chatFooter.vue";
import { debounce, downloadFile } from "@/functions";
import AudioPlayer from "@/components/support/audio-player.vue";
import { renderToString } from "vue/server-renderer";
import { h } from "vue";

const exclamationIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ExclamationCircleOutlined")
);
const copyIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CopyOutlined")
);

const fileIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FileOutlined")
);

const loadingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LoadingOutlined")
);

const searchIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SearchOutlined")
);

const route = useRoute();
const { addToClipboard } = useClipboard();

const chatsStore = useChatsStore();

const aiBotsStore = useAiBotsStore();
const { chats: allChats, bots, chatParticipants } = toRefs(aiBotsStore);

onBeforeRouteUpdate((to, from, next) => {
  chatId.value = to.params.chatId;
  loadMessages();
  next();
});

const messages = ref([]);

const isLoading = ref(false);
const chatId = ref(route.params.chatId);
const botId = ref(route.params.id);
const chatPaddingTop = ref("15px");
const searchParam = ref("");
const isPlaceholderVisible = ref(false);
const currentChatsFilter = ref("active");

const content = ref();
const footer = ref();

const chat = computed(() =>
  chats.value.find((chat) => chat.id === chatId.value)
);
const bot = computed(() => bots.value.get(botId.value));
const chats = computed(() =>
  sortAiBotChats(allChats.value.get(botId.value) || [])
);
const filtredChats = computed(() =>
  chats.value.filter((chat) => {
    let filter = true;

    switch (currentChatsFilter.value) {
      case "inactive":
        filter = chat.inactive === true;
        break;
      case "active":
        filter = chat.inactive === false && chat.archived === false;
        break;
      case "archived":
        filter = chat.archived === true;
        break;
      case "all":
      default:
        filter = true;
        break;
    }

    return (
      filter &&
      (chat.name.toLowerCase().includes(searchParam.value.toLowerCase()) ||
        chat.id.toLowerCase().includes(searchParam.value.toLowerCase()))
    );
  })
);

watch(
  chats,
  async () => {
    await nextTick();
    if (!chatList.value) return;
    const { scrollHeight, clientHeight, lastElementChild } = chatList.value;

    if (scrollHeight > clientHeight || !lastElementChild) return;
    lastElementChild.style.borderBottom = "1px solid var(--border_color)";
  },
  { deep: true }
);

watch(
  messages,
  async (value, oldValue) => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 300));
    setPlaceholderVisible(oldValue.length > 0 ? oldValue : value);

    if (!content.value) return;
    scrollDown();
  },
  { deep: true }
);

async function fetchData() {
  isLoading.value = true;
  try {
    await Promise.all([
      aiBotsStore.fetchChats(botId.value),
      aiBotsStore.getBot(botId.value),
      chatsStore.fetch_models_list(),
    ]);

    aiBotsStore.startChatsStream();
  } catch (error) {
    console.error(error);
  }

  await loadMessages(true);

  isLoading.value = false;
}

fetchData();

function scrollDown() {
  content.value?.scrollTo(0, content.value?.scrollHeight);
  readLastMessageDebounced();
}

function readLastMessage() {
  if (messages.value[messages.value.length - 1]) {
    aiBotsStore.readMessage(messages.value[messages.value.length - 1]);
  }
}

const readLastMessageDebounced = debounce(readLastMessage, 250);

let timeout;
function setPlaceholderVisible(messages) {
  if (chat.value?.department !== "openai") return;
  const isUserSent = messages.at(-1)?.from || messages.length === 1;

  if (!isAdminSent(messages.at(-1) ?? {}) && isUserSent) {
    timeout = setTimeout(async () => {
      isPlaceholderVisible.value = true;

      await nextTick();
      scrollDown();
    }, 1000);

    setTimeout(() => {
      clearTimeout(timeout);
      isPlaceholderVisible.value = false;
    }, 20 * 1000);
  } else {
    clearTimeout(timeout);
    isPlaceholderVisible.value = false;
  }
}

function isAdminSent(reply) {
  return reply.sender_role === 1;
}

function getMessageTime(reply) {
  const date = new Date(reply.created_at);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function isDateVisible(replies, i) {
  if (i === 0) return true;

  return (
    new Date(replies[i - 1].created_at).getDate() !==
    new Date(replies[i].created_at).getDate()
  );
}

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

async function loadMessages() {
  if (!chatId.value) {
    return;
  }

  isLoading.value = true;
  try {
    const response = await aiBotsStore.fetchChatsMessages(chatId.value);

    messages.value = response ?? [];
  } finally {
    nextTick(() => {
      scrollDown();
    });
    isLoading.value = false;

    if (chatsStore.chats.get(chatId.value)) {
      chatsStore.chats.get(chatId.value).meta.unread = 0;
    }
  }
}

function deleteMessage(message) {
  messages.value.splice(messages.value.indexOf(message), 1);
}

function resendMessage(reply) {
  deleteMessage(reply);
  footer.value.message = reply.message;
  footer.value.sendMessage();
}
</script>

<script>
export default { name: "AiBotChat" };
</script>

<style scoped>
.chat {
  position: relative;
  display: grid;
  grid-template-columns: min(400px, 35vw - 20px) min(968px, 65vw - 20px);
  grid-template-rows: auto 1fr auto;
  justify-content: center;
  gap: 10px;
  height: 100%;
  background: var(--bright_bg);
}

:deep(.chat__container) {
  padding: 0;
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
  gap: 5px;
  max-width: calc(768px + 400px + 10px);
  height: 100%;
  width: 100%;
  margin: 0 auto;
}

.chat__list {
  grid-row: 1 / 3;
  margin: 10px 0;
  overflow: scroll;
  border: 1px solid var(--border_color);
  border-radius: 6px;
  background: var(--bright_font);
}

.chat__content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  max-width: 968px;
  width: 100%;
  height: 100%;
  padding: v-bind("chatPaddingTop") 15px 6px;

  border: 1px solid var(--border_color);
  border-radius: 6px;
  overflow: auto;
  background: var(--bright_font);
}

.chat__tooltip :deep(.ant-popover-inner) {
  padding: 6px 8px;
}

.chat__tooltip.error :deep(.ant-popover-inner),
.chat__tooltip.error :deep(.ant-popover-arrow) {
  background: transparent;
  box-shadow: none;
}

.chat__message {
  background: #dcfdbe;
  font-weight: 500;
  padding: 5px 7px;
  border-radius: 5px;
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.07);
  position: relative;
  width: max-content;
  max-width: 80%;
  word-wrap: wrap;
  margin-bottom: 10px;
}

.chat__message pre {
  font-size: 14px;
  white-space: collapse;
  word-break: break-word;
}

.chat__message pre img {
  width: 100%;
}

.chat__date {
  padding: 7px 15px;
  margin: 10px auto 15px;
  text-align: center;
  border-radius: 7px;
  line-height: 1;
  color: var(--gloomy_font);
  background: var(--main);
}

.chat__info {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  font-size: 12px;
  color: var(--gray);
}

.msgStatus {
  position: absolute;
  bottom: 5px;
  left: -20px;
  font-size: 14px;
  height: auto;
}

:deep(.chat__files) {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

:deep(.chat__files .files__preview) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 114px;
  height: 100px;
  padding: 5px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}

:deep(.chat__files .files__preview > img) {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: cover;
}

.no_chats_compact {
  display: flex;
  justify-content: center;
  align-items: center;
}
.no_chats_compact span {
  margin-top: 10vh;
  font-size: 1rem;
  font-weight: 600;
}

:deep(.chat__files .files__preview--placeholder) {
  flex-direction: column;
  gap: 4px;
  width: 104px;
  height: 90px;
  font-size: 24px;
  border: 1px solid var(--border_color);
}

.msgStatus.error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--err);
  color: var(--gloomy_font);
  cursor: pointer;
  transform: translate(-5px, 5px);
}

.chat__message::after {
  content: "";
  display: block;
  position: absolute;
  bottom: 0;
  border: 9px solid transparent;
  border-bottom: 10px solid #dcfdbe;
}

.chat__message--out {
  align-self: flex-end;
  color: rgba(0, 0, 0, 0.65);
}

.chat__message--out::after {
  right: 0;
  transform: translateX(50%);
}

.chat__message--in {
  align-self: flex-start;
  background: var(--bright_bg);
}

.chat__message--in::after {
  left: 0;
  transform: translateX(-50%);
  border-bottom-color: var(--bright_bg);
}

.popover-link {
  display: block;
}

@media (max-width: 768px) {
  .chat {
    grid-template-columns: 1fr;
  }

  .chat__list {
    display: none;
  }

  .chat__content {
    margin: 0;
    border: 0;
    border-radius: 0;
  }

  .chat__footer {
    grid-column: 1;
    padding: 0 10px 10px;
  }
}
</style>
