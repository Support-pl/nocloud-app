<template>
  <div class="chat">
    <template v-if="isLoading">
      <div />
      <loading />
    </template>

    <template v-else>
      <div />

      <div ref="content" class="chat__content">
        <!-- Welcome message when no messages -->
        <div v-if="messages.length === 0" class="welcome-message">
          <div class="welcome-message__content">
            <h2 class="welcome-message__title">{{ $t('Support') }}</h2>
            <p class="welcome-message__text">
              {{ $t('Write your question below and we will try to help you as quickly as possible.') }}
            </p>
            <div class="welcome-message__icon">💬</div>
          </div>
        </div>

        <!-- Chat messages -->
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
            <div class="chat__message-content">
              <message-content :uuid="reply.id" :message="reply.body" />
              <audio-player
                v-if="
                  reply.attachments?.length === 1 &&
                  ['audio/mp3', 'audio/mpeg', 'audio/wav'].includes(
                    reply.attachments[0]?.mime_type
                  )
                "
                :url="reply.attachments[0]?.storage_url"
                :name="reply.attachments[0]?.filename"
              />
              <message-files
                v-else
                :files="
                  (reply.attachments || []).map((r) => ({
                    url: r.storage_url,
                    name: r.filename,
                  }))
                "
              />
            </div>

            <div class="chat__info">
              <span>{{
                chatParticipants?.find((p) => p.ext_id === reply.sender_ext_id)
                  ?.name
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

    <div ref="footer" style="padding-bottom: 10px">
      <send-input
        :send-loading="isSendMessageLoading"
        :message="message"
        @update:message="message = $event"
        :replies="messages"
        @send-message="sendChatMessage"
        :file-list="fileList"
        @update:filelist="fileList = $event"
        ref="sendinput"
        style="width: 100%"
        class="send_input"
      />
    </div>
  </div>
</template>

<script setup>
import "highlight.js/styles/base16/classic-light.css";
import { v4 as uuidv4 } from "uuid";
import { defineAsyncComponent, nextTick, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import loading from "@/components/ui/loading.vue";
import { getCookie, setCookie } from "@/functions";
import AudioPlayer from "@/components/chats/audio-player.vue";
import MessageContent from "@/components/chats/messageContent.vue";
import MessageFiles from "@/components/chats/messageFiles.vue";
import useNotification from "ant-design-vue/es/notification/useNotification";
import SendInput from "@/components/chats/sendInput.vue";

const exclamationIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ExclamationCircleOutlined")
);

const loadingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LoadingOutlined")
);

const USER_UUID_COOKIE_NAME = "web_chat_user_uuid";

const route = useRoute();
const router = useRouter();
const { openNotification } = useNotification();

router.replace({ query: { ...route.query, fullscreen: true } });

const chatParticipants = ref([{ ext_id: 0, name: "Admin" }]);

const messages = ref([]);

const isLoading = ref(false);
const chat = ref();

const content = ref();
const footer = ref();

const message = ref("");
const isSendMessageLoading = ref(false);
const fileList = ref([]);

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

  isLoading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const data = { user_uuid: uuid, bot_id: route.params.id };
    console.log("fetching bot details", data);

    chat.value = data;
    chatParticipants.value.push({ ext_id: uuid, name: "You" });

    await loadMessages(true);
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

fetchData();

function scrollDown() {
  content.value?.scrollTo(0, content.value?.scrollHeight);
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

async function loadMessages() {
  messages.value = [];
  nextTick(() => {
    scrollDown();
  });
}

async function sendChatMessage() {
  await nextTick();

  const files = fileList.value;

  const result = message.value.trim();
  if (result.length < 1 && !files.length) {
    return;
  }

  isSendMessageLoading.value = true;

  try {
    const data = {
      text: result,
      files: files.map((f) => ({
        data: f.preview,
        filename: f.name,
      })),
    };

    data.created_at = new Date().toISOString();
    console.log(data);
    messages.value.push({
      id: uuidv4(),
      body: result,
      sender_role: 2,
      sender_ext_id: chat.value.user_uuid,
      created_at: data.created_at,
    });

    setTimeout(() => {
      messages.value.push({
        id: uuidv4(),
        body: "This is a simulated response from the admin.",
        sender_role: 1,
        sender_ext_id: 0,
        created_at: new Date().toISOString(),
      });
    }, 1000);
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isSendMessageLoading.value = false;
    message.value = "";
    fileList.value = [];
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
  gap: clamp(5px, 2vw, 10px);
  height: 100%;
  min-height: 300px;
  padding: clamp(8px, 2vw, 16px);
  background: var(--bright_bg);
  overflow: hidden;
}

.chat__content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  min-height: 200px;
  padding: clamp(10px, 3vw, 18px) clamp(10px, 3vw, 18px) 8px;
  border: 1px solid var(--border_color);
  border-radius: clamp(4px, 1vw, 6px);
  overflow-y: auto;
  overflow-x: hidden;
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
  padding: clamp(2px, 0.5vw, 4px) clamp(4px, 1vw, 6px);
  border-radius: clamp(4px, 1vw, 5px);
  box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.07);
  position: relative;
  width: max-content;
  max-width: min(80%, 400px);
  min-width: min(120px, 30%);
  word-wrap: break-word;
  margin-bottom: clamp(10px, 0.8vw, 5px);
  overflow-wrap: break-word;
  hyphens: auto;
}

.chat__message-content {
  font-size: clamp(12px, 3vw, 14px);
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-family: inherit;
  line-height: 1.3;
  width: max-content;
  max-width: 100%;
}

.chat__message-content img {
  max-width: 100%;
  height: auto;
}

.chat__date {
  padding: clamp(6px, 2vw, 8px) clamp(12px, 4vw, 16px);
  margin: clamp(8px, 2vw, 12px) auto clamp(10px, 3vw, 16px);
  text-align: center;
  border-radius: clamp(4px, 1.5vw, 7px);
  line-height: 1;
  color: var(--gloomy_font);
  background: var(--main);
  font-size: clamp(11px, 2.5vw, 13px);
}

.chat__info {
  display: flex;
  justify-content: space-between;
  gap: clamp(4px, 1.5vw, 6px);
  font-size: clamp(10px, 2.5vw, 12px);
  color: var(--gray);
  margin-top: 4px;
  padding-top: 2px;
}

.msgStatus {
  position: absolute;
  bottom: 5px;
  left: clamp(-15px, -4vw, -20px);
  font-size: clamp(12px, 3vw, 14px);
  height: auto;
}

.no_chats_compact {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: clamp(12px, 5vw, 24px);
}

.no_chats_compact span {
  margin-top: 10vh;
  font-size: clamp(14px, 4vw, 16px);
  font-weight: 600;
  text-align: center;
}

.ant-radio-button-wrapper {
  padding-inline: clamp(8px, 2vw, 12px);
}

.msgStatus.error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: clamp(16px, 4vw, 20px);
  height: clamp(16px, 4vw, 20px);
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
  border: clamp(6px, 2vw, 9px) solid transparent;
  border-bottom: clamp(8px, 2.5vw, 10px) solid #dcfdbe;
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
  font-size: clamp(12px, 3vw, 14px);
  padding: 2px 0;
}

/* Welcome message styles */
.welcome-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: clamp(20px, 5vw, 40px);
}

.welcome-message__content {
  text-align: center;
  max-width: 400px;
  width: 100%;
}

.welcome-message__title {
  font-size: clamp(18px, 4vw, 24px);
  font-weight: 600;
  color: var(--main);
  margin: 0 0 clamp(12px, 3vw, 20px) 0;
  line-height: 1.3;
}

.welcome-message__text {
  font-size: clamp(14px, 3.5vw, 16px);
  color: var(--gray);
  line-height: 1.5;
  margin: 0 0 clamp(16px, 4vw, 24px) 0;
}

.welcome-message__icon {
  font-size: clamp(32px, 8vw, 48px);
  opacity: 0.7;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

/* Media queries for welcome message */
@media (max-width: 768px) {
  .welcome-message {
    padding: clamp(15px, 4vw, 25px);
  }
  
  .welcome-message__content {
    max-width: 300px;
  }
}

@media (max-width: 320px) {
  .welcome-message {
    padding: 10px;
  }
  
  .welcome-message__title {
    font-size: 16px;
  }
  
  .welcome-message__text {
    font-size: 13px;
  }
  
  .welcome-message__icon {
    font-size: 28px;
  }
}

/* Container queries for very small containers */
@container (max-width: 400px) {
  .chat {
    gap: 5px;
    padding: 6px;
  }

  .chat__content {
    padding: 8px;
    border-radius: 4px;
  }

  .chat__message {
    max-width: 90%;
    font-size: 12px;
    padding: 6px 8px;
  }

  .chat__date {
    padding: 5px 8px;
    margin: 5px auto 8px;
  }
}

/* Container queries for extremely small containers */
@container (max-width: 300px) {
  .chat {
    gap: 4px;
    padding: 4px;
  }

  .chat__content {
    padding: 6px;
    border-radius: 2px;
  }

  .chat__message {
    max-width: 95%;
    padding: 4px 6px;
    margin-bottom: 6px;
    min-width: 80px;
  }

  .chat__info {
    font-size: 9px;
    gap: 3px;
    margin-top: 2px;
  }
}

/* Media queries for extremely small screens */
@media (max-width: 320px) {
  .chat {
    gap: 3px;
    padding: 4px;
  }

  .chat__content {
    padding: 6px;
    border: none;
    border-radius: 0;
  }

  .chat__message {
    padding: 4px 6px;
    margin-bottom: 6px;
    max-width: 95%;
    min-width: 80px;
  }

  .chat__message pre {
    font-size: 11px;
  }

  .chat__info {
    font-size: 9px;
    gap: 3px;
  }

  .msgStatus {
    left: -12px;
    font-size: 10px;
  }
}

/* For large screens - limit maximum width */
@media (min-width: 1200px) {
  .chat {
    max-width: 100%;
    padding: 16px 20px;
  }

  .chat__message {
    max-width: 70%;
  }
}

/* Fullscreen mode */
@media (min-width: 768px) {
  .chat__content {
    margin: 0;
  }
}

/* Mobile devices */
@media (max-width: 768px) {
  .chat {
    grid-template-columns: 1fr;
    height: 100%;
    padding: 8px;
  }

  .chat__content {
    margin: 0;
    border: 0;
    border-radius: 0;
    padding: 10px 8px 6px;
  }

  .chat__message {
    max-width: 85%;
  }
}

.count-tag {
  font-size: clamp(10px, 2.5vw, 12px);
  color: #999;
}

/* Add container queries for modern browsers */
@supports (container-type: inline-size) {
  .chat {
    container-type: inline-size;
  }
}
</style>
