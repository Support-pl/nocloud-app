import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Value } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { createGrpcWebTransport } from '@connectrpc/connect-web'

import { useAuthStore } from './auth.js'
import { useSupportStore } from './support.js'
import { toDate } from '@/functions.js'

import {
  Empty, Chat, Message, ChatMeta, Role, Kind, EventType, Status
} from '@/libs/cc_connect/cc_pb'
import {
  ChatsAPI, MessagesAPI, StreamService, UsersAPI
} from '@/libs/cc_connect/cc_connect'

export const useChatsStore = defineStore('chats', () => {
  const route = useRoute()
  const authStore = useAuthStore()
  const supportStore = useSupportStore()

  const transport = createGrpcWebTransport({
    baseUrl: (VUE_APP_BASE_URL.endsWith('/') ? VUE_APP_BASE_URL : `${VUE_APP_BASE_URL}/`),
    // useBinaryFormat: import.meta.env.PROD,
    interceptors: [
      (next) => async (req) => {
        req.header.set('Authorization', `Bearer ${authStore.token}`)
        return next(req)
      }
    ]
  })
  const stream = ref(null)

  const accounts = ref(null)
  const defaults = ref({})
  const chats = ref(new Map())

  const messages = ref({})
  const rawMessages = ref([])

  const getChats = computed(() => {
    if (supportStore.filter[0] === 'all' || supportStore.filter.length === 0) {
      return chats.value
    } else {
      const filters = supportStore.filter.map((el) => {
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
    departments: defaults.value.departments
      ?.map((dep) => ({ id: dep.key, name: dep.title, ...dep })) ?? []
  }))

  function updateChat (event) {
    const { value: chat } = event.item

    switch (event.type) {
      case EventType.CHAT_READ:
      case EventType.CHAT_CREATED:
        chats.value.set(chat.uuid, chat)

        if (!messages.value[chat.uuid]) {
          messages.value[chat.uuid] = {
            replies: [], status: chat.status, subject: chat.topic
          }
        }
        break
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
    if (!messages.value[message.chat]) {
      const chat = chats.value.get(message.chat)

      messages.value[message.chat] = {
        replies: [],
        subject: chat.topic ?? '',
        status: chat.status ?? Status.OPEN
      }
    }

    const { replies } = messages.value[message.chat]
    const i = replies.findIndex(({ uuid }) => uuid === message.uuid)

    const user = accounts.value.users.find(
      (account) => account.uuid === message.sender
    ) ?? {}
    const newMessage = changeMessage(message, user, event.uuid)

    if (event.item.case === 'chat') return
    switch (event.type) {
      case EventType.MESSAGE_SENT: {
        const chat = chats.value.get(message.chat)

        if (i === -1) replies.push(newMessage)
        else replies.splice(i, 1, newMessage)

        chat.meta = new ChatMeta({
          ...chat.meta,
          unread: (chat.uuid === route.params.id) ? 0 : chat.meta.unread + 1,
          lastMessage: message
        })
        break
      }
      case EventType.MESSAGE_UPDATED: {
        const chat = chats.value.get(message.chat)

        replies.splice(i, 1, newMessage)
        if (chat.uuid !== route.params.id) chat.meta.unread++
        break
      }

      case EventType.MESSAGE_DELETED: {
        replies.splice(i, 1)
        break
      }
    }
  }

  function changeMessage (message, user, uuid) {
    return {
      uuid: message.uuid,
      date: toDate(Number(message.sent) / 1000, '-', true, true),
      sent: message.sent,
      email: user.data?.email ?? 'none',
      message: message.content.trim(),
      name: user.title ?? 'anonymous',
      userid: user.uuid,
      requestor_type: (uuid === user.uuid) ? 'Owner' : 'Other',
      gateways: message.gateways,
      attachments: message.attachments
    }
  }

  return {
    transport,
    accounts,
    stream,
    defaults,
    chats,
    messages,
    rawMessages,

    getChats,
    getDefaults,

    updateChat,
    updateMessage,

    async fetchChats () {
      try {
        const chatsApi = createPromiseClient(ChatsAPI, transport)
        const usersApi = createPromiseClient(UsersAPI, transport)

        const response = await chatsApi.list(new Empty())
        if (!accounts.value) accounts.value = await usersApi.getMembers(new Empty())

        const chatsArray = response.chats.map((chat) =>
          [chat.uuid, (chat.meta) ? chat : { ...chat, meta: new ChatMeta({ unread: 0 }) }]
        )

        chats.value = new Map(chatsArray)
        return chatsArray
      } catch (error) {
        console.debug(error)
        throw error
      }
    },

    async fetchMessages (id) {
      try {
        const messagesApi = createPromiseClient(MessagesAPI, transport)
        const chat = chats.value.get(id)

        if (!authStore.userdata.uuid) {
          await new Promise((resolve) => setTimeout(resolve, 200))
          return this.fetchMessages(id)
        }

        const response = await messagesApi.get(chat)

        const replies = response.messages.map((message) => {
          const user = accounts.value.users.find(
            (account) => account.uuid === message.sender
          ) ?? {}

          return changeMessage(message, user, authStore.userdata.uuid)
        })

        messages.value[id] = replies
        rawMessages.value = response.messages

        return { status: chat.status, subject: chat.topic, replies }
      } catch (error) {
        console.debug(error)
        throw error
      }
    },

    async startStream () {
      if (stream.value) return

      const streaming = createPromiseClient(StreamService, transport)

      try {
        stream.value = streaming.stream(new Empty())

        for await (const event of stream.value) {
          if (event.type === +EventType.PING) continue
          else if (event.type >= EventType.MESSAGE_SENT) {
            updateMessage({ ...event, uuid: authStore.userdata.uuid })
          } else {
            updateChat(event)
          }
        }
      } catch (error) {
        console.debug(error)
      }
    },

    async fetchDefaults () {
      if (defaults.value.error) {
        return {}
      } else if (Object.keys(defaults.value).length > 0) {
        return defaults.value
      }

      try {
        const usersApi = createPromiseClient(UsersAPI, transport)
        const response = await usersApi.fetchDefaults(new Empty())

        defaults.value = response
        return response
      } catch (error) {
        defaults.value = { error }
        console.debug(error)
      }
    },
    async changeGateway (chat) {
      try {
        const chatsApi = createPromiseClient(ChatsAPI, transport)
        const response = await chatsApi.changeGateway(new Chat(chat))

        return response
      } catch (error) {
        console.debug(error)
        throw error
      }
    },

    async createChat (data) {
      try {
        const chatsApi = createPromiseClient(ChatsAPI, transport)

        const newChat = new Chat({
          department: data.department,
          gateways: data.gateways ?? defaults.value.gateways,
          admins: data.admins ?? defaults.value.admins,
          users: [authStore.userdata.uuid],
          topic: data.chat.subject,
          role: Role.OWNER,
          meta: new ChatMeta({
            lastMessage: data.chat.message, data: {}
          })
        })

        if (data.chat.whmcsId) {
          newChat.meta.data.dept_id = Value.fromJson(data.chat.whmcsId)
        }
        if (data.chat.instance) {
          newChat.meta.data.instance = Value.fromJson(data.chat.instanceId)
        }
        const createdChat = await chatsApi.create(newChat)

        chats.value.set(createdChat.uuid, createdChat)
        return createdChat
      } catch (error) {
        console.debug(error)
        throw error
      }
    },
    async editChat (chat) {
      try {
        const editedChat = new Chat({
          ...chat,
          meta: new ChatMeta({
            ...chat.meta,
            data: Object.entries(chat.meta.data).reduce(
              (result, [key, value]) => {
                if (value.toJSON) result[key] = value
                else result[key] = Value.fromJson(value)

                return result
              }, {}
            )
          })
        })

        const chatsApi = createPromiseClient(ChatsAPI, transport)
        const createdChat = await chatsApi.update(editedChat)

        chats.value.set(createdChat.uuid, createdChat)
        return createdChat
      } catch (error) {
        console.debug(error)
        throw error
      }
    },

    async sendMessage (message) {
      try {
        const messagesApi = createPromiseClient(MessagesAPI, transport)
        const mes = new Message({
          kind: Kind.DEFAULT,
          underReview: false,
          content: message.content,
          chat: message.uuid,
          sent: message.date,
          sender: message.account,
          attachments: message.attachments
        })

        const response = await messagesApi.send(mes)

        if (response.uuid === '') {
          response.uuid = 'last message'
        }
        return response
      } catch (error) {
        console.debug(error)
        throw error
      }
    },
    async editMessage (message) {
      try {
        const messagesApi = createPromiseClient(MessagesAPI, transport)

        const newMessage = new Message({
          ...rawMessages.value.find(({ uuid }) => uuid === message.uuid),
          content: message.content
        })

        messagesApi.update(newMessage)
        return newMessage
      } catch (error) {
        console.debug(error)
        throw error
      }
    }
  }
})
