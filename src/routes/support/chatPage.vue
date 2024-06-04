<template>
  <div class="chat">
    <support-header v-model:searchString="searchString" :chat="chat" :title="subject" @reload="reload" />
    <support-alert v-if="chat" v-model:padding-top="chatPaddingTop" :chat="chat" :is-loading="isLoading" />

    <loading v-if="isLoading" />
    <div v-else ref="content" class="chat__content">
      <template v-for="(reply, i) in replies" :key="i">
        <span v-if="isDateVisible(replies, i)" class="chat__date">
          {{ reply.date.split(' ')[0] }}
        </span>

        <a-popover
          :overlay-class-name="(reply.error) ? 'chat__tooltip error' : 'chat__tooltip'"
          :trigger="(reply.error) ? 'click' : 'hover'"
          :placement="(isAdminSent(reply)) ? 'rightBottom' : 'leftBottom'"
        >
          <template #content>
            <div style="cursor: pointer" @click="addToClipboard(reply.message)">
              <copy-icon /> {{ capitalize($t('copy')) }}
            </div>
            <div
              v-if="isEditable(reply)"
              style="cursor: pointer; margin-top: 5px"
              @click="footer.changeEditing(reply)"
            >
              <edit-icon /> {{ capitalize($t('edit')) }}
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
              <span v-html="beauty(reply.message)" />
              <div class="chat__files">
                <div v-for="file of files[reply.uuid]" :key="file.url" class="files__preview">
                  <img
                    :src="file.url"
                    :alt="file.name"
                    :onerror="onImageError"
                    @click="openModal"
                  >
                </div>
              </div>
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
    </div>

    <div ref="chatList" class="chat__list">
      <ticket-item
        v-for="item of chats"
        :key="item.id"
        :ticket="item"
        :style="(`${item.id}` === `${chatid}`) ? 'filter: contrast(0.8)' : null"
        compact
      />
    </div>

    <a-modal
      :open="currentImage.visible"
      :title="currentImage.alt"
      :footer="null"
      @cancel="currentImage.visible = false"
    >
      <img style="width: 100%" :alt="currentImage.alt" :src="currentImage.src">
    </a-modal>

    <support-footer ref="footer" v-model:replies="replies" :status="status" />
  </div>
</template>

<script setup>
import { defineAsyncComponent, nextTick, ref, computed, watch, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import markdown from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'

import { Status } from '@/libs/cc_connect/cc_pb'
import { useClipboard } from '@/hooks/utils'
import api from '@/api'

import { useAuthStore } from '@/stores/auth.js'
import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'

import loading from '@/components/ui/loading.vue'
import ticketItem from '@/components/support/ticketItem.vue'
import supportHeader from '@/components/support/header.vue'
import supportAlert from '@/components/support/alert.vue'
import supportFooter from '@/components/support/footer.vue'
import typingPlaceholder from '@/components/support/typingPlaceholder.vue'

const exclamationIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/ExclamationCircleOutlined')
)
const copyIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CopyOutlined')
)
const editIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/EditOutlined')
)

const fileIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/FileOutlined')
)
const loadingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoadingOutlined')
)

const route = useRoute()
const { addToClipboard } = useClipboard()
const md = markdown({ html: true, linkify: true, typographer: true }).use(emoji)

const authStore = useAuthStore()
const chatsStore = useChatsStore()
const supportStore = useSupportStore()

onBeforeRouteUpdate((to, from, next) => {
  chatid.value = to.params.id
  loadMessages()
  next()
})

const status = ref(null)
const subject = ref('SUPPORT')
const replies = ref([])

const isLoading = ref(false)
const chatid = ref(route.params.id)
const searchString = ref('')
const chatPaddingTop = ref('15px')
const isPlaceholderVisible = ref(false)

const content = ref()
const chatList = ref()
const footer = ref()

const chat = computed(() =>
  chatsStore.chats.get(chatid.value)
)

const chats = computed(() => {
  const ids = []
  const result = []
  const { uuid } = authStore.billingUser

  chatsStore.chats.forEach((ticket) => {
    const { whmcs, instance: inst } = ticket.meta.data ?? {}
    const instance = (inst?.kind.case) ? inst?.toJSON() : null

    const { from } = route.query
    if (instance !== from && from) return

    const string = searchString.value.toLowerCase()
    const topic = ticket.topic?.toLowerCase() ?? ''
    if (!topic.includes(string) && string !== '') return

    const isReaded = ticket.meta.lastMessage?.readers.includes(uuid)
    const status = Status[ticket.status]?.toLowerCase().split('_') ?? ticket.status
    const capitalized = status.map((el) =>
      `${el[0].toUpperCase()}${el.slice(1)}`
    ).join(' ')

    const value = {
      id: ticket.uuid,
      tid: ticket.uuid.slice(0, 8),
      title: ticket.topic,
      date: Number(ticket.meta.lastMessage?.sent ?? ticket.created),
      message: ticket.meta.lastMessage?.content ?? '',
      status: capitalized,
      unread: (isReaded) ? 0 : ticket.meta.unread
    }
    const id = (whmcs?.kind.case) ? whmcs?.toJSON() : null

    if (id) ids.push(id)
    if (from || (!from && !instance)) result.push(value)
  })

  result.sort((a, b) => b.date - a.date)
  const tickets = supportStore.getTickets.filter(({ id }) => !ids.includes(id))

  if (route.query.from) return result
  return [...result, ...tickets]
})

const files = computed(() =>
  replies.value.reduce((result, { uuid, meta }) => {
    if (meta.attachments) {
      result[uuid] = meta.attachments?.toJSON()
    }

    return result
  }, {})
)

async function onImageError (e) {
  const element = await renderToString(h(fileIcon))
  const parent = e.target.parentElement
  const ext = e.target.alt.split('.').at(-1)

  e.target.outerHTML = `
    ${element}
    <span style="font-size: 14px">${ext}</span>
  `
  parent.classList.add('files__preview--placeholder')
  parent.onclick = () => {
    window.open(e.target.src)
  }
}

watch(chats, async () => {
  await nextTick()
  if (!chatList.value) return
  const { scrollHeight, clientHeight, lastElementChild } = chatList.value

  if (scrollHeight > clientHeight || !lastElementChild) return
  lastElementChild.style.borderBottom = '1px solid var(--border_color)'
}, { deep: true })

watch(replies, async (value, oldValue) => {
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 300))
  setPlaceholderVisible((oldValue.length > 0) ? oldValue : value)

  if (!content.value) return
  content.value.scrollTo(0, content.value.scrollHeight)
}, { deep: true })

watch(() => chatsStore.messages[chatid.value], () => loadMessages(), { deep: true })

async function fetch () {
  isLoading.value = true
  try {
    await supportStore.fetch()
  } catch (error) {
    console.error(error)
  }

  await Promise.all([
    chatsStore.fetchChats(),
    chatsStore.fetchDefaults()
  ])

  await loadMessages(true)
  chatsStore.startStream()
}

fetch()

let timeout
function setPlaceholderVisible (replies) {
  if (chat.value.department !== 'openai') return
  const isUserSent = replies.at(-1)?.from || replies.length === 1

  if (!isAdminSent(replies.at(-1) ?? {}) && isUserSent) {
    timeout = setTimeout(async () => {
      isPlaceholderVisible.value = true

      await nextTick()
      content.value.scrollTo(0, content.value.scrollHeight)
    }, 1000)

    setTimeout(() => {
      clearTimeout(timeout)
      isPlaceholderVisible.value = false
    }, 20 * 1000)
  } else {
    clearTimeout(timeout)
    isPlaceholderVisible.value = false
  }
}

function beauty (message) {
  message = md.render(message).trim()
  message = message.replace(/\n/g, '<br>')
  message = message.replace(/[\s\uFEFF\xA0]{2,}/g, ' ')
  message = message.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')

  return message.replace(/^<p>/, '').replace(/<\/p>$/, '')
}

function isDateVisible (replies, i) {
  if (i === 0) return true
  return replies[i - 1].date.split(' ')[0] !== replies[i].date.split(' ')[0]
}

function isAdminSent (reply) {
  return reply.requestor_type !== 'Owner'
}

function isEditable (reply) {
  return reply.userid === authStore.userdata.uuid
}

async function loadMessages (update) {
  const result = chatsStore.messages[chatid.value]

  if (!update && result) {
    status.value = result.status
    replies.value = result.replies ?? []
    subject.value = result.subject

    setTimeout(() => {
      content.value.scrollTo(0, content.value.scrollHeight)
    }, 100)

    if (chatsStore.chats.get(chatid.value)) {
      chatsStore.chats.get(chatid.value).meta.unread = 0
    }
    return
  }

  isLoading.value = true
  try {
    const response = (chatsStore.chats.get(chatid.value))
      ? await chatsStore.fetchMessages(chatid.value)
      : await api.get(authStore.baseURL, {
        params: { run: 'get_ticket_full', ticket_id: chatid.value }
      })

    status.value = response.status
    replies.value = response.replies ?? []
    subject.value = response.subject

    replies.value.sort((a, b) => Number(a.sent - b.sent))
    chatsStore.messages[chatid.value] = response
  } finally {
    nextTick(() => {
      content.value.scrollTo(0, content.value.scrollHeight)
    })
    isLoading.value = false

    if (chatsStore.chats.get(chatid.value)) {
      chatsStore.chats.get(chatid.value).meta.unread = 0
    }
  }
}

function reload () {
  isLoading.value = true
  loadMessages(true)
}

function deleteMessage (message) {
  replies.value.splice(replies.value.indexOf(message), 1)
}

function resendMessage (reply) {
  deleteMessage(reply)
  footer.value.message = reply.message
  footer.value.sendMessage()
}

const currentImage = ref({})
function openModal (e) {
  currentImage.value.src = e.target.src
  currentImage.value.alt = e.target.alt
  currentImage.value.visible = true
}
</script>

<script>
export default { name: 'TicketChat' }
</script>

<style scoped>
.chat {
  position: relative;
  display: grid;
  grid-template-columns: min(400px, 35vw - 20px) min(768px, 65vw - 20px);
  grid-template-rows: 1fr auto;
  justify-content: center;
  gap: 10px;
  height: 100%;
  padding-top: 64px;
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

  max-width: 768px;
  width: 100%;
  height: 100%;
  margin: 10px auto 0;
  padding: v-bind('chatPaddingTop') 15px 6px;

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

:deep(.chat__files .files__preview--placeholder) {
  flex-direction: column;
  gap: 4px;
  width: 104px;
  height: 90px;
  font-size: 24px;
  border: 1px solid var(--bright_font);
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
