<template>
  <template v-if="!isLoading">
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
                :src="`/img/chanells/${chanell.type}.png`"
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

      <a-col
        span="24"
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        "
      >
        <span class="field_title"
          >{{ t("bots.fields.enable_spam_filter") }}:
          <a-tooltip>
            <template #title>
              <span
                v-html="
                  t('bots.tips.enable_spam_filter').replaceAll('\n', '<br/>')
                "
              >
              </span>
            </template>
            <help-icon style="margin-left: 5px" /> </a-tooltip
        ></span>
        <a-switch v-model:checked="bot.settings.enable_spam_filter" />
      </a-col>

      <a-col span="24">
        <span class="field_title"
          >{{ t("bots.fields.temperature") }}: {{ bot.settings?.temperature }}
          <a-tooltip>
            <template #title>
              <span
                v-html="t('bots.tips.temperature').replaceAll('\n', '<br/>')"
              >
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
        <span class="field_title"
          >{{ t("bots.fields.role") }}:

          <a-tooltip>
            <template #title>
              <span v-html="t('bots.tips.role').replaceAll('\n', '<br/>')">
              </span>
            </template>
            <help-icon style="margin-left: 5px" />
          </a-tooltip>
        </span>

        <a-select
          :options="rolesOptions"
          style="margin-top: 10px; width: 100%"
          v-model:value="bot.settings.role"
          @change="handleRoleChange"
        />
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
          :placeholder="t('bots.placeholders.promt')"
          :auto-size="{ minRows: 4 }"
        />
      </a-col>

      <a-col span="24" style="margin-bottom: 40px; margin-top: 10px">
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
            v-for="field in Object.keys(chanellsFields)"
            :name="field"
            :label="t(`bots.chanell_fields.${field}.label`)"
          >
            <div style="display: flex">
              <a-input
                :type="chanellsFields[field].hided ? 'password' : ''"
                v-model:value="newChanellData[field]"
                :placeholder="t(`bots.chanell_fields.${field}.label`)"
                autocomplete="off"
              />
              <a-tooltip>
                <template #title>
                  <span
                    v-html="
                      t(`bots.chanell_fields.${field}.tip`).replaceAll(
                        '\n',
                        '<br/>'
                      )
                    "
                  >
                  </span>
                </template>
                <help-icon style="font-size: 1.5rem; margin-left: 5px" />
              </a-tooltip>
            </div>
          </a-form-item>
        </a-form>

        <span
          v-html="marked(t(`bots.chanells_instruction.${newChanellData.type}`))"
        ></span>

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
          <a-form-item
            v-if="selectedEditedChanell.data.metadata.username"
            :label="t('bots.fields.chanell_username')"
          >
            <a
              v-if="
                selectedEditedChanell.data.metadata.username.startsWith('t.me')
              "
              target="_blank"
              :href="`https://${selectedEditedChanell.data.metadata.username}`"
            >
              {{ selectedEditedChanell.data.metadata.username }}</a
            >
            <span v-else>
              {{ selectedEditedChanell.data.metadata.username }}
            </span>
          </a-form-item>

          <a-form-item
            v-if="selectedEditedChanell.data.metadata.firstname"
            :label="t('bots.fields.chanell_firstname')"
          >
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
            v-for="field in Object.keys(chanellsFields)"
            :name="field"
            :label="t(`bots.chanell_fields.${field}.label`)"
            autocomplete="off"
          >
            <div style="display: flex">
              <a-input
                :type="chanellsFields[field].hided ? 'password' : ''"
                v-model:value="editedChanellData[field]"
                :placeholder="t(`bots.chanell_fields.${field}.label`)"
                autocomplete="off"
              />

              <a-tooltip>
                <template #title>
                  <span
                    v-html="
                      t(`bots.chanell_fields.${field}.tip`).replaceAll(
                        '\n',
                        '<br/>'
                      )
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
  </template>
  <loading v-else />
</template>

<script setup>
import api from "@/api";
import { capitalize, computed, defineAsyncComponent, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";
import { useAiBotsStore } from "@/stores/aiBots";
import { useChatsStore } from "@/stores/chats";
import { marked } from "marked";
import Loading from "@/components/ui/loading.vue";

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
      const hue = 200 - ((v - 1) / (100 - 1)) * (200 - 15);
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
    const hue = 200 - v * (200 - 15);
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

const chanellsOptions = [
  { title: "Telegram", key: "telegram" },
  { title: "Bitrix24", key: "bitrix24" },
];

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
  settings: {
    delay: 0,
    ai_model: "",
    system_prompt: "",
    enable_spam_filter: true,
    role: "",
  },
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
const editedChanellData = ref({ type: "" });
const newChanellData = ref({ type: "" });

const newChanellFormRules = computed(() => {
  const fields = Object.keys(chanellsFields.value).reduce((acc, v) => {
    acc[v] = [{ required: true, message: t("ssl_product.field is required") }];
    return acc;
  }, {});

  return {
    ...fields,
  };
});

const editChanellFormRules = computed(() => {
  const fields = Object.keys(chanellsFields.value).reduce((acc, v) => {
    acc[v] = [{ required: true, message: t("ssl_product.field is required") }];
    return acc;
  }, {});

  return {
    ...fields,
    name: [{ required: true, message: t("ssl_product.field is required") }],
  };
});

const rolesOptions = computed(() => [
  ...roles.value.map((role) => ({
    value: role.key,
    label: `${role.display_name} ${
      role.description ? `- ${role.description}` : ""
    }`,
  })),

  { value: null, label: t("bots.roles.none") },
]);

const chanellsFields = computed(() => {
  if (
    [newChanellData.value.type, selectedEditedChanell.value.type].includes(
      "bitrix24"
    )
  ) {
    return { unique_name: { hided: false }, api_url: { hided: true } };
  }

  return { bot_secret: { hided: true } };
});

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

const roles = computed(() => aiBotsStore.roles);

const isSavePrimary = computed(
  () => JSON.stringify(ogBot.value) != JSON.stringify(bot.value)
);

async function fetch() {
  try {
    isLoading.value = true;

    bot.value = await aiBotsStore.getBot(props.service.data.bot_uuid);
    if (!bot.value.channels) {
      bot.value.channels = [];
    }
    if (!bot.value.settings.role) {
      bot.value.settings.role = null;
    }
    ogBot.value = JSON.parse(JSON.stringify(bot.value));

    await aiBotsStore.getRoles();
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
    name: chanell.title,
    ...chanell.data.data,
  };
  selectedEditedChanell.value = JSON.parse(JSON.stringify(chanell));
};

const handleRoleChange = () => {
  if (
    !(bot.value.settings.system_prompt || "").trim() ||
    !!roles.value.find(
      (role) => role.example_prompt === bot.value.settings.system_prompt
    )
  ) {
    const fullRole = roles.value.find((r) => r.key === bot.value.settings.role);

    bot.value.settings.system_prompt = fullRole?.example_prompt;
  }
};

const handleSaveChanell = async () => {
  await editChanellFormRef.value.validate();
  isChanellSaveLoading.value = true;
  try {
    const chanellData = { ...editedChanellData.value };
    delete chanellData.name;

    await api.post("/agents/api/test_channel", {
      bot: bot.value.id,
      data: chanellData,
      type: selectedEditedChanell.value.type,
    });

    await api.post("/agents/api/delete_channel", {
      bot: bot.value.id,
      channel: selectedEditedChanell.value.data.id,
    });

    const chanellId = selectedEditedChanell.value.data.id;
    delete selectedEditedChanell.value.data.id;
    const data = await api.post("/agents/api/add_channel", {
      bot: bot.value.id,
      data: chanellData,
      custom_name: editedChanellData.value.name,
      type: selectedEditedChanell.value.type,
    });

    bot.value.channels = bot.value.channels.filter(
      (chanell) => chanell.id != chanellId
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
    const chanellData = { ...newChanellData.value };
    delete chanellData.type;

    const data = await api.post("/agents/api/add_channel", {
      bot: bot.value.id,
      data: chanellData,
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

watch(
  () => newChanellData.value.type,
  (newType) => {
    newChanellData.value = {
      ...Object.keys(chanellsFields.value).reduce((acc, v) => {
        acc[v] = "";
        return acc;
      }, {}),
      type: newType,
    };
  }
);

watch(isChanellAddOpen, (value) => {
  if (!value) {
    newChanellData.value.type = "";
  }
});

watch(isChanellEditOpen, (value) => {
  if (!value) {
    selectedEditedChanell.value.type = "";
  }
});
</script>

<script>
export default { name: "AiBotDraw" };
</script>

<style scoped>
.bots .field_title {
  font-size: 1.1rem;
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
