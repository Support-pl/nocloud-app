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

  async function startChatsStream() {
    if (socket.value) {
      return;
    }

    const token = cookies.get("noCloudinApp-token");
    const url = VUE_APP_BASE_URL.replace("http", "ws");

    socket.value = new WebSocket(`${url}agents/api/get_chats_updates`, [
      "Bearer",
      token,
    ]);

    socket.value.addEventListener("message", (event) => {
      console.log("AI BOTS MESSAGE", event.data);
      const data = JSON.parse(event.data);
      switch (data.event) {
        case "message_sent": {
          if (
            messages.value[data.message.chat_id] &&
            messages.value[data.message.chat_id].length
          ) {
            messages.value[data.message.chat_id].push(data.message);
          }

          const chat = getChatById(data.message.chat_id);
          if (chat && route.params.chatId != data.message.chat_id) {
            chat.unread_count = (chat.unread_count || 0) + 1;
          }

          if (chat) {
            chat.last_message = data.message;
          }

          break;
        }
        case "chat_created": {
          if (chats.value.get(data.chat.bot_id)) {
            chats.value.get(data.chat.bot_id).push(data.chat);
          } else {
            chats.value.set(data.chat.bot_id, [data.chat]);
          }
          break;
        }
        case "participant_created":
        case "participant_updated": {
          if (chatParticipants.value[data.participant.chat_id]) {
            chatParticipants.value[data.participant.chat_id].push(
              data.participant
            );
          } else {
            chatParticipants.value[data.participant.chat_id] = [
              data.participant,
            ];
          }
          break;
        }
        case "chat_pause":
        case "chat_unpause": {
          if (chats.value.has(data.chat.bot_id)) {
            chats.value.set(
              data.chat.bot_id,
              chats.value
                .get(data.chat.bot_id)
                .map((chat) =>
                  chat.id === data.chat.id
                    ? { ...chat, pause: data.event === "chat_pause" }
                    : chat
                )
            );
          }
          break;
        }
      }
    });

    socket.value.addEventListener("error", (event) => {
      console.warn(event);
      startChatsStream();
    });
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

    async getBot(botId) {
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
        });

        bots.value.set(bot.id, data);
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
  };
});
