<template>
  <div :class="{ chat: true }">
    <div class="chat__subheader_container">
      <div
        v-if="chat"
        :class="{ chat__subheader: true, chats_opened: !isChatMenuClosed }"
      >
        <a-tag color="primary" class="chat__subheader_model">
          <template #icon>
            <ai-icon />
          </template>
          <span style="margin-inline-start: 0px">
            {{ model }}
          </span>
        </a-tag>

        <a-button shape="circle" size="large" @click="isSettingsVisible = true">
          <template #icon>
            <settings-icon />
          </template>
        </a-button>

        <a-button
          style="margin-left: 5px"
          shape="circle"
          size="large"
          @click="
            !isFullScreanChat
              ? openChatInFullscreen()
              : closeChatFromFullscreen()
          "
        >
          <template #icon>
            <open-fullscrean-icon v-if="!isFullScreanChat" />
            <close-fullscrean-icon v-else />
          </template>
        </a-button>

        <a-modal
          v-model:open="isSettingsVisible"
          :title="$t('settings')"
          width="600px"
          :footer="null"
        >
          <chat-settings
            v-model:padding-top="chatPaddingTop"
            :chat="chat"
            :is-loading="isLoading"
          />
        </a-modal>
      </div>
    </div>

    <loading v-if="isLoading" />
    <div
      v-else-if="isCreate"
      style="
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      "
    >
      <create-chat
        ref="footer"
        v-model:replies="replies"
        :ticket="chat"
        :instance="instance"
      />
    </div>

    <div v-else class="chat__container">
      <div
        ref="content"
        :class="{ chat__content: true, chats_opened: !isChatMenuClosed }"
      >
        <template v-for="(reply, i) in replies" :key="i">
          <span v-if="isDateVisible(replies, i)" class="chat__date">
            {{ reply.date.split(" ")[0] }}
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
              <div
                v-if="isEditable(reply)"
                style="cursor: pointer; margin-top: 5px"
                @click="footer.changeEditing(reply)"
              >
                <edit-icon /> {{ capitalize($t("edit")) }}
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
              <message-content :uuid="reply.uuid" :message="reply.message"/>
              <audio-player
               v-if="files[reply.uuid]?.length===1 && files[reply.uuid]?.[0]?.name.endsWith('.mp3')"
                :url="files[reply.uuid][0]?.url"
                  :name="files[reply.uuid][0]?.name"
              />
              <div 
               v-if="files[reply.uuid]?.length===1 && files[reply.uuid]?.[0]?.name.endsWith('.mp4')"
              >
                <div class="relative">
                  <video
                    ref="videoRef"
                    :src="files[reply.uuid][0]?.url"
                    controls
                    class="video"
                  />
                </div>
              </div>
             <message-files v-else :files="files[reply.uuid]"/>
              
            </pre>

              <div class="chat__info">
                <span>{{ reply.name }}</span>
                <span>{{ reply.date.slice(-8, -3) }}</span>
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
        <div style="height: 250px"></div>
      </div>
    </div>

    <div :class="['chats_sidebar', { collapsed: isChatMenuClosed }]">
      <div ref="chatList" class="chat__list">
        <div class="chats_search">
          <a-input
            v-show="!isChatMenuClosed"
            style="margin-right: 15px"
            v-model:value="searchString"
            :placeholder="$t('bots.labels.search')"
          >
            <template #suffix>
              <search-icon style="font-size: 18px" />
            </template>
          </a-input>
          <a-button
            v-if="isChatMenuClosed"
            shape="circle"
            @click="isChatMenuClosed = false"
            :icon="h(closeMenu)"
          />
          <a-button
            v-else
            shape="circle"
            @click="isChatMenuClosed = true"
            :icon="h(openMenu)"
          />
        </div>

        <template v-if="instance && !isChatMenuClosed">
          <div class="chats_actions">
            <a-button type="text" @click="openCreateChatPage">
              <div class="chats_action_btn">
                <add-chat-icon class="icon" />
                <span style="margin-left: 10px">
                  {{ $t("Add new chat") }}
                </span>
              </div>
            </a-button>
            <a-button type="text" @click="openInstancePage">
              <div class="chats_action_btn">
                <api-icon class="icon" />
                <span style="margin-left: 10px">
                  {{ $t("API / Settings") }}
                </span>
              </div>
            </a-button>
          </div>
        </template>
        <template v-else="instance">
          <div class="chats_actions">
            <a-tooltip placement="right">
              <template #title>
                {{ $t("Add new chat") }}
              </template>
              <a-button shape="circle" @click="openCreateChatPage">
                <template #icon>
                  <add-chat-icon />
                </template>
              </a-button>
            </a-tooltip>

            <a-tooltip placement="right">
              <template #title>
                {{ $t("API / Settings") }}
              </template>
              <a-button shape="circle" @click="openInstancePage">
                <template #icon>
                  <api-icon />
                </template>
              </a-button>
            </a-tooltip>
          </div>
        </template>

        <template v-if="!isChatMenuClosed" v-for="item of chats">
          <ticket-item
            :ticket="item"
            :instance-id="instanceId"
            :style="item.id == chatid ? 'filter: contrast(0.8)' : null"
            compact
          />
        </template>
      </div>
    </div>

    <div v-if="!isCreate">
      <transition name="fade">
        <div
          v-show="showScrollToBottom"
          style="position: relative; display: flex; justify-content: center"
        >
          <a-button
            shape="circle"
            class="scroll-to-bottom"
            @click="scrollToBottom(0)"
          >
            <template #icon>
              <arrow-down-icon />
            </template>
          </a-button>
        </div>
      </transition>
      <chats-footer
        ref="footer"
        v-model:replies="replies"
        :ticket="chat"
        :instance="instance"
      />
    </div>
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
  h,
  onBeforeUnmount,
  onMounted,
} from "vue";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import { Status } from "@/libs/cc_connect/cc_pb";
import { useClipboard } from "@/hooks/utils";
import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import loading from "@/components/ui/loading.vue";
import chatsFooter from "@/components/openai-chats/footer.vue";
import { useInstancesStore } from "@/stores/instances";
import { storeToRefs } from "pinia";
import MessageContent from "@/components/chats/messageContent.vue";
import AudioPlayer from "@/components/chats/audio-player.vue";
import TypingPlaceholder from "@/components/chats/typingPlaceholder.vue";
import MessageFiles from "@/components/chats/messageFiles.vue";
import { useAppStore } from "@/stores/app";
import TicketItem from "@/components/openai-chats/ticketItem.vue";
import CreateChat from "@/components/openai-chats/createChat.vue";
import ChatSettings from "@/components/openai-chats/chatSettings.vue";

const exclamationIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ExclamationCircleOutlined")
);
const copyIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/CopyOutlined")
);
const editIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/EditOutlined")
);

const loadingIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LoadingOutlined")
);
const addChatIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusCircleOutlined")
);
const arrowDownIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ArrowDownOutlined")
);
const searchIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SearchOutlined")
);
const aiIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/RobotOutlined")
);

const apiIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/ProfileOutlined")
);

const closeMenu = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/RightCircleOutlined")
);
const openMenu = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/LeftCircleOutlined")
);

const settingsIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/SettingOutlined")
);

const openFullscreanIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FullscreenOutlined")
);

const closeFullscreanIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/FullscreenExitOutlined")
);

const route = useRoute();
const router = useRouter();
const { addToClipboard } = useClipboard();

const authStore = useAuthStore();
const appStore = useAppStore();
const { customHeaderTitle } = storeToRefs(appStore);
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);
const instancesStore = useInstancesStore();
const { getInstances } = storeToRefs(instancesStore);

onBeforeRouteUpdate((to, from, next) => {
  appStore.setOnRefreshClick(reload);

  chatid.value = to.params.chatId;
  loadMessages();
  next();
});

const replies = ref([]);

const isLoading = ref(false);
const isSettingsVisible = ref(false);
const chatid = ref(route.params.chatId);
const searchString = ref("");
const isPlaceholderVisible = ref(false);

const isChatMenuClosed = ref(false);

const content = ref();
const chatList = ref();
const footer = ref();

onMounted(() => {
  if (window.innerWidth < 768) {
    isChatMenuClosed.value = true;
  }
});

const chat = computed(() => chatsStore.chats.get(chatid.value));

const instanceId = computed(() => route.params.id);

const isCreate = computed(() => route.query.create);

const instance = computed(() => {
  const instance = getInstances.value.find((i) => i.uuid === instanceId.value);

  return instance || null;
});

const chats = computed(() => {
  const result = [];
  const { uuid } = authStore.billingUser;

  chatsStore.chats.forEach((ticket) => {
    const { instance: inst, model: mod } = ticket.meta.data ?? {};
    const instance = inst?.kind.case ? inst?.toJSON() : null;
    const model = mod?.kind.case ? mod?.toJSON() : null;

    if (instance !== instanceId.value) return;

    const string = searchString.value.toLowerCase();
    const topic = ticket.topic?.toLowerCase() ?? "";
    if (!topic.includes(string) && string !== "") return;

    const isReaded = ticket.meta.lastMessage?.readers.includes(uuid);
    const status =
      Status[ticket.status]?.toLowerCase().split("_") ?? ticket.status;

    const value = {
      id: ticket.uuid,
      tid: ticket.uuid.slice(0, 8),
      title: ticket.topic,
      date: Number(ticket.meta.lastMessage?.sent) || Number(ticket.created),
      message: ticket.meta.lastMessage?.content ?? "",
      status: status
        .map((el) => `${el[0].toUpperCase()}${el.slice(1)}`)
        .join(" "),
      unread: isReaded ? 0 : ticket.meta.unread,
      model,
    };
    result.push(value);
  });

  result.sort((a, b) => b.date - a.date);

  return result;
});

const files = computed(() =>
  replies.value.reduce((result, { attachments, uuid }) => {
    var files = [];
    attachments?.forEach((uuid) => {
      if (
        chatsStore.attachments.has(uuid) &&
        chatsStore.attachments.get(uuid) !== true
      ) {
        files.push(chatsStore.attachments.get(uuid));
      }
    });

    result[uuid] = files;

    return result;
  }, {})
);

const model = computed(() => {
  return (
    globalModelsList.value.find(
      (model) => model.key === chat.value?.meta?.data?.model?.kind?.value
    )?.name || chat.value?.meta?.data?.model?.kind?.value
  );
});

const isFullScreanChat = computed(() => route.query.fullscreen === "true");

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
  replies,
  async (value, oldValue) => {
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 300));
    setPlaceholderVisible(oldValue.length > 0 ? oldValue : value);

    scrollToBottom(0);
  },
  { deep: true }
);

watch(
  () => chatsStore.messages[chatid.value],
  () => loadMessages(),
  { deep: true }
);

async function fetch() {
  isLoading.value = true;

  await Promise.all([
    chatsStore.fetchChats(),
    chatsStore.fetchDefaults(),
    instancesStore.fetch(),
  ]);

  chatsStore.fetch_models_list();

  if (!route.params.chatId && chats.value[0]?.id && !isCreate.value) {
    router.replace({ params: { chatId: chats.value[0].id } });
    chatid.value = chats.value[0].id;
  }

  await loadMessages(true);
  chatsStore.startStream();
}

fetch();

let timeout;
function setPlaceholderVisible(replies) {
  const isUserSent = replies.at(-1)?.from || replies.length === 1;

  if (!isAdminSent(replies.at(-1) ?? {}) && isUserSent) {
    timeout = setTimeout(async () => {
      isPlaceholderVisible.value = true;

      await nextTick();
      scrollToBottom(0);
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

function isDateVisible(replies, i) {
  if (i === 0) return true;
  return replies[i - 1].date.split(" ")[0] !== replies[i].date.split(" ")[0];
}

function isAdminSent(reply) {
  return reply.requestor_type !== "Owner";
}

function isEditable(reply) {
  return reply.userid === authStore.userdata.uuid;
}

async function loadMessages(update) {
  const result = chatsStore.messages[chatid.value];

  if (!update && result) {
    replies.value = result.replies ?? [];

    scrollToBottom(100);

    if (chatsStore.chats.get(chatid.value)) {
      chatsStore.chats.get(chatid.value).meta.unread = 0;
    }
    return;
  }

  isLoading.value = true;
  try {
    const response = await chatsStore.fetchMessages(chatid.value);

    replies.value = response.replies ?? [];

    replies.value.sort((a, b) => Number(a.sent - b.sent));
    chatsStore.messages[chatid.value] = response;
  } finally {
    scrollToBottom(0);
    isLoading.value = false;

    if (chatsStore.chats.get(chatid.value)) {
      chatsStore.chats.get(chatid.value).meta.unread = 0;
    }
  }
}

function scrollToBottom(timeout = 0) {
  setTimeout(() => {
    if (!content.value) return;

    content.value?.scrollTo(0, content.value?.scrollHeight);
  }, timeout);
}

function reload() {
  isLoading.value = true;
  loadMessages(true);
}
appStore.setOnRefreshClick(reload);

function deleteMessage(message) {
  replies.value.splice(replies.value.indexOf(message), 1);
}

function resendMessage(reply) {
  deleteMessage(reply);
  footer.value.message = reply.message;
  footer.value.sendMessage();
}

const showScrollToBottom = ref(false);

function onScroll() {
  const el = content.value;
  if (!el) return;

  showScrollToBottom.value =
    el.scrollHeight - el.scrollTop - el.clientHeight > 300;
}

const openChatInFullscreen = () => {
  router.replace({ query: { fullscreen: "true" } });
};

const closeChatFromFullscreen = () => {
  router.replace({ query: { fullscreen: "false" } });
};

const openInstancePage = () => {
  router.push({
    name: "openaiPage",
    params: { id: instance.value.uuid },
  });
};

const openCreateChatPage = () => {
  router.replace({
    query: { create: true },
  });
};

onBeforeUnmount(() => {
  content.value?.removeEventListener("scroll", onScroll);
});

watch(content, (el) => {
  if (!el) return;

  el.addEventListener("scroll", onScroll);
});

watch(
  () => chat.value?.topic,
  (newTopic) => {
    if (newTopic) {
      customHeaderTitle.value = newTopic;
    } else {
      customHeaderTitle.value = "";
    }
  }
);

onBeforeUnmount(() => (customHeaderTitle.value = ""));
</script>

<script>
export default { name: "OpenaiChat" };
</script>

<style scoped>
.chat {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto 1fr auto;
  justify-content: center;
  gap: 10px;
  height: 100%;
  background: var(--bright_bg);
}

.chat__list {
  height: 100%;
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
  max-width: 1000px;
  margin: auto;
}

.chat__container {
  width: 100%;
  height: 100%;
  padding: 15px 15px 6px;
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
  max-width: calc(100% - 50px);
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

.video {
  max-height: 100%;
  max-width: 100%;
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

.chats_sidebar {
  max-width: max(min(35vw, 400px));
  grid-row: 1 / 4;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  overflow: hidden;
}
.chats_sidebar.collapsed {
  width: 50px;
}

.chats_search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px 0px 10px;
  margin-bottom: 10px;
}

.chats_actions {
  display: flex;
  flex-direction: column;
  row-gap: 5px;
  margin-bottom: 10px;
  padding: 5px 10px 0px 10px;
}
.chats_action_btn {
  display: flex;
  align-items: center;
}

.chats_action_btn .icon {
  font-size: 20px;
}

@media (max-width: 768px) {
  .chat__content {
    margin: 0;
    border: 0;
    border-radius: 0;
  }

  .chat__footer {
    grid-column: 1;
    padding: 0 10px 10px;
  }

  .chats_sidebar {
    max-width: 100vw;
  }

  .chat__subheader.chats_opened {
    display: none;
  }

  .chat__content.chats_opened {
    display: none;
  }
}

.scroll-to-bottom {
  position: absolute;
  bottom: 160px;
  z-index: 10;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.chat__subheader_container {
  position: relative;
}

.chat__subheader {
  position: absolute;
  top: 25px;
  right: 25px;
  display: flex;
  z-index: 100;
  justify-content: center;
  align-items: center;
}

.chat__subheader_model {
  border-color: var(--main);
  margin-inline-end: 0px;
  color: var(--main);
  font-size: 1rem;
  padding: 5px;
  height: 30px;
  margin-right: 10px;
}
</style>
