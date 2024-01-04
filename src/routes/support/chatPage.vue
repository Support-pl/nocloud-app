<template>
  <div class="chat">
    <div class="chat__header">
      <div class="chat__container">
        <div class="chat__back">
          <div class="icon__wrapper" @click="goBack">
            <left-icon />
          </div>
        </div>
        <div class="chat__title">
          {{ titleDecoded }}
        </div>
        <div class="chat__actions">
          <div
            class="icon__wrapper"
            :class="{ active: supportStore.isAddingTicket }"
            @click="supportStore.isAddingTicket = !supportStore.isAddingTicket"
          >
            <plus-icon />
          </div>

          <div
            class="icon__wrapper"
            :style="(searchString.length > 0) ? {
              borderRadius: '50%',
              background: 'var(--bright_bg)',
              color: 'var(--main)'
            } : null"
          >
            <a-popover arrow-point-at-center placement="left" :align="{ offset: [-10, 0] }">
              <template #content>
                <a-input-search
                  v-model:value="text"
                  enter-button
                  placeholder="Topic"
                  @update:value="search"
                >
                  <template #suffix>
                    <div style="cursor: pointer" @click="text = ''">
                      <plus-icon style="color: rgba(0, 0, 0, 0.45)" :rotate="45" />
                    </div>
                  </template>
                </a-input-search>
              </template>
              <search-icon />
            </a-popover>
          </div>

          <div class="icon__wrapper" @click="reload">
            <reload-icon />
          </div>
        </div>
      </div>
      <add-ticket v-if="supportStore.isAddingTicket" :instance-id="$route.query.from" />
    </div>

    <a-alert
      v-if="!isLoading"
      ref="notification"
      type="info"
      class="chat__notification"
    >
      <template #message>
        {{ $t('You can also choose another way of communication') }}
        <plus-icon v-if="isVisible" :rotate="45" @click="isVisible = false" />
        <down-icon v-else @click="isVisible = true" />
      </template>

      <template v-if="isVisible" #description>
        <div class="order__grid">
          <div
            v-for="gate of options"
            :key="gate.id"
            class="order__slider-item"
            :value="gate.id"
            :class="{ 'order__slider-item--active': gateway === gate.id }"
            @click="changeGateway(gate.id)"
          >
            <span class="order__slider-name" :title="gate.name">
              <img class="img_prod" :src="`/img/icons/${getImageName(gate.id)}.png`" :alt="gate.id" @error="onError">
              {{ gate.name }}
            </span>
          </div>
        </div>

        <a-button
          type="primary"
          style="display: block; margin-top: 10px"
          :loading="isEditLoading"
          @click="updateChat"
        >
          OK
        </a-button>
      </template>
    </a-alert>

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

    <div class="chat__list">
      <ticket-item
        v-for="item of chats"
        :key="item.id"
        :ticket="item"
        :style="(item.id === chatid) ? 'filter: brightness(0.9)' : null"
        compact
      />
    </div>

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
          id="message"
          v-model:value="messageInput"
          allow-clear
          type="text"
          name="message"
          :disabled="status == 'Closed'"
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
  </div>
</template>

<script>
import { defineAsyncComponent, nextTick } from 'vue'
import { mapStores } from 'pinia'
import markdown from 'markdown-it'
import { full as emoji } from 'markdown-it-emoji'
import { Status } from '@/libs/cc_connect/cc_pb'
import { debounce } from '@/functions.js'

import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'
import { useChatsStore } from '@/stores/chats.js'
import { useSupportStore } from '@/stores/support.js'

import loading from '@/components/ui/loading.vue'
import ticketItem from '@/components/support/ticketItem.vue'
import addTicket from '@/components/support/addTicket.vue'

const leftIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/LeftOutlined')
)
const reloadIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/ReloadOutlined')
)
const downIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/DownOutlined')
)

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
const arrowUpIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/ArrowUpOutlined')
)
const plusIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/PlusOutlined')
)
const searchIcon = defineAsyncComponent(
  () => import('@ant-design/icons-vue/SearchOutlined')
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
    addTicket,

    leftIcon,
    reloadIcon,
    downIcon,

    exclamationIcon,
    copyIcon,
    editIcon,

    loadingIcon,
    arrowUpIcon,
    plusIcon,
    searchIcon
  },
  beforeRouteUpdate (to, from, next) {
    this.chatid = to.params.id
    this.loadMessages()
    next()
  },
  data () {
    return {
      cachedChats: {},
      status: null,
      subject: 'SUPPORT',
      replies: [],
      messageInput: '',
      isLoading: true,
      chatid: this.$route.params.id,
      showSendFiles: false,
      editing: null,
      gateway: '',
      text: '',
      searchString: '',
      isVisible: false,
      isEditLoading: false,
      chatPaddingTop: '15px'
    }
  },
  computed: {
    ...mapStores(useAppStore, useAuthStore, useChatsStore, useSupportStore),
    titleDecoded () {
      const txt = document.createElement('textarea')
      txt.innerHTML = this.subject
      return txt.value
    },
    chat () {
      return this.chatsStore.chats.get(this.chatid)
    },
    chats () {
      const result = []
      const { uuid } = this.authStore.billingUser

      this.chatsStore.getChats.forEach((ticket) => {
        const instance = ticket.meta.data.instance?.kind.value ?? {}
        const { from } = this.$route.query
        if (instance !== from && from) return

        const string = this.searchString.toLowerCase()
        const topic = ticket.topic.toLowerCase()
        if (!topic.includes(string)) return

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

        result.push(value)
      })

      result.sort((a, b) => b.date - a.date)

      return [...result, ...this.supportStore.getTickets]
    },
    messages () {
      const chatMessages = this.chatsStore.messages
      const tickets = this.replies.filter(({ uuid }) =>
        !chatMessages.find((message) => message.uuid === uuid)
      )

      return [...tickets, ...chatMessages]
    },
    options () {
      const { gateways = [] } = this.chatsStore.getDefaults ?? {}
      let result = gateways.map((gateway) => ({
        id: gateway,
        name: `${gateway[0].toUpperCase()}${gateway.toLowerCase().slice(1)}`
      }))

      if (this.$route.query.from) {
        result = result.filter(({ id }) => id === 'telegram')
      }

      return result
    }
  },
  watch: {
    chat (value) {
      this.gateway = value.gateways[0] ?? ''
    },
    isLoading (value) {
      if (value) return
      nextTick(() => {
        this.chatPaddingTop = `${this.$refs.notification?.$el.offsetHeight + 15}px`
      })
    },
    messages: {
      handler () {
        nextTick(() => {
          if (!this.$refs?.content) return
          this.$refs.content.scrollTo(0, this.$refs.content.scrollHeight)
        })
      },
      deep: true
    }
  },
  async mounted () {
    await this.chatsStore.fetchChats()
    this.chatsStore.startStream()
    this.chatsStore.fetchDefaults()
    this.loadMessages()

    window.addEventListener('resize', () => {
      this.chatPaddingTop = `${this.$refs.notification?.$el.offsetHeight + 15}px`
    })

    if (localStorage.getItem('gateway')) {
      this.gateway = localStorage.getItem('gateway')
      this.isVisible = true

      this.updateChat()
      localStorage.removeItem('gateway')
    }

    this.search = debounce(() => { this.searchString = this.text }, 200)
  },
  methods: {
    search () {},
    goBack () {
      if (this.$route.query.from) {
        const params = { id: this.$route.query.from }

        this.$router.push({ name: 'service', params })
      } else {
        this.$router.push({ name: 'support' })
      }
    },
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
    newLine () {
      this.messageInput.replace(/$/, '\n')
    },
    isAdminSent (reply) {
      return reply.requestor_type !== 'Owner'
    },
    isEditable (reply) {
      return reply.userid === this.authStore.userdata.uuid
    },
    sendMessage () {
      if (this.messageInput.trim().length < 1) return
      if (this.status === 'Closed') return
      if (this.editing) {
        this.editMessage(this.editing)
        return
      }

      const message = {
        admin: '',
        attachment: '',
        contactid: '0',
        date: Date.now(),
        email: this.authStore.userdata.data?.email ?? 'none',
        message: md.render(this.messageInput).trim().replace(/^<p>/, '').replace(/<\/p>$/, ''),
        name: this.authStore.userdata.title,
        userid: this.authStore.userdata.uuid,
        sending: true
      }

      const date = this.appStore.toDate(message.date / 1000, '-', true, true)

      this.replies.push({ ...message, date, requestor_type: 'Owner' })

      if (this.replies[0].gateways) {
        this.chatsStore.sendMessage({
          uuid: this.$route.params.id,
          content: message.message,
          account: message.userid,
          date: BigInt(message.date)
        })
          .then(({ uuid }) => {
            this.replies[this.replies.length - 1].uuid = uuid
          })
          .catch((err) => {
            this.replies[this.replies.length - 1].error = true
            console.error(err)
          })
          .finally(() => {
            this.replies[this.replies.length - 1].sending = false
          })
        this.messageInput = ''
        return
      }

      this.$api.get(this.authStore.baseURL, {
        params: {
          run: 'answer_ticket',
          id: this.$route.params.id,
          message: this.messageInput
        }
      })
        .catch((err) => {
          this.replies[this.replies.length - 1].error = true
          console.error(err)
        })
        .finally(() => {
          this.replies[this.replies.length - 1].sending = false
        })
      this.messageInput = ''
    },
    loadMessages (update) {
      if (!update && this.cachedChats[this.chatid]) {
        const result = this.cachedChats[this.chatid]

        this.status = result.status
        this.replies = result.replies
        this.subject = result.subject

        setTimeout(() => {
          this.$refs.content.scrollTo(0, this.$refs.content.scrollHeight)
        })
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
          this.cachedChats[this.chatid] = resp
        })
        .finally(() => {
          setTimeout(() => {
            this.$refs.content.scrollTo(0, this.$refs.content.scrollHeight)
          })
          this.isLoading = false
        })
    },
    reload () {
      this.isLoading = true
      this.loadMessages(true)
    },
    objectToParams (object) {
      return Object.entries(object)
        .map(([key, val]) => `${key}=${encodeURIComponent(val)}`)
        .join('&')
    },
    deleteMessage (message) {
      this.replies.splice(this.replies.indexOf(message), 1)
    },
    resendMessage (message) {
      this.deleteMessage(message)
      this.messageInput = message.message
      this.sendMessage()
    },
    editMessage (uuid) {
      this.chatsStore.editMessage({
        content: this.messageInput, uuid
      })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message

          this.$notification.error({ message: this.$t(message) })
          console.error(err)
        })

      this.editing = null
      this.messageInput = ''
    },
    changeEditing (message = {}) {
      this.editing = message.uuid ?? null
      this.messageInput = message.message ?? ''
      document.getElementById('message').focus()
    },
    getMessage (uuid) {
      return this.replies?.find((reply) => reply.uuid === uuid)?.message
    },
    updateChat () {
      this.isEditLoading = true
      if (!this.authStore.userdata.data.telegram) {
        this.$router.push({ name: 'handsfree' })
      }

      this.chatsStore.changeGateway({
        ...this.chat, gateways: [this.gateway]
      })
        .then(() => {
          this.$notification.success({ message: this.$t('Done') })
        })
        .catch((err) => {
          const message = err.response?.data?.message ?? err.message

          this.$notification.error({ message: this.$t(message) })
          console.error(err)
        })
        .finally(() => {
          this.isEditLoading = false
          this.supportStore.isAddingTicket = false
        })
    },
    changeGateway (value) {
      if (this.gateway === value) {
        this.gateway = ''
      } else {
        this.gateway = value
      }
    },
    onError ({ target }) {
      target.src = '/img/OS/default.png'
    },
    getImageName (name) {
      return name.toLowerCase().replace(/[-_\d]/g, ' ').split(' ')[0]
    },
    addToClipboard (text) {
      if (navigator?.clipboard) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            this.$notification.success({
              message: this.$t('Text copied')
            })
          })
          .catch((res) => {
            console.error(res)
          })
      } else {
        this.$notification.error({
          message: this.$t('Clipboard is not supported')
        })
      }
    }
  }
}
</script>

<style>
.chat {
  position: relative;
  display: grid;
  grid-template-columns: min(400px, 35vw - 20px) min(768px, 65vw - 20px);
  grid-template-rows: 1fr auto;
  justify-content: center;
  gap: 10px 20px;
  height: 100%;
  padding-top: 64px;
  background: var(--bright_bg);
}

.chat__header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  line-height: 64px;
  background-color: var(--main);
  color: var(--bright_font);
}

.chat__container {
  padding: 0;
  display: grid;
  grid-template-columns: 20% 1fr 20%;
  justify-items: center;
  align-items: center;
  gap: 5px;
  max-width: calc(768px + 400px + 20px);
  height: 100%;
  width: 100%;
  margin: 0 auto;
}

.chat__tag {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-column: 1 / 3;
  padding: 5px 7px;
  margin-right: auto;
  font-size: 18px;
}

.chat__notification {
  position: absolute;
  right: max(25px, (100vw - 1158px) / 2);
  top: 87px;
  z-index: 10;
  width: 100%;
  max-width: min(65vw - 50px, 768px - 30px);
  transition: .3s;
}

.chat__notification.ant-alert-with-description {
  padding: 15px;
}

.chat__notification .ant-alert-message {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 14px;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider {
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 10px;
  overflow-x: auto;
}

.order__slider-item {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .15);
  height: 100%;
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1rem;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .2);
}

.order__slider-item--active {
  background-color: #1045b4;
  color: var(--bright_font);
}

.order__grid .order__slider-name > .img_prod {
  display: block;
  max-height: 20px;
}

.order__grid .order__slider-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.chat__title {
  font-weight: bold;
  line-height: 1.1rem;
}

.chat__back {
  justify-self: start;
}

.chat__actions {
  display: flex;
  justify-self: end;
}

.chat__back,
.chat__actions > .icon__wrapper {
  font-size: 1.4rem;
  cursor: pointer;
}

.icon__wrapper.active {
  background-color: var(--bright_bg);
  color: var(--main);
  transform: rotate(45deg);
}

.chat__list {
  grid-row: 1 / 3;
  padding-top: 10px;
  overflow: scroll;
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

.chat__input .ant-input-textarea-clear-icon {
  margin: 9px 2px 0 0;
}

.chat__send {
  background-color: var(--main);
  color: var(--bright_font);
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

.chat__content {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  max-width: 768px;
  width: 100%;
  height: 100%;
  margin: 10px auto 0;
  padding: v-bind(chatPaddingTop) 15px 6px;

  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: auto;
  background: var(--bright_font);
}

.chat__tooltip .ant-popover-inner {
  padding: 6px 8px;
}

.chat__tooltip.error .ant-popover-inner,
.chat__tooltip.error .ant-popover-arrow {
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
  color: var(--bright_font);
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

  .chat__notification {
    right: 15px;
    max-width: calc(100% - 30px);
  }

  .chat__list {
    display: none;
  }

  .chat__footer {
    grid-column: 1;
    padding: 0 10px 10px 0;
  }
}

@media screen and (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
