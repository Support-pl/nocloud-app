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
            <a-popover v-if="reply.error" :title="$t('Send error')">
              <template #content>
                <a class="popover-link" @click="deleteMessage(reply)">
                  {{ $t("chat_Delete_message") }}
                </a>
                <a class="popover-link" @click="resendMessage(reply)">
                  {{ $t("chat_Resend_message") }}
                </a>
              </template>
              <exclamation-icon class="msgStatus error" />
            </a-popover>

            <template v-else>
              <div style="cursor: pointer" @click="addToClipboard(reply.message)">
                <copy-icon /> {{ capitalize($t('copy')) }}
              </div>
              <div
                v-if="isEditable(reply)"
                style="cursor: pointer; margin-top: 5px"
                @click="changeEditing(reply)"
              >
                <edit-icon /> {{ capitalize($t('edit')) }}
              </div>
            </template>
          </template>

          <div
            :key="`${i}_message`"
            class="chat__message"
            :class="[
              isAdminSent(reply) ? 'chat__message--in' : 'chat__message--out',
            ]"
          >
            <pre v-html="beauty(reply.message)" />
            <div class="chat__info">
              <span>{{ reply.name }}</span>
              <span>{{ reply.date.slice(-8, -3) }}</span>
            </div>
            <loading-icon v-if="reply.sending" class="msgStatus loading" />
          </div>
        </a-popover>
      </template>
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

    <support-footer ref="footer" v-model:replies="replies" :status="status" />
  </div>
</template>

<script>
import { defineAsyncComponent, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { mapStores } from 'pinia'
import markdown from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'

import { Status } from '@/libs/cc_connect/cc_pb'
import { useClipboard } from '@/hooks/utils'
import { toDate } from '@/functions.js'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'

import loading from '@/components/ui/loading.vue'
import ticketItem from '@/components/support/ticketItem.vue'
import supportHeader from '@/components/support/header.vue'
import supportAlert from '@/components/support/alert.vue'
import supportFooter from '@/components/support/footer.vue'

const exclamationIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/ExclamationCircleOutlined')
)
const copyIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/CopyOutlined')
)
const editIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/EditOutlined')
)

const loadingIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LoadingOutlined')
)

const md = markdown({
  html: true,
  linkify: true,
  typographer: true
})

md.use(emoji)

export default {
  name: 'TicketChat',
  components: {
    loading,
    ticketItem,
    supportAlert,
    supportHeader,
    supportFooter,

    exclamationIcon,
    copyIcon,
    editIcon,
    loadingIcon
  },
  beforeRouteUpdate (to, from, next) {
    this.chatid = to.params.id
    this.loadMessages()
    next()
  },
  setup () {
    const route = useRoute()
    const { addToClipboard } = useClipboard()

    return {
      addToClipboard,
      status: ref(null),
      subject: ref('SUPPORT'),
      replies: ref([]),

      isLoading: ref(false),
      chatid: ref(route.params.id),
      searchString: ref(''),
      chatPaddingTop: ref('15px')
    }
  },
  computed: {
    ...mapStores(useAppStore, useAuthStore, useChatsStore, useSupportStore),
    chat () {
      return this.chatsStore.chats.get(this.chatid)
    },
    chats () {
      const ids = []
      const result = []
      const { uuid } = this.authStore.billingUser

      this.chatsStore.chats.forEach((ticket) => {
        const { whmcs, instance: inst } = ticket.meta.data
        const instance = (inst?.kind.case) ? inst?.toJSON() : null

        const { from } = this.$route.query
        if (instance !== from && from) return

        const string = this.searchString.toLowerCase()
        const topic = ticket.topic.toLowerCase()
        if (!topic.includes(string) && string !== '') return

        const isReaded = ticket.meta.lastMessage?.readers.includes(uuid)
        const status = Status[ticket.status].toLowerCase().split('_')
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
        if (!inst) result.push(value)
      })

      result.sort((a, b) => b.date - a.date)
      const tickets = this.supportStore.getTickets
        .filter(({ id }) => !ids.includes(id))

      return [...result, ...tickets]
    }
  },
  watch: {
    chats: {
      async handler () {
        await nextTick()
        if (!this.$refs?.chatList) return
        const { scrollHeight, clientHeight, lastElementChild } = this.$refs.chatList

        if (scrollHeight > clientHeight || !lastElementChild) return
        lastElementChild.style.borderBottom = '1px solid var(--border_color)'
      },
      deep: true
    },
    replies: {
      async handler () {
        await nextTick()

        if (!this.$refs?.content) return
        this.$refs.content.scrollTo(0, this.$refs.content.scrollHeight)
      },
      deep: true
    }
  },
  async mounted () {
    try {
      await this.supportStore.fetch()
    } catch (error) {
      console.error(error)
    }

    await this.chatsStore.fetchChats()
    this.chatsStore.startStream()
    this.chatsStore.fetchDefaults()
    this.loadMessages()
  },
  methods: {
    toDate,
    beauty (message) {
      message = md.render(message).trim()
      message = message.replace(/\n/g, '<br>')
      message = message.replace(/[\s\uFEFF\xA0]{2,}/g, ' ')
      message = message.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')

      return message.replace(/^<p>/, '').replace(/<\/p>$/, '')
    },
    isDateVisible (replies, i) {
      if (i === 0) return true
      return replies[i - 1].date.split(' ')[0] !== replies[i].date.split(' ')[0]
    },
    isAdminSent (reply) {
      return reply.requestor_type !== 'Owner'
    },
    isEditable (reply) {
      return reply.userid === this.authStore.userdata.uuid
    },
    loadMessages (update) {
      const result = this.chatsStore.messages[this.chatid]

      if (!update && result) {
        this.status = result.status
        this.replies = result.replies
        this.subject = result.subject

        setTimeout(() => {
          this.$refs.content.scrollTo(0, this.$refs.content.scrollHeight)
        })

        if (this.chatsStore.chats.get(this.chatid)) {
          this.chatsStore.chats.get(this.chatid).meta.unread = 0
        }
        return
      }

      this.isLoading = true
      const response = (this.chatsStore.chats.get(this.chatid))
        ? this.chatsStore.fetchMessages(this.chatid)
        : this.$api.get(this.authStore.baseURL, {
          params: {
            run: 'get_ticket_full',
            ticket_id: this.chatid
          }
        })

      response
        .then((resp) => {
          this.status = resp.status
          this.replies = resp.replies ?? []
          this.subject = resp.subject

          this.replies.sort((a, b) => Number(a.sent - b.sent))
          this.chatsStore.messages[this.chatid] = resp
        })
        .finally(() => {
          setTimeout(() => {
            this.$refs.content.scrollTo(0, this.$refs.content.scrollHeight)
          })
          this.isLoading = false

          if (this.chatsStore.chats.get(this.chatid)) {
            this.chatsStore.chats.get(this.chatid).meta.unread = 0
          }
        })
    },
    reload () {
      this.isLoading = true
      this.loadMessages(true)
    },
    deleteMessage (message) {
      this.replies.splice(this.replies.indexOf(message), 1)
    },
    resendMessage (reply) {
      this.deleteMessage(reply)
      this.$refs.footer.message = reply.message
      this.$refs.footer.sendMessage()
    }
  }
}
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
  padding: v-bind(chatPaddingTop) 15px 6px;

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
  white-space: pre-wrap;
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
  position: static;
  width: 20px;
  height: 20px;
  line-height: 1.9;
  border-radius: 50%;
  background: var(--err);
  color: var(--bright_font);
  cursor: pointer;
  transform: translate(15px, 5px);
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
  justify-self: start;
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
}

:deep(.chat__files .files__preview > img) {
  height: 100%;
  width: auto;
  max-width: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .chat {
    grid-template-columns: 1fr;
  }

  .chat__list {
    display: none;
  }

  .chat__footer {
    grid-column: 1;
    padding: 0 10px 10px 0;
  }
}
</style>
