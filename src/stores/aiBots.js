import api from "@/api.js";
import { defineStore } from "pinia";
import { ref } from "vue";
import cookies from "js-cookie";

export const useAiBotsStore = defineStore("aiBots", () => {
  const bots = ref(new Map());
  const chats = ref(new Map());
  const messages = ref({});
  const socket = ref(null);
  const chatParticipants = ref();

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
      }
    });

    socket.value.addEventListener("error", (event) => {
      console.warn(event);
      startChatsStream();
    });
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
  };
});
