import api from "@/api.js";
import { defineStore } from "pinia";
import { ref } from "vue";
import cookies from "js-cookie";

export const useAiBotsStore = defineStore("aiBots", () => {
  const bots = ref(new Map());
  const chats = ref(new Map());
  const messages = ref({});
  const socket = ref(null);

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
      console.log("📩 Получено сообщение:", event.data);
      const data = JSON.parse(event.data);
      switch (data.event) {
        case "message_sent": {
          if (
            messages.value[data.message.chat_id] &&
            messages.value[data.message.chat_id].length
          ) {
            messages.value[data.message.chat_id].push(data.message);
          }
        }
        case "chat_created": {
          console.log(data);
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
        });

        bots.value.set(bot.id, data);
      } catch (error) {
        console.debug(error);
        throw error;
      }
    },

    async fetchChats(botId) {
      try {
        const data = (await api.get("/agents/api/list_chats")).chats || [];

        await Promise.all([
          ...data.map(async (chat) => {
            const { participants } = await api.get(
              `/agents/api/get_chat_participants/${chat.id}`
            );

            chat.name = participants.map((p) => p.name).join(" + ");
            chat.participants = participants;
          }),
        ]);

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
