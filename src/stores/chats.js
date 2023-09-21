import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { createPromiseClient } from '@bufbuild/connect'
import { createGrpcWebTransport } from '@bufbuild/connect-web'
import { Value } from '@bufbuild/protobuf'

import { useAuthStore } from './auth.js'
import {
  Empty, Chat, Message, ChatMeta, Role, Kind, EventType, Users, User, Status
} from '@/libs/cc_connect/cc_pb'
import {
  ChatsAPI, MessagesAPI, StreamService, UsersAPI
} from '@/libs/cc_connect/cc_connect'

function toDate (timestamp) {
  const date = new Date(timestamp)
  const time = date.toTimeString().split(' ')[0]
  const year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()

  if (`${month}`.length < 2) month = `0${month}`
  if (`${day}`.length < 2) day = `0${day}`

  return `${year}-${month}-${day} ${time}`
}

function changeMessage (message, user, uuid) {
  return {
    uuid: message.uuid,
    date: toDate(Number(message.sent)),
    sent: message.sent,
    email: user.data?.email ?? 'none',
    message: message.content.trim(),
    name: user.title ?? 'anonymous',
    userid: user.uuid,
    requestor_type: (uuid === user.uuid) ? 'Owner' : 'Other',
    gateways: message.gateways
  }
}

export const useChatsStore = defineStore('chats', () => {
  const store = useAuthStore()

  const transport = ref(null)
  const stream = ref(null)

  const accounts = ref(null)
  const defaults = ref({})
  const chats = ref(new Map())

  const messages = ref([])
  const rawMessages = ref([])

  const getChats = computed(({ support }) => {
    if (support.filter[0] === 'all' || support.filter.length === 0) {
      return chats.value
    } else {
      const filters = support.filter.map((el) => {
        if (!el.includes(' ')) return el
        return el.split(' ').map((el) =>
          `${el[0].toUpperCase()}${el.slice(1)}`
        ).join('-')
      })
      const result = []

      chats.value.forEach((chat) => {
        const status = Status[chat.status].toLowerCase()
        const capitalized = `${status[0].toUpperCase()}${status.slice(1)}`

        if (filters.includes(capitalized)) {
          result.push(chat)
        }
      })

      return result
    }
  })

  const getDefaults = computed(() => ({
    ...defaults.value,
    departments: defaults.value.departments?.map(
      ({ admins, title, key }) => ({ id: key, admins, name: title })
    ) ?? []
  }))

  function updateChat (event) {
    const { value: chat } = event.item

    switch (event.type) {
      case EventType.CHAT_READ:
      case EventType.CHAT_CREATED:
      case EventType.CHAT_UPDATED:
        chats.value.set(chat.uuid, chat)
        break

      case EventType.CHAT_DELETED:
        chats.value.delete(chat.uuid)
        break
    }
  }

  function updateMessage (event) {
    const { value: message } = event.item
    const i = messages.value.findIndex(({ uuid }) => uuid === message.uuid)
    const user = accounts.value.users.find(
      (account) => account.uuid === message.sender
    ) ?? {}
    const newMessage = changeMessage(message, user, event.uuid)

    if (event.item.case === 'chat') return
    switch (event.type) {
      case EventType.MESSAGE_SENT: {
        const chat = chats.value.get(message.chat)

        // messages.value.push(newMessage);
        chat.meta = new ChatMeta({
          unread: chat.meta.unread + 1,
          lastMessage: message
        })
        break
      }
      case EventType.MESSAGE_UPDATED: {
        messages.value.splice(i, 1, newMessage)
        chats.value.get(message.chat).meta.unread++
        break
      }

      case EventType.MESSAGE_DELETED: {
        messages.value.splice(i, 1)
        break
      }
    }
  }

  function createTransport () {
    const newTransport = createGrpcWebTransport({
      baseUrl: (VUE_APP_BASE_URL.endsWith('/') ? VUE_APP_BASE_URL : `${VUE_APP_BASE_URL}/`),
      interceptors: [
        (next) => async (req) => {
          req.header.set('Authorization', `Bearer ${store.token}`)
          return next(req)
        }
      ]
    })

    transport.value = newTransport
    return newTransport
  }

  return {
    transport,
    accounts,
    stream,
    defaults,
    messages,
    chats,
    rawMessages,

    getChats,
    getDefaults,

    updateChat,
    updateMessage,

    async fetchChats () {
      try {
        if (!transport.value) createTransport()
        const chatsApi = createPromiseClient(ChatsAPI, transport.value)

        const response = await chatsApi.list(new Empty())

        const chatsArray = response.chats.map((chat) =>
          [chat.uuid, (chat.meta) ? chat : { ...chat, meta: new ChatMeta({ unread: 0 }) }]
        )

        chats.value = new Map(chatsArray)
        return chatsArray
      } catch (error) {
        return error
      }
    },

    async fetchMessages (id) {
      try {
        if (!transport.value) createTransport()
        const messagesApi = createPromiseClient(MessagesAPI, transport.value)
        const chat = chats.value.get(id)

        const users = [...chat.users, ...chat.admins].map((uuid) => new User({ uuid }))
        const usersApi = createPromiseClient(UsersAPI, transport.value)
        const usersList = new Users({ users })

        if (!accounts.value) accounts.value = await usersApi.resolve(usersList)
        const response = await messagesApi.get(chat)

        const replies = response.messages.map((message) => {
          const user = accounts.value.users.find(
            (account) => account.uuid === message.sender
          ) ?? {}

          return changeMessage(message, user, store.userdata.uuid)
        })

        messages.value = replies
        rawMessages.value = response.messages

        return { status: chat.status, subject: chat.topic, replies }
      } catch (error) {
        return error
      }
    },

    async startStream () {
      if (stream.value) return
      if (!transport.value) createTransport()

      const streaming = createPromiseClient(StreamService, transport)

      try {
        stream.value = streaming.stream(new Empty())

        for await (const event of stream.value) {
          if (event.type === +EventType.PING) continue
          else if (event.type >= EventType.MESSAGE_SENT) {
            updateMessage({ ...event, uuid: store.userdata.uuid })
          } else {
            updateChat(event)
          }
        }
      } catch (error) {
        console.debug(error)
      }
    },

    async fetchDefaults () {
      try {
        if (!transport.value) createTransport()
        const usersApi = createPromiseClient(UsersAPI, transport.value)
        const response = await usersApi.fetchDefaults(new Empty())

        defaults.value = response
        return response
      } catch (error) {
        console.debug(error)
      }
    },

    async createChat (data) {
      if (!transport.value) createTransport()
      const chatsApi = createPromiseClient(ChatsAPI, transport.value)

      const newChat = new Chat({
        department: data.department,
        gateways: data.gateways ?? defaults.value.gateways,
        admins: data.admins ?? defaults.value.admins,
        users: [store.userdata.uuid],
        topic: data.chat.subject,
        role: Role.OWNER,
        meta: new ChatMeta({
          lastMessage: data.chat.message,
          data: {
            instance: new Value({
              kind: { case: 'stringValue', value: data.chat.instanceId }
            })
          }
        })
      })
      const createdChat = await chatsApi.create(newChat)

      chats.value.set(createdChat.uuid, createdChat)
      return createdChat
    },
    async editChat (chat) {
      if (!transport.value) createTransport()
      const chatsApi = createPromiseClient(ChatsAPI, transport.value)
      const createdChat = await chatsApi.update(chat)

      chats.value.set(createdChat.uuid, createdChat)
      return createdChat
    },

    async sendMessage (message) {
      if (!transport.value) createTransport()
      const messagesApi = createPromiseClient(MessagesAPI, transport.value)

      const newMessage = new Message({
        kind: Kind.DEFAULT,
        underReview: false,
        content: message.content,
        chat: message.uuid,
        sent: message.date,
        sender: message.account
      })

      messagesApi.send(newMessage)
      return newMessage
    },
    async editMessage (message) {
      if (!transport.value) createTransport()
      const messagesApi = createPromiseClient(MessagesAPI, transport.value)

      const newMessage = new Message({
        ...rawMessages.value.find(({ uuid }) => uuid === message.uuid),
        content: message.content
      })

      messagesApi.update(newMessage)
      return newMessage
    }
  }
})
