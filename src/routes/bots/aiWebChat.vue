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

          <div
            class="chat__message"
            :class="[
              isAdminSent(reply) ? 'chat__message--in' : 'chat__message--out',
            ]"
          >
            <pre>
              <message-content :uuid="reply.id" :message="reply.body"/>
               <audio-player
                v-if="reply.attachments?.length===1 &&['audio/mp3','audio/mpeg','audio/wav'].includes(reply.attachments[0]?.mime_type) "
                :url="reply.attachments[0]?.storage_url"
                :name="reply.attachments[0]?.filename"
              />
             <message-files v-else :files="(reply.attachments || []).map(r=>({url:r.storage_url,name:r.filename}))"/>
              
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
        </template>
      </div>
    </template>

    <chat-footer ref="footer" v-model:messages="messages" :chat="chat" />
  </div>
</template>

<script setup>
import "highlight.js/styles/base16/classic-light.css";
import { v4 as uuidv4 } from "uuid";
import {
  defineAsyncComponent,
  nextTick,
  ref,
  computed,
  watch,
  toRefs,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useChatsStore } from "@/stores/chats.js";
import loading from "@/components/ui/loading.vue";
import { useAiBotsStore } from "@/stores/aiBots";
import ChatHeader from "@/components/services/bots/chatHeader.vue";
import ChatFooter from "@/components/services/bots/chatFooter.vue";
import { debounce, getCookie, setCookie } from "@/functions";
import AudioPlayer from "@/components/chats/audio-player.vue";
import MessageContent from "@/components/chats/messageContent.vue";
import MessageFiles from "@/components/chats/messageFiles.vue";

const exclamationIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ExclamationCircleOutlined")
);

const loadingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LoadingOutlined")
);

const USER_UUID_COOKIE_NAME = "web_chat_user_uuid";

const route = useRoute();
const router = useRouter();
router.replace({ query: { ...route.query, fullscreen: true } });

const chatsStore = useChatsStore();

const aiBotsStore = useAiBotsStore();
const { bots, chatParticipants } = toRefs(aiBotsStore);

const messages = ref([]);

const isLoading = ref(false);
const chatId = ref(route.params.chatId);
const botId = ref(route.params.id);
const chatPaddingTop = ref("15px");

const content = ref();
const footer = ref();

const chat = computed(() => undefined);
const bot = computed(() => bots.value.get(botId.value));

watch(
  messages,
  async (value, oldValue) => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!content.value) return;
    scrollDown();
  },
  { deep: true }
);

async function fetchData() {
  const uuid = getCookie(USER_UUID_COOKIE_NAME);

  if (!uuid) {
    setCookie(USER_UUID_COOKIE_NAME, uuidv4(), 31);
    return fetchData();
  }

  console.log(uuid);

  isLoading.value = true;
  try {
    console.log("fetching bot details");
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
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr auto;
  justify-content: center;
  gap: 10px;
  height: 100%;
  background: var(--bright_bg);
}

.chat__content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

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

.ant-radio-button-wrapper {
  padding-inline: 8px;
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

.count-tag {
  font-size: 12px;
  color: #999;
}
</style>
