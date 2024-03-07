<template>
  <div class="chat__footer">
    <div
      class="chat__container"
      style="grid-template-columns: 1fr auto; align-items: end"
    >
      <a-tag
        v-if="editing"
        closable
        color="blue"
        class="chat__tag"
        @close="changeEditing"
      >
        <span style="margin-bottom: 7px">{{ capitalize($t('editing')) }}:</span>
        <span style="font-size: 14px; grid-column: 1 / 3; order: 1; white-space: normal">
          {{ getMessage(editing) }}
        </span>
      </a-tag>

      <a-textarea
        ref="textarea"
        v-model:value="message"
        allow-clear
        type="text"
        :disabled="status === 'Closed'"
        :auto-size="{ minRows: 2, maxRows: 100 }"
        :placeholder="$t('message') + '...'"
        @keyup.shift.enter.exact="newLine"
        @keydown.enter.exact.prevent="sendMessage"
      />
      <div class="chat__send" @click="sendMessage">
        <arrow-up-icon />
      </div>
      <div v-if="showSendFiles" class="chat__send">
        <plus-icon />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import markdown from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'

import { useAuthStore } from '@/stores/auth.js'
import { useChatsStore } from '@/stores/chats.js'

import { useNotification } from '@/hooks/utils'
import { toDate } from '@/functions.js'
import api from '@/api.js'

const md = markdown({
  html: true,
  linkify: true,
  typographer: true
})
md.use(emoji)

const arrowUpIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/ArrowUpOutlined')
)
const plusIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/PlusOutlined')
)

const props = defineProps({
  replies: { type: Array, required: true },
  status: { type: [String, Number], default: 'Unknown' }
})
const emits = defineEmits(['update:replies'])

const route = useRoute()
const i18n = useI18n()
const authStore = useAuthStore()
const chatsStore = useChatsStore()
const { openNotification } = useNotification()

const textarea = ref()
const message = ref('')
const editing = ref(false)
const showSendFiles = ref(false)

function newLine () {
  message.value.replace(/$/, '\n')
}

function updateReplies () {
  const result = {
    admin: '',
    attachment: '',
    contactid: '0',
    date: Date.now(),
    email: authStore.userdata.data?.email ?? 'none',
    message: md.render(message.value).trim().replace(/^<p>/, '').replace(/<\/p>$/, ''),
    name: authStore.userdata.title,
    userid: authStore.userdata.uuid,
    sending: true
  }

  const date = toDate(result.date / 1000, '-', true, true)
  const replies = [...props.replies]

  replies.push({ ...result, date, requestor_type: 'Owner' })
  emits('update:replies', replies)

  return { replies, result }
}

async function sendChatMessage (result, replies) {
  await nextTick()
  try {
    const { uuid } = await chatsStore.sendMessage({
      uuid: route.params.id,
      content: result.message,
      account: result.userid,
      date: BigInt(result.date)
    })

    replies[replies.length - 1].uuid = uuid
    emits('update:replies', replies)
  } catch {
    replies[replies.length - 1].error = true
    emits('update:replies', replies)
  } finally {
    replies[replies.length - 1].sending = false
    emits('update:replies', replies)
  }
}

async function sendTicket (replies) {
  await nextTick()
  try {
    await api.get(authStore.baseURL, {
      params: {
        run: 'answer_ticket',
        id: route.params.id,
        message: message.value
      }
    })
  } catch (error) {
    replies[replies.length - 1].error = true
    emits('update:replies', replies)
    console.error(error)
  } finally {
    replies[replies.length - 1].sending = false
    emits('update:replies', replies)
  }
}

function sendMessage () {
  if (message.value.trim().length < 1) return
  if (props.status === 'Closed') return
  if (editing.value) {
    editMessage(editing.value)
    return
  }

  const { replies, result } = updateReplies()
  if (props.replies[0].gateways) {
    sendChatMessage(result, replies)
  } else {
    sendTicket(replies)
  }
  message.value = ''
}

function editMessage (uuid) {
  chatsStore.editMessage({
    content: message.value, uuid
  })
    .catch((err) => {
      const message = err.response?.data?.message ?? err.message

      openNotification('error', { message: i18n.t(message) })
      console.error(err)
    })

  editing.value = null
  message.value = ''
}

function changeEditing (message = {}) {
  editing.value = message.uuid ?? null
  message.value = message.message ?? ''
  document.getElementById('message').focus()
}

function getMessage (uuid) {
  return props.replies?.find((reply) => reply.uuid === uuid)?.message
}
</script>

<script>
export default { name: 'SupportFooter' }
</script>

<style scoped>
.chat__tag {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-column: 1 / 3;
  padding: 5px 7px;
  margin-right: auto;
  font-size: 18px;
}

.chat__footer {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  grid-column: 2;
  padding: 10px 0;
  background-color: var(--bright_bg);
}

.chat__input {
  max-width: 725px;
  border: 0;
  outline: 0;
  border-radius: 40px;
  flex: 1 0;
  padding: 7px 0;
}

.chat__input textarea {
  max-height: calc(50vh - 34px) !important;
}

.chat__input :deep(.ant-input-textarea-clear-icon) {
  margin: 9px 2px 0 0;
}

:deep(textarea.ant-input) {
  border-color: var(--border_color);
}

.chat__send {
  background-color: var(--main);
  color: var(--gloomy_font);
  border-radius: 50%;
  height: 35px;
  width: 35px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 5px;
  margin-bottom: 10px;
  font-size: 1.2rem;
  transition: filter 0.2s ease;
  cursor: pointer;
}

.chat__send:hover {
  filter: brightness(1.05);
}

.chat__send:active {
  filter: brightness(0.95);
}
</style>
