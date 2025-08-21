<template>
  <a-col class="notifications" v-if="!isDataLoading" span="24">
    <a-row class="chanell" v-for="chanell in channels">
      <a-col span="24" class="chanell_main">
        <div class="chanell_info">
          <img
            :src="`/img/chanells/${chanell.code}.png`"
            class="chanell_icon"
          />

          <span class="chanell_title">{{ chanell.name }}</span>
        </div>

        <a-button
          v-if="!chanell.configured"
          style="margin-left: 25px"
          @click="handleOpenChanellSettings(chanell)"
          >{{ t("bots_notifications.actions.open_chanell") }}</a-button
        >

        <a-popconfirm
          v-else
          :title="t('bots_notifications.actions.delete_chanell_confirm')"
          :ok-text="t('Yes')"
          :cancel-text="t('Cancel')"
          @confirm="handleDeleteChanell(chanell)"
        >
          <a-button danger style="margin-left: 25px">
            {{ t("bots_notifications.actions.delete_chanell") }}
          </a-button>
        </a-popconfirm>
      </a-col>

      <a-col
        v-for="event in eventTypes"
        span="12"
        class="chanell_notification_rule"
        :style="chanell.configured ? '' : 'opacity: 0.6'"
      >
        <a-switch
          :disabled="!chanell.configured"
          size="small"
          :checked="
            !!notificationsData.subscriptions.find(
              (s) =>
                s.event_type_id === event.id &&
                s.receiver_id === chanell.receiver_id
            )
          "
          :loading="isToggleLoading"
          @change="
            handleToggleSubscription(
              chanell,
              event,
              !notificationsData.subscriptions.find(
                (s) =>
                  s.event_type_id === event.id &&
                  s.receiver_id === chanell.receiver_id
              )
            )
          "
        />
        <span class="rule_title">{{
          event.descriptions.find((d) => d.language_code === locale)
            ?.description ||
          event.descriptions.find((d) => d.language_code === "en")
            ?.description ||
          event.descriptions[0]?.description
        }}</span>
      </a-col>
    </a-row>

    <a-modal
      v-model:open="isCurrentChannelOpen"
      :title="t('bots_notifications.actions.edit_chanell')"
    >
      <a-form
        ref="currentChannelFormRef"
        layout="vertical"
        autocomplete="off"
        :model="currentChannel"
        :rules="currentChannelRules"
      >
        <a-form-item
          v-if="currentChannel.channel_key === 'email'"
          name="recipient"
          :label="t('bots_notifications.fields.recipient')"
        >
          <a-input
            v-model:value="currentChannel.recipient"
            :placeholder="t('bots_notifications.fields.recipient')"
          ></a-input>
        </a-form-item>
      </a-form>

      <a-col span="24" v-if="currentChannel.channel_key === 'telegram'">
        <span
          id="tg_instruction"
          v-if="
            currentChannelMeta.telegram_bot_username &&
            currentChannelMeta.verification_code
          "
          v-html="
            marked(
              t('bots_notifications.labels.instruction_tg')
                .replaceAll(
                  'bot_username',
                  currentChannelMeta.telegram_bot_username
                )
                .replaceAll('user_code', currentChannelMeta.verification_code)
            )
          "
        ></span>
      </a-col>

      <template #footer>
        <a-button
          key="back"
          :disabled="isCurrentChannelLoading"
          @click="isCurrentChannelOpen = false"
          >{{ t("Cancel") }}</a-button
        >

        <a-button
          v-if="currentChannel.channel_key != 'telegram'"
          key="submit"
          type="primary"
          :loading="isCurrentChannelLoading"
          @click="handleUpdateChannel"
          >{{ t("bots_notifications.actions.edit_chanell") }}</a-button
        >
      </template>
    </a-modal>
  </a-col>
  <loading v-else />
</template>

<script setup>
import Loading from "@/components/ui/loading.vue";
import { useNotification } from "@/hooks/utils";
import { useAiBotsStore } from "@/stores/aiBots";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import api from "@/api";
import { marked } from "marked";

const renderer = new marked.Renderer();

renderer.link = function (href, title, text) {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

renderer.code = function (code, language) {
  const escapedCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const uid = `copy-code-${Math.random().toString(36).substring(2, 8)}`;

  return `
    <div class="code-block" style="position:relative;">
      <pre><code id="${uid}" class="language-${language}">${escapedCode}</code></pre>
      <button
        class="copy-button"
        style="position:absolute; top:5px; right:5px;"
        onclick="navigator.clipboard.writeText(document.getElementById('${uid}').innerText)">
        Copy
      </button>
    </div>
  `;
};

marked.setOptions({ renderer });

const props = defineProps({
  service: { type: Object, required: true },
});

const aiBotsStore = useAiBotsStore();
const { bots } = storeToRefs(aiBotsStore);

const { openNotification } = useNotification();
const { t, locale } = useI18n();

const isDataLoading = ref(false);
const isToggleLoading = ref(false);

const notificationsData = ref({
  channels: [],
  event_types: [],
  receivers: [],
  subscriptions: [],
});

const currentChannel = ref({});
const currentChannelFormRef = ref();
const isCurrentChannelLoading = ref(false);
const isCurrentChannelOpen = ref(false);
const currentChannelMeta = ref({});

onMounted(async () => {
  try {
    isDataLoading.value = true;

    await aiBotsStore.getBot(props.service.data.bot_uuid);

    const data = await api.post("/agents/api/get_subscriptions", {
      bot: bot.value.id,
    });

    data.subscriptions = data.subscriptions || [];
    data.receivers = data.receivers || [];
    data.event_types = data.event_types || [];
    data.channels = data.channels || [];
    notificationsData.value = data;
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isDataLoading.value = false;
  }
});

const bot = computed(() => bots.value.get(props.service.data.bot_uuid));

const channels = computed(() =>
  notificationsData.value.channels.map((chanell) => ({
    ...chanell,
    configured: (notificationsData.value.receivers || []).find(
      (receiver) => receiver.name === chanell.code
    ),
    receiver_id: (notificationsData.value.receivers || []).find(
      (receiver) => receiver.name === chanell.code
    )?.id,
  }))
);
const eventTypes = computed(() => notificationsData.value.event_types);

const currentChannelRules = computed(() => {
  if (currentChannel.value.channel_key === "email") {
    return {
      recipient: [
        { required: true, message: t("ssl_product.field is required") },
      ],
    };
  }

  return {};
});

const handleOpenChanellSettings = (chanell) => {
  currentChannel.value = { channel_key: chanell.code };
  if (currentChannel.value.channel_key === "email") {
    currentChannel.value.recipient = "";
  }

  if (currentChannel.value.channel_key === "telegram") {
    setTimeout(() => {
      handleUpdateChannel();
    }, 50);
  }

  isCurrentChannelOpen.value = true;
};

const handleUpdateChannel = async () => {
  if (currentChannelFormRef.value) {
    await currentChannelFormRef.value.validate();
  }
  isCurrentChannelLoading.value = true;
  try {
    const data = {
      bot: bot.value.id,
      channel_key: currentChannel.value.channel_key,
      receiver_data: {},
    };

    if (currentChannel.value.channel_key === "email") {
      data.receiver_data.recipient = currentChannel.value.recipient;
    }

    const response = await api.post("/agents/api/add_receiver", data);

    if (!response.created) {
      currentChannelMeta.value = response.meta;
      return;
    }

    notificationsData.value.receivers.push(response.receiver);

    isCurrentChannelOpen.value = false;
    currentChannel.value = {};

    openNotification("success", {
      message: `${t("Done")}!`,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isCurrentChannelLoading.value = false;
  }
};

const handleToggleSubscription = async (channel, event, value) => {
  try {
    isToggleLoading.value = true;

    await api.post("/agents/api/toggle_subscription", {
      bot: bot.value.id,
      channel_key: channel.code,
      event_key: event.code,
      toggle: value,
    });

    if (value) {
      notificationsData.value.subscriptions.push({
        receiver_id: channel.receiver_id,
        event_type_id: event.id,
      });
    } else {
      notificationsData.value.subscriptions =
        notificationsData.value.subscriptions.filter(
          (s) =>
            s.receiver_id !== channel.receiver_id ||
            s.event_type_id !== event.id
        );
    }

    openNotification("success", {
      message: `${t("Done")}!`,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  } finally {
    isToggleLoading.value = false;
  }
};

const handleDeleteChanell = async (chanell) => {
  try {
    await api.post("/agents/api/delete_receiver", {
      receiver_id: chanell.receiver_id,
    });

    notificationsData.value.receivers =
      notificationsData.value.receivers.filter(
        (r) => r.id !== chanell.receiver_id
      );

    notificationsData.value.subscriptions =
      notificationsData.value.subscriptions.filter(
        (s) => s.receiver_id !== chanell.receiver_id
      );

    openNotification("success", {
      message: `${t("Done")}!`,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${
        err?.response?.data?.message || err?.response?.data || "Unknown"
      }.`,
    };
    openNotification("error", opts);
  }
};

watch(isCurrentChannelOpen, (value) => {
  if (!value) {
    currentChannelMeta.value = {};
  }
});

watch(currentChannelMeta, () => {
  setTimeout(() => {
    const tgInstruction = document.getElementById("tg_instruction");
    if (!tgInstruction) {
      return;
    }

    const code = tgInstruction.querySelector("code");
    code.style.cursor = "pointer";
    code.addEventListener("click", async () => {
      navigator.clipboard.writeText(code.innerText);

      openNotification("success", {
        message: `${t("Done")}!`,
      });
    });
  }, 50);
});
</script>

<script>
export default { name: "AiBotNotifications" };
</script>

<style scoped>
.chanell_icon {
  width: 25px;
  height: 25px;
}

.chanell_title {
  margin-left: 10px;
  font-size: 1.3rem;
}

.chanell_main {
  display: flex;
  align-items: center;
}

.chanell_info {
  display: flex;
  align-items: center;
}

.rule_title {
  font-size: 1rem;
  margin-left: 10px;
}

.chanell_notification_rule {
  display: flex;
  align-items: center;
}

.chanell {
  margin-bottom: 25px;
}
</style>
