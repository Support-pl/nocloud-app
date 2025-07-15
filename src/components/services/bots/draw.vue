<template>
  <template v-if="!isLoading">
    <a-row style="margin-top: 15px" v-if="chats.length > 0">
      <a-col span="24">
        <chat-item :bot-id="bot.id" v-for="chat in chats" :chat="chat" />
      </a-col>
    </a-row>

    <a-row v-else>
      <a-col span="24">
        <a-card style="padding: 10px; margin-top: 20px">
          <div style="display: flex; justify-content: center">
            <span style="text-align: center; font-size: 1rem">
              {{ t("bots.labels.no_chats") }}
            </span>
          </div>

          <div
            v-if="(aiBotsStore.chats.get(bot.id) || []).length > 0"
            style="display: flex; justify-content: center; margin-top: 10px"
          >
            <a-button @click="handleOpenAllChats" type="primary">{{
              t("bots.actions.all_chats")
            }}</a-button>
          </div>
        </a-card>
      </a-col>
    </a-row>
  </template>
  <loading v-else />
</template>

<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";
import ChatItem from "./chatItem.vue";
import { sortAiBotChats, useAiBotsStore } from "@/stores/aiBots";
import Loading from "@/components/ui/loading.vue";
import { useRouter } from "vue-router";

const props = defineProps({
  service: { type: Object, required: true },
});

const aiBotsStore = useAiBotsStore();

const { t } = useI18n();
const router = useRouter();
const { openNotification } = useNotification();

const isLoading = ref(false);
const bot = ref({
  id: "",
  name: "",
  ownership: { owner: "" },
  settings: {
    delay: 0,
    ai_model: "",
    system_prompt: "",
    enable_spam_filter: true,
  },
  channels: [],
});

const chats = computed(() =>
  sortAiBotChats(aiBotsStore.chats.get(bot.value.id) || [])
    .filter((chat) => !chat.inactive && !chat.archived)
    .slice(0, 8)
);

const handleOpenAllChats = () => {
  router.push(`/ai-bots/${bot.value.id}/chats/`);
};

async function fetch() {
  try {
    isLoading.value = true;

    bot.value = await aiBotsStore.getBot(props.service.data.bot_uuid);
    if (!bot.value.channels) {
      bot.value.channels = [];
    }
    await aiBotsStore.fetchChats(bot.value.id);

    aiBotsStore.startChatsStream();
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isLoading.value = false;
  }
}

fetch();
</script>

<script>
export default { name: "AiBotDraw" };
</script>

<style scoped></style>
