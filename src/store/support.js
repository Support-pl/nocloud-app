import { createPromiseClient } from '@bufbuild/connect';
import { createGrpcWebTransport } from '@bufbuild/connect-web';

import {
  ChatsAPI, MessagesAPI, StreamService, UsersAPI
} from '@/libs/cc_connect/cc_connect';
import {
  Empty, Chat, Message, ChatMeta, Role, Kind
} from '@/libs/cc_connect/cc_pb';

import api from '@/api'
import config from '@/appconfig'

export default {
	namespaced: true,
	state: {
		loading: false,
		tickets: [],
		onlyClosedTickets: false,
		addTicketState: false,
		filter: ['all'],
		departments: [],
    baseURL: `${config.WHMCSsiteurl}modules/addons/nocloud/api/index.php`,
    transport: null,
    chats: new Map(),
	},
	mutations: {
		updateTickets(state, value) {
			state.tickets = value;
		},
		updateFilter(state, value) {
			state.filter = value;
		},
		makeLoadingIs(state, value) {
			state.loading = value;
		},
		makeOnlyClosedTicketsIs(state, value) {
			state.onlyClosedTickets = value
		},
		inverseAddTicketState(state) {
			state.addTicketState = !state.addTicketState;
		},
		setDepartments(state, data) {
			state.departments = data;
		},

    setChats(state, value) {
      state.chats = new Map(value);
      state.tickets = value.map(([, ticket]) => ({
        id: ticket.uuid,
        tid: `${ticket.uuid.slice(0, 8)}...`,
        title: ticket.topic,
        date: Number(ticket.meta.lastMessage?.sent ?? ticket.created),
        message: ticket.meta.lastMessage?.content ?? '',
        status: 'Open',
        unread: ticket.meta.unread
      }));
    }
	},
	actions: {
		silentFetch({ state, commit }) {
			return new Promise((resolve, reject) => {
				api.get(state.baseURL, { params: { run: 'get_tickets' } })
          .then((res) => {
            if (res?.ERROR) throw res.ERROR.toLowerCase();
            if (!res) throw 'tickets not found';
            commit('updateTickets', res);
            resolve(res);
          })
          .catch((err) => reject(err))
          .finally(() => commit('makeLoadingIs', false));
			});
		},
		fetch({ dispatch, commit }) {
			commit('makeLoadingIs', true);
			return dispatch('silentFetch');
		},
		autoFetch({state, dispatch}){
			if (state.tickets.length > 0) {
				return dispatch('silentFetch');
			} else {
				return dispatch('fetch');
			}
		},
		fetchDepartments({ state, commit }) {
			return new Promise((resolve, reject) => {
				api.get(state.baseURL, { params: { run: 'get_dept' } })
          .then(res => {
            if (res?.ERROR) throw res.ERROR.toLowerCase();
            commit('setDepartments', res);
            resolve(res);
          })
          .catch(err => {
            console.error(err);
            reject(err);
          });
			});
		},

    createTransport({ state, rootState }) {
      const transport = createGrpcWebTransport({
        baseUrl: 'https://api.nocloud.ione-cloud.net/',
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
        const transport = (state.transport) ? state.transport : await dispatch('createTransport');
        const chatsApi = createPromiseClient(ChatsAPI, transport);
        const streaming = createPromiseClient(StreamService, transport);

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
    fetchMessages({ state, dispatch, rootState }, id) {
      return new Promise(async (resolve, reject) => {
        const transport = (state.transport) ? state.transport : await dispatch('createTransport');
        const messagesApi = createPromiseClient(MessagesAPI, transport);
        const chat = state.chats.get(id);

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

        messagesApi.get(chat)
          .then(async ({ messages }) => {
            await dispatch('nocloud/accounts/fetch', null, { root: true });
            const replies = messages.map((message) => {
              const { uuid } = rootState.nocloud.auth.userdata;
              const user = rootState.nocloud.accounts.accounts.find(
                (account) => account.uuid === message.sender
              );

              return {
                date: toDate(Number(message.sent)),
                email: user.data?.email ?? 'none',
                message: message.content.trim(),
                name: user.title,
                userid: user.uuid,
                requestor_type: (uuid === user.uuid) ? 'Owner' : 'Other',
                gateways: message.gateways
              };
            });

            resolve({ status: 'Open', subject: chat.topic, replies });
          });
      })
    },
    async createChat({ state, rootState }, chat) {
      const transport = (state.transport) ? state.transport : await dispatch('createTransport');
      const chatsApi = createPromiseClient(ChatsAPI, transport);
      const usersApi = createPromiseClient(UsersAPI, transport);
      const defaults = await usersApi.fetchDefaults(new Empty());

      const { uuid } = rootState.nocloud.auth.userdata;
      const newChat = new Chat({
        gateways: defaults.gateways,
        admins: defaults.admins,
        users: [uuid],
        topic: chat.subject,
        role: Role.OWNER,
        meta: new ChatMeta({ lastMessage: chat.message })
      });
      const createdChat = await chatsApi.create(newChat);

      state.chats.set(createdChat.uuid, createdChat);
      return createdChat;
    },
    async sendMessage({ state }, message) {
      const transport = (state.transport) ? state.transport : await dispatch('createTransport');
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
    }
	},
	getters: {
		getAllTickets(state){
			return state.tickets;
		},
		getTickets(state){
			const order = ['open', 'closed', 'answered'];
			const tickets = [...state.tickets].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const filters = state.filter.map((el) => {
        if (!el.includes(' ')) return el;
        return el.split(' ').map((el) =>
          `${el[0].toUpperCase()}${el.slice(1)}`
        ).join('-');
      });

			if (state.filter[0] == 'all' || state.filter.length == 0) {
        state.tickets.sort();
				return tickets;
			} else {
				return tickets.filter(ticket => filters.includes(ticket.status));
			}
		},
		isLoading(state){
			return state.loading;
		},
		isOnlyClosedTickets(state){
			return state.onlyClosedTickets;
		},
		isAddTicketState(state){
			return state.addTicketState;
		},
		getDepartments(state){
			return state.departments;
		},
    getURL(state){
      return state.baseURL;
    }
	}
}
