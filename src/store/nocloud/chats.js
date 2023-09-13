import { createPromiseClient } from '@bufbuild/connect';
import { createGrpcWebTransport } from '@bufbuild/connect-web';

import {
  ChatsAPI, MessagesAPI, StreamService, UsersAPI
} from '@/libs/cc_connect/cc_connect';
import {
  Empty, Chat, Message, ChatMeta, Role, Kind, EventType, Users, User, Status
} from '@/libs/cc_connect/cc_pb';
import { Value } from '@bufbuild/protobuf';

function toDate(timestamp) {
  const date = new Date(timestamp);
  const time =  date.toTimeString().split(' ')[0];
  const year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();

  if (`${month}`.length < 2) month = `0${month}`;
  if (`${day}`.length < 2) day = `0${day}`;

  return `${year}-${month}-${day} ${time}`;
}

function changeMessage(message, user, uuid) {
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
  };
}

export default {
  namespaced: true,
  state: {
    transport: null,
    accounts: null,
    stream: null,
    defaults: {},
    messages: [],
    chats: new Map(),
    rawMessages: new Map()
  },
  mutations: {
    setChats(state, value) {
      state.chats = new Map(value);
    },
    setMessages(state, value) {
      state.messages = value;
    },
    setRawMessages(state, value) {
      state.rawMessages = value;
    },
    setDefaults(state, value) {
      state.defaults = value;
    },
    updateChat(state, event) {
      const { value: chat } = event.item;

      switch (event.type) {
        case EventType.CHAT_READ:
        case EventType.CHAT_CREATED:
        case EventType.CHAT_UPDATED:
          state.chats.set(chat.uuid, chat);
          break;

        case EventType.CHAT_DELETED:
          state.chats.delete(chat.uuid);
          break;
      }
    },
    updateMessage(state, event) {
      const { value: message } = event.item;
      const i = state.messages.findIndex(({ uuid }) => uuid === message.uuid);
      const user = state.accounts.users.find(
        (account) => account.uuid === message.sender
      ) ?? {};
      const newMessage = changeMessage(message, user, event.uuid);

      if (event.item.case === 'chat') return;
      switch (event.type) {
        case EventType.MESSAGE_SENT: {
          const chat = state.chats.get(message.chat);

          // state.messages.push(newMessage);
          chat.meta = new ChatMeta({
            unread: chat.meta.unread + 1,
            lastMessage: message
          });
          break;
        }
        case EventType.MESSAGE_UPDATED: {
          state.messages.splice(i, 1, newMessage);
          state.chats.get(message.chat).meta.unread++;
          break;
        }

        case EventType.MESSAGE_DELETED: {
          state.messages.splice(i, 1);
          break;
        }
      }
    }
  },
  actions: {
    createTransport({ state, rootState }) {
      const transport = createGrpcWebTransport({
        baseUrl: (VUE_APP_BASE_URL.endsWith('/') ? VUE_APP_BASE_URL : `${VUE_APP_BASE_URL}/`),
        interceptors: [
          (next) => async (req) => {
            const { token } = rootState.nocloud.auth;

            req.header.set('Authorization', `Bearer ${token}`);
            return next(req);
          },
        ],
      });

      state.transport = transport;
      return transport;
    },
    fetchChats({ state, commit, dispatch }) {
      return new Promise(async (resolve, reject) => {
        const transport = state.transport ?? await dispatch('createTransport');
        const chatsApi = createPromiseClient(ChatsAPI, transport);

        chatsApi.list(new Empty())
          .then(({ chats }) => {
            const chatsArray = chats.map((chat) =>
              [chat.uuid, (chat.meta) ? chat : { ...chat, meta: new ChatMeta({ unread: 0 }) }]
            );

            commit('setChats', chatsArray);
            resolve(chatsArray);
          })
          .catch((err) => {
            console.error(err);
            reject(err);
          });
      });
    },
    fetchMessages({ state, dispatch, commit, rootState }, id) {
      return new Promise(async (resolve, reject) => {
        const transport = state.transport ?? await dispatch('createTransport');
        const messagesApi = createPromiseClient(MessagesAPI, transport);
        const chat = state.chats.get(id);

        const users = [...chat.users, ...chat.admins].map((uuid) => new User({ uuid }));
        const usersApi = createPromiseClient(UsersAPI, transport);
        const usersList = new Users({ users });

        const accounts = state.accounts ?? await usersApi.resolve(usersList);

        if (!state.accounts) state.accounts = accounts;
        messagesApi.get(chat)
          .then(({ messages }) => {
            const { uuid } = rootState.nocloud.auth.userdata;
            const replies = messages.map((message) => {
              const user = accounts.users.find(
                (account) => account.uuid === message.sender
              ) ?? {};

              return changeMessage(message, user, uuid);
            });

            commit('setMessages', replies);
            commit('setRawMessages', messages);
            resolve({ status: chat.status, subject: chat.topic, replies });
          });
      })
    },
    async startStream({ state, dispatch, commit, rootState }) {
      if (state.stream) return;

      const transport = state.transport ?? await dispatch('createTransport');
      const chatsApi = createPromiseClient(ChatsAPI, transport);
      const streaming = createPromiseClient(StreamService, transport);

      try {
        state.stream = streaming.stream(new Empty());

        for await (const event of state.stream) {
          if (event.type === +EventType.PING) continue;
          else if (event.type >= EventType.MESSAGE_SENT) {
            const { uuid } = rootState.nocloud.auth.userdata;

            commit('updateMessage', { ...event, uuid });
          } else {
            commit('updateChat', event);
          }
        }
      } catch (error) {
        console.debug(error);
      }
    },
    async fetchDefaults({ state, dispatch, commit }) {
      try {
        const transport = state.transport ?? await dispatch('createTransport');
        const usersApi = createPromiseClient(UsersAPI, transport);
        const defaults = await usersApi.fetchDefaults(new Empty());
        
        commit('setDefaults', defaults);
      } catch (error) {
        console.debug(error);
      }
    },
    async createChat({ state, dispatch, rootState }, data) {
      const transport = state.transport ?? await dispatch('createTransport');
      const chatsApi = createPromiseClient(ChatsAPI, transport);

      const { uuid } = rootState.nocloud.auth.userdata;
      const newChat = new Chat({
        department: data.department,
        gateways: data.gateways ?? state.defaults.gateways,
        admins: data.admins ?? state.defaults.admins,
        users: [uuid],
        topic: data.chat.subject,
        role: Role.OWNER,
        meta: new ChatMeta({
          lastMessage: data.chat.message,
          data: { instance: new Value({
            kind: { case: 'stringValue', value: data.chat.instanceId }
          }) }
        })
      });
      const createdChat = await chatsApi.create(newChat);

      state.chats.set(createdChat.uuid, createdChat);
      return createdChat;
    },
    async updateChat({ state, dispatch, rootState }, chat) {
      const transport = state.transport ?? await dispatch('createTransport');
      const chatsApi = createPromiseClient(ChatsAPI, transport);
      const createdChat = await chatsApi.update(chat);

      state.chats.set(createdChat.uuid, createdChat);
      return createdChat;
    },
    async sendMessage({ state, dispatch }, message) {
      const transport = state.transport ?? await dispatch('createTransport');
      const messagesApi = createPromiseClient(MessagesAPI, transport);

      const newMessage = new Message({
        kind: Kind.DEFAULT,
        underReview: false,
        content: message.content,
        chat: message.uuid,
        sent: message.date,
        sender: message.account
      });

      messagesApi.send(newMessage);
      return newMessage;
    },
    async editMessage({ state, dispatch }, message) {
      const transport = state.transport ?? await dispatch('createTransport');
      const messagesApi = createPromiseClient(MessagesAPI, transport);

      const newMessage = new Message({
        ...state.rawMessages.find(({ uuid }) => uuid === message.uuid),
        content: message.content
      });

      messagesApi.update(newMessage);
      return newMessage;
    }
  },
  getters: {
    getAllChats: (state) => state.chats,
    getChats(state, _, { support }) {
			if (support.filter[0] == 'all' || support.filter.length == 0) {
        return state.chats;
			} else {
        const filters = support.filter.map((el) => {
          if (!el.includes(' ')) return el;
          return el.split(' ').map((el) =>
            `${el[0].toUpperCase()}${el.slice(1)}`
          ).join('-');
        });
        const result = [];

				state.chats.forEach((chat) => {
          const status = Status[chat.status].toLowerCase();
          const capitalized = `${status[0].toUpperCase()}${status.slice(1)}`;

          if (filters.includes(capitalized)) {
            result.push(chat);
          }
        });

        return result;
			}
    },
    getMessages: (state) => state.messages,
    getDefaults: (state) => ({
      ...state.defaults,
      departments: state.defaults.departments?.map(
        ({ admins, title, key }) => ({ id: key, admins, name: title })
      ) ?? []
    })
  }
}
