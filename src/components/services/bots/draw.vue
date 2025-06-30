<template>
  <a-row class="bots" style="margin-top: 10px" :gutter="[10, 10]">
    <a-col span="24">
      <span class="field_title"
        >{{ capitalize(t("bots.fields.model")) }}:
        {{
          chatsStore.globalModelsList.find(
            (m) => m.key === bot.settings.ai_model
          )?.name || bot.settings.ai_model
        }}</span
      >
    </a-col>
    <a-col span="24">
      <span v-html="marked(t('bots.tips.model'))"> </span>
    </a-col>

    <a-col span="24">
      <span class="field_title"
        >{{ t("bots.fields.promt") }}:

        <a-tooltip>
          <template #title>
            <span v-html="t('bots.tips.promt').replaceAll('\n', '<br/>')">
            </span>
          </template>
          <help-icon style="margin-left: 5px" />
        </a-tooltip>
      </span>
      <a-textarea
        style="margin-top: 10px"
        v-model:value="bot.settings.system_prompt"
        :placeholder="t('bots.fields.promt')"
        :auto-size="{ minRows: 4 }"
      />
    </a-col>

    <a-col span="24">
      <span class="field_title"
        >{{ t("bots.fields.temperature") }}: {{ bot.settings?.temperature }}
        <a-tooltip>
          <template #title>
            <span v-html="t('bots.tips.temperature').replaceAll('\n', '<br/>')">
            </span>
          </template>
          <help-icon style="margin-left: 5px" />
        </a-tooltip>
      </span>
      <a-slider
        @change="bot.settings.temperature = $event"
        :value="bot.settings?.temperature"
        :marks="temperatureMarks"
        :tip-formatter="
          (value) => {
            return `${value}`;
          }
        "
        :step="0.05"
        :min="0.0"
        :max="1.0"
      >
        <template #mark="{ label, point }">
          <template v-if="point === 100">
            <strong>{{ label }}</strong>
          </template>
          <template v-else>{{ label }}</template>
        </template>
      </a-slider>
    </a-col>

    <a-col span="24">
      <span class="field_title"
        >{{ t("bots.fields.delay") }}: {{ bot.settings?.delay }}
        {{ t("bots.labels.seconds")
        }}<a-tooltip>
          <template #title>
            <span v-html="t('bots.tips.delay').replaceAll('\n', '<br/>')">
            </span>
          </template>
          <help-icon style="margin-left: 5px" /> </a-tooltip
      ></span>
      <a-slider
        @change="bot.settings.delay = $event"
        :value="bot.settings?.delay"
        :marks="delayMarks"
        :tip-formatter="
          (value) => {
            return `${value} ${t('bots.labels.seconds')}`;
          }
        "
        :step="1"
        :min="0"
        :max="100"
      >
        <template #mark="{ label, point }">
          <template v-if="point === 100">
            <strong>{{ label }}</strong>
          </template>
          <template v-else>{{ label }}</template>
        </template>
      </a-slider>
    </a-col>

    <a-col span="24">
      <a-row justify="end">
        <a-button
          key="back"
          :loading="isBotSaveLoading"
          @click="handleSaveBot"
          :type="isSavePrimary ? 'primary' : 'default'"
          >{{ t("bots.actions.save_bot") }}
        </a-button>
      </a-row>
    </a-col>

    <a-col span="24">
      <span class="field_title"
        >{{ t("bots.fields.channels") }}:

        <a-tooltip>
          <template #title>
            <span v-html="t('bots.tips.channels').replaceAll('\n', '<br/>')">
            </span>
          </template>
          <help-icon style="margin-left: 5px" />
        </a-tooltip>
      </span>
      <a-row>
        <a-col v-for="chanell in availableChanells" span="6">
          <div
            @click="
              chanell.exist
                ? openChanellEdit(chanell)
                : openChanellAdd(chanell.type)
            "
            class="chanell"
          >
            <img
              class="img_prod"
              :src="`/img/icons/${chanell.type}.png`"
              alt="telegram"
              @error="onError"
            />
            <span
              style="
                display: -webkit-box;
                -webkit-box-orient: vertical;
                -webkit-line-clamp: 2;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 95px;
                white-space: normal;
                word-break: break-word;
                overflow-wrap: break-word;
              "
              >{{ chanell.title }}</span
            >
            <span
              :class="{
                'status-circle': true,
                red: !chanell.exist,
                green: chanell.exist,
              }"
            ></span>
          </div>
        </a-col>

        <a-col span="6" v-if="bot.channels.length > 0">
          <div @click="openChanellAdd()" class="chanell">
            <plus-circle-outlined style="font-size: 2rem" class="img_prod" />
            <span>{{ t("bots.actions.add_new_chanell") }}</span>
          </div>
        </a-col>
      </a-row>
    </a-col>

    <a-modal
      v-model:open="isChanellAddOpen"
      :title="t('bots.labels.add_new_chanell_title')"
    >
      <a-form
        ref="addChanellFormRef"
        layout="vertical"
        autocomplete="off"
        :model="newChanellData"
        :rules="newChanellFormRules"
      >
        <a-form-item name="type" :label="t('bots.fields.chanell_type')">
          <a-select
            v-model:value="newChanellData.type"
            :options="
              chanellsOptions.map((chanell) => ({
                value: chanell.key,
                label: chanell.title,
              }))
            "
          ></a-select>
        </a-form-item>

        <a-form-item
          name="bot_secret"
          :label="t('bots.fields.chanell_secret_key')"
        >
          <div style="display: flex">
            <a-input
              type="password"
              v-model:value="newChanellData.bot_secret"
              :placeholder="t('bots.fields.chanell_secret_key')"
              autocomplete="off"
            />
            <a-tooltip>
              <template #title>
                <span
                  v-html="
                    t('bots.tips.chanell_secret_key').replaceAll('\n', '<br/>')
                  "
                >
                </span>
              </template>
              <help-icon style="font-size: 1.5rem; margin-left: 5px" />
            </a-tooltip>
          </div>
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button
          key="back"
          :disabled="isChanellSaveLoading || isChanellDeleteLoading"
          @click="isChanellAddOpen = false"
          >{{ t("Cancel") }}</a-button
        >

        <a-button
          key="submit"
          type="primary"
          :loading="isChanellSaveLoading"
          :disabled="isChanellDeleteLoading"
          @click="handleAddChanell"
          >{{ t("bots.actions.add_chanell") }}</a-button
        >
      </template>
    </a-modal>

    <a-modal
      v-model:open="isChanellEditOpen"
      :title="`${t('bots.labels.edit_chanell_title')} ${
        selectedEditedChanell.title
      }`"
    >
      <a-form
        ref="editChanellFormRef"
        layout="vertical"
        autocomplete="off"
        :model="editedChanellData"
        :rules="editChanellFormRules"
      >
        <a-form-item :label="t('bots.fields.chanell_link')">
          <a
            target="_blank"
            :href="`https://${selectedEditedChanell.data.metadata.username}`"
          >
            {{ selectedEditedChanell.data.metadata.username }}</a
          >
        </a-form-item>

        <a-form-item :label="t('bots.fields.chanell_firstname')">
          <span> {{ selectedEditedChanell.data.metadata.firstname }}</span>
        </a-form-item>

        <a-form-item name="name" :label="t('bots.fields.chanell_name')">
          <a-input
            v-model:value="editedChanellData.name"
            :placeholder="t('bots.fields.chanell_name')"
            autocomplete="off"
          />
        </a-form-item>
        <a-form-item
          name="bot_secret"
          :label="t('bots.fields.chanell_secret_key')"
          autocomplete="off"
        >
          <div style="display: flex">
            <a-input
              type="password"
              v-model:value="editedChanellData.bot_secret"
              :placeholder="t('bots.fields.chanell_secret_key')"
              autocomplete="off"
            />

            <a-tooltip>
              <template #title>
                <span
                  v-html="
                    t('bots.tips.chanell_secret_key').replaceAll('\n', '<br/>')
                  "
                >
                </span>
              </template>
              <help-icon style="font-size: 1.5rem; margin-left: 5px" />
            </a-tooltip>
          </div>
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button
          key="back"
          :disabled="isChanellSaveLoading || isChanellDeleteLoading"
          @click="isChanellEditOpen = false"
          >{{ t("Cancel") }}</a-button
        >

        <a-popconfirm
          :title="t('bots.labels.delete_confirm_label')"
          :ok-text="t('Yes')"
          :cancel-text="t('Cancel')"
          @confirm="handleDeleteChanell"
        >
          <a-button key="back" :loading="isChanellDeleteLoading" danger>{{
            t("bots.actions.delete_chanell")
          }}</a-button>
        </a-popconfirm>

        <a-button
          key="submit"
          type="primary"
          :loading="isChanellSaveLoading"
          :disabled="isChanellDeleteLoading"
          @click="handleSaveChanell"
        >
          {{ t("bots.actions.update_chanell") }}
        </a-button>
      </template>
    </a-modal>
  </a-row>

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
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup>
import api from "@/api";
import { capitalize, computed, defineAsyncComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";
import ChatItem from "./chatItem.vue";
import { sortAiBotChats, useAiBotsStore } from "@/stores/aiBots";
import { useChatsStore } from "@/stores/chats";
import { marked } from "marked";

const helpIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/QuestionCircleOutlined")
);

const plusCircleOutlined = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusCircleOutlined")
);

const props = defineProps({
  service: { type: Object, required: true },
});

const delayMarks = computed(() =>
  Object.fromEntries(
    [1, 10, 25, 50, 75, 100].map((v) => {
      const hue = 200 - ((v - 1) / (100 - 1)) * (200 - 15); // нормализация от 1 до 100
      return [
        v,
        {
          style: { color: `hsl(${hue.toFixed(0)}, 50%, 70%)` },
          label: `${v}${t("bots.labels.s")}`,
        },
      ];
    })
  )
);

const temperatureMarks = Object.fromEntries(
  [0, 0.25, 0.5, 0.75, 1.0].map((v) => {
    const hue = 200 - v * (200 - 15); // нормализация: 0–1 в диапазоне 200–15
    const isInteger = Number.isInteger(v);
    return [
      v,
      {
        style: { color: `hsl(${hue.toFixed(0)}, 50%, 70%)` },
        label: isInteger ? `${v}` : `${v.toFixed(2)}`,
      },
    ];
  })
);

const chanellsOptions = [{ title: "Telegram", key: "telegram" }];

const { t } = useI18n();
const { openNotification } = useNotification();
const aiBotsStore = useAiBotsStore();
const chatsStore = useChatsStore();

const isLoading = ref(false);
const isBotSaveLoading = ref(false);
const bot = ref({
  id: "",
  name: "",
  ownership: { owner: "" },
  settings: { delay: 0, ai_model: "", system_prompt: "" },
  channels: [],
});
const ogBot = ref();

const isChanellEditOpen = ref(false);
const isChanellAddOpen = ref(false);
const isChanellSaveLoading = ref(false);
const isChanellDeleteLoading = ref(false);
const selectedEditedChanell = ref("");
const addChanellFormRef = ref();
const editChanellFormRef = ref();
const editedChanellData = ref({ bot_secret: "" });
const newChanellData = ref({ bot_secret: "", type: "" });

const newChanellFormRules = computed(() => ({
  bot_secret: [{ required: true, message: t("ssl_product.field is required") }],
}));

const editChanellFormRules = computed(() => ({
  bot_secret: [{ required: true, message: t("ssl_product.field is required") }],
  name: [{ required: true, message: t("ssl_product.field is required") }],
}));

const availableChanells = computed(() => {
  const placeholders = chanellsOptions
    .filter(
      (channel) => !bot.value.channels.find((item) => item.type === channel.key)
    )
    .map((chanell) => ({
      type: chanell.key,
      title: chanell.title,
      exist: false,
    }));

  return placeholders.concat(
    bot.value.channels.map((chanell) => ({
      type: chanell.type,
      title:
        chanell.metadata?.custom_name ||
        chanell.metadata?.firstname ||
        chanellsOptions.find((c) => c.type === chanell.type)?.title ||
        chanell.type,
      exist: true,
      data: chanell,
    }))
  );
});

const isSavePrimary = computed(
  () => JSON.stringify(ogBot.value) != JSON.stringify(bot.value)
);

const chats = computed(() =>
  sortAiBotChats(aiBotsStore.chats.get(bot.value.id) || []).slice(0, 3)
);

async function fetch() {
  try {
    isLoading.value = true;

    bot.value = await aiBotsStore.getBot(props.service.data.bot_uuid);
    if (!bot.value.channels) {
      bot.value.channels = [];
    }
    ogBot.value = JSON.parse(JSON.stringify(bot.value));

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

const openChanellAdd = (type) => {
  isChanellAddOpen.value = true;
  if (type) {
    newChanellData.value.type = type;
  } else {
    newChanellData.value.type = chanellsOptions[0].key;
  }
};

const openChanellEdit = (chanell) => {
  isChanellEditOpen.value = true;
  editedChanellData.value = {
    bot_secret: chanell.data.data.bot_secret,
    name: chanell.title,
  };
  selectedEditedChanell.value = chanell;
};

const handleSaveChanell = async () => {
  await editChanellFormRef.value.validate();
  isChanellSaveLoading.value = true;
  try {
    await api.post("/agents/api/test_channel", {
      bot: bot.value.id,
      data: { bot_secret: editedChanellData.value.bot_secret },
      type: selectedEditedChanell.value.type,
    });

    await api.post("/agents/api/delete_channel", {
      bot: bot.value.id,
      channel: selectedEditedChanell.value.data.id,
    });

    delete selectedEditedChanell.value.data.id;
    const data = await api.post("/agents/api/add_channel", {
      bot: bot.value.id,
      data: { bot_secret: editedChanellData.value.bot_secret },
      custom_name: editedChanellData.value.name,
      type: selectedEditedChanell.value.type,
    });

    bot.value.channels = bot.value.channels.filter(
      (chanell) => chanell.id != selectedEditedChanell.value.data.id
    );
    bot.value.channels.push(data);

    ogBot.value = JSON.parse(JSON.stringify(bot.value));

    editedChanellData.value = {};
    isChanellEditOpen.value = false;

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
    isChanellSaveLoading.value = false;
  }
};

const handleAddChanell = async () => {
  await addChanellFormRef.value.validate();
  isChanellSaveLoading.value = true;
  try {
    const data = await api.post("/agents/api/add_channel", {
      bot: bot.value.id,
      data: { bot_secret: newChanellData.value.bot_secret },
      type: newChanellData.value.type,
    });
    bot.value.channels.push(data);
    ogBot.value = JSON.parse(JSON.stringify(bot.value));

    isChanellAddOpen.value = false;
    newChanellData.value = {};

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
    isChanellSaveLoading.value = false;
  }
};

const handleDeleteChanell = async () => {
  isChanellDeleteLoading.value = true;
  try {
    await api.post("/agents/api/delete_channel", {
      bot: bot.value.id,
      channel: selectedEditedChanell.value.data.id,
    });
    bot.value.channels = bot.value.channels.filter(
      (chanell) => chanell.id != selectedEditedChanell.value.data.id
    );

    ogBot.value = JSON.parse(JSON.stringify(bot.value));

    editedChanellData.value = {};
    isChanellEditOpen.value = false;

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
    isChanellDeleteLoading.value = false;
  }
};

const handleSaveBot = async () => {
  isBotSaveLoading.value = true;
  try {
    await aiBotsStore.updateBot(bot.value);
    ogBot.value = JSON.parse(JSON.stringify(bot.value));

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
    isBotSaveLoading.value = false;
  }
};
</script>

<script>
export default { name: "AiBotDraw" };
</script>

<style scoped>
.bots .field_title {
  font-size: 1rem;
  font-weight: 500;
}

.chanell {
  height: 60px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.3s ease;
}

.chanell:hover {
  background-color: #f0f0f0;
}

.img_prod {
  width: 32px;
  height: 32px;
  transition: filter 0.3s ease;
}

.chanell:hover .img_prod {
  filter: brightness(0.8);
}

.status-circle {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  margin-left: auto;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

.status-circle.green {
  background-color: #4caf50;
}

.status-circle.red {
  background-color: #f44336;
}
</style>
