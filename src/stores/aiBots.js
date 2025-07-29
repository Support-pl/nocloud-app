import api from "@/api.js";
import { defineStore } from "pinia";
import { ref } from "vue";
import cookies from "js-cookie";
import { useRoute } from "vue-router";

export function sortAiBotChats(chats) {
  chats.sort((a, b) => {
    const aDate = a.last_message?.created_at
      ? Date.parse(a.last_message?.created_at)
      : null;
    const bDate = b.last_message?.created_at
      ? Date.parse(b.last_message?.created_at)
      : null;

    if (!aDate && !bDate) return 0;
    if (!aDate) return -1;
    if (!bDate) return 1;

    return bDate - aDate;
  });

  return chats;
}

export const useAiBotsStore = defineStore("aiBots", () => {
  const bots = ref(new Map());
  const chats = ref(new Map());
  const messages = ref({});
  const socket = ref(null);
  const chatParticipants = ref();
  const databases = ref([]);
  const roles = ref([]);

  const route = useRoute();

  async function fetchChatsMessages(chatId) {
    try {
      const data = await api.get("/agents/api/get_chat_messages/" + chatId);

      messages.value[chatId] = data.messages;
      return data.messages;
    } catch (error) {
      console.debug(error);
      throw error;
    }
  }

  async function fetchParticipants() {
    try {
      const { chat_participants } = await api.get(
        `/agents/api/get_participants`
      );
      chatParticipants.value = chat_participants;

      return chat_participants;
    } catch (error) {
      console.debug(error);
      throw error;
    }
  }

  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 10;

  async function startChatsStream() {
    const token = cookies.get("noCloudinApp-token");
    const url = VUE_APP_BASE_URL.replace(/^http/, "ws");
    const wsUrl = `${url}agents/api/get_updates?token=${encodeURIComponent(
      token
    )}`;

    if (socket.value) {
      return;
    }

    try {
      socket.value = new WebSocket(wsUrl);

      socket.value.addEventListener("open", () => {
        reconnectAttempts = 0;
      });

      socket.value.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        console.log(data);

        switch (data.event) {
          case "message_sent":
            handleMessageSent(data.message);
            break;
          case "chat_updated":
            handleChatUpdated(data.chat);
            break;
          case "chat_created":
            handleChatCreated(data.chat);
            break;
          case "participant_created":
          case "participant_updated":
            handleParticipant(data.participant);
            break;
          case "chat_pause":
          case "chat_unpause":
            handleChatPauseToggle(data.chat, data.event);
            break;
          case "file_search_knowledge_status_updated":
            handleFileSearchKnowledgeUpdate(data.file_search_knowledge);
            break;
          case "saved_url_job_status_updated":
            handleSiteSearchKnowledgeUpdate(data.saved_url);
            break;
        }
      });

      socket.value.addEventListener("close", (event) => {
        console.warn("WebSocket closed:", event.code, event.reason);
        attemptReconnect();
      });

      socket.value.addEventListener("error", (event) => {
        console.error("WebSocket error:", event);
        socket.value.close();
      });
    } catch (err) {
      console.error("WebSocket failed to connect:", err);
      attemptReconnect();
    }
  }

  function handleMessageSent(message) {
    if (
      messages.value[message.chat_id] &&
      messages.value[message.chat_id].length
    ) {
      messages.value[message.chat_id].push(message);
    }

    const chat = getChatById(message.chat_id);
    if (chat && route.params.chatId != message.chat_id) {
      chat.unread_count = (chat.unread_count || 0) + 1;
    }

    if (chat) {
      chat.last_message = message;
    }
  }

  function handleChatUpdated(chat) {
    if (chats.value.has(chat.bot_id)) {
      chats.value.set(
        chat.bot_id,
        chats.value.get(chat.bot_id).map((c) => (c.id === chat.id ? chat : c))
      );
    }
  }

  function handleChatCreated(chat) {
    if (chats.value.get(chat.bot_id)) {
      chats.value.get(chat.bot_id).push(chat);
    } else {
      chats.value.set(chat.bot_id, [chat]);
    }
  }

  function handleParticipant(participant) {
    const chatId = participant.chat_id;
    if (chatParticipants.value[chatId]) {
      chatParticipants.value[chatId].push(participant);
    } else {
      chatParticipants.value[chatId] = [participant];
    }
  }

  function handleFileSearchKnowledgeUpdate(knowledge) {
    const index = databases.value.findIndex(
      (db) => db.id === knowledge.database
    );
    if (index !== -1) {
      const existingIndex = databases.value[
        index
      ].file_search_knowledge.findIndex((k) => k.id === knowledge.id);
      if (existingIndex !== -1) {
        databases.value[index].file_search_knowledge[existingIndex] = knowledge;
      } else {
        databases.value[index].file_search_knowledge.push(knowledge);
      }
    }
  }

  function handleSiteSearchKnowledgeUpdate(knowledge) {
    const index = databases.value.findIndex(
      (db) => db.id === knowledge.database_id
    );

    if (index !== -1) {
      const existingIndex = databases.value[index].saved_urls.findIndex(
        (k) => k.id === knowledge.id
      );

      if (existingIndex !== -1) {
        databases.value[index].saved_urls[existingIndex] = knowledge;
      } else {
        databases.value[index].saved_urls.push(knowledge);
      }
    }
  }

  function handleChatPauseToggle(chat, event) {
    if (chats.value.has(chat.bot_id)) {
      chats.value.set(
        chat.bot_id,
        chats.value
          .get(chat.bot_id)
          .map((c) =>
            c.id === chat.id ? { ...c, pause: event === "chat_pause" } : c
          )
      );
    }
  }

  function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("❌ Max reconnect attempts reached.");
      return;
    }

    const timeout = (1500 * reconnectAttempts + 200) / 2;

    reconnectAttempts++;
    socket.value = null;

    console.log(
      `🔄 Reconnecting in ${timeout / 1000}s... (attempt ${reconnectAttempts})`
    );
    setTimeout(() => {
      startChatsStream();
    }, timeout);
  }

  function getChatById(chatId) {
    return [...chats.value.values()]
      .find((chats) => chats.find((chat) => chat.id === chatId))
      ?.find((chat) => chat.id === chatId);
  }

  return {
    messages,
    chats,
    bots,
    chatParticipants,
    databases,
    roles,

    async getBot(botId) {
      if (bots.value.get(botId)) {
        return bots.value.get(botId);
      }

      try {
        const data = await api.get("/agents/api/get_bot/" + botId);
        bots.value.set(botId, data);
        return data;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async updateBot(bot) {
      try {
        const data = await api.post("/agents/api/update_bot", {
          bot: bot.id,
          delay: bot.settings.delay,
          model: bot.settings.ai_model,
          system_prompt: bot.settings.system_prompt,
          temperature: bot.settings.temperature,
          enable_spam_filter: bot.settings.enable_spam_filter,
          role: bot.settings.role,
        });

        bots.value.set(bot.id, data);
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async getRoles() {
      if (roles.value.length) {
        return;
      }

      try {
        const data = await api.get(`/agents/api/get_bot_roles`);
        roles.value = Object.values(data);

        return Object.values(data);
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async toggleChatPause(chat) {
      try {
        await api.post("/agents/api/toggle_pause", {
          chat: chat.id,
          pause: !chat.pause,
        });
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async updateChat(chat) {
      try {
        await api.post("/agents/api/update_chat", chat);
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async fetchChats(botId) {
      try {
        const data =
          (await api.get("/agents/api/list_chats?bot=" + botId)).chats || [];

        await fetchParticipants();

        chats.value.set(botId, data);
        return data;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    fetchChatsMessages,
    startChatsStream,

    async sendMessage(message, chat) {
      try {
        const data = await api.post("/agents/api/send_message", {
          chat,
          message,
        });

        return data;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async readMessage(message) {
      try {
        await api.post(`/agents/api/read_message`, { message_id: message.id });

        const chat = getChatById(message.chat_id);

        chat.unread_count = 0;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async getDatabases() {
      if (databases.value.length > 0) {
        return databases.value;
      }

      try {
        const data = await api.get("/agents/api/get_databases");
        databases.value = data.databases;
        return data.databases;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async addDatabase(data) {
      try {
        const response = await api.post("/agents/api/create_database", data);
        databases.value.unshift(response);
        return response;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async deleteDatabase(database) {
      try {
        const response = await api.post(
          `agents/api/delete_database/${database.id}`
        );
        databases.value = databases.value.filter((db) => db.id !== database.id);
        return response;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async attachDatabase(database, bot) {
      try {
        const response = await api.post(`agents/api/attach_database`, {
          bot: bot.id,
          database: database.id,
        });

        if (!bots.value.get(bot.id).databases) {
          bots.value.get(bot.id).databases = [];
        }

        bots.value.get(bot.id).databases.push(database);

        return response;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async detachDatabase(database, bot) {
      try {
        const response = await api.post(`agents/api/detach_database`, {
          bot: bot.id,
          database: database.id,
        });

        bots.value.get(bot.id).databases = bots.value
          .get(bot.id)
          .databases.filter((db) => db.id !== database.id);

        return response;
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },
  };
});
