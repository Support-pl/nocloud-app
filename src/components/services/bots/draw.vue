<template>
  <a-row class="bots" style="margin-top: 10px" :gutter="[10, 10]">
    <a-col span="24">
      <span class="field_title"
        >{{ capitalize(t("model")) }}:
        {{
          chatsStore.globalModelsList.find(
            (m) => m.key === bot.settings.ai_model
          )?.name || bot.settings.ai_model
        }}</span
      >
    </a-col>
    <a-col span="24">
      <span
        v-html="
          marked(`
**GPT-4o Mini** — облегчённая версия модели GPT-4o, оптимизированная для быстрой и эффективной работы в режиме реального времени.

## Преимущества для онлайн-ассистентов:

- **Быстрая реакция:** мгновенные ответы, идеально подходят для чат-ботов и помощников.
- **Низкое потребление ресурсов:** подходит для облака, локальных и мобильных приложений.
- **Высокое качество ответов:** поддерживает контекст и адаптацию к стилю общения.
- **Отличный баланс между качеством и скоростью:** идеально для повседневных задач и клиентов.

## Почему мы выбрали именно GPT-4o Mini?

Мы выбрали GPT-4o Mini для вашего онлайн-ассистента, потому что она сочетает в себе высокую скорость, эффективность и надежность, обеспечивая при этом качественные и живые ответы.

`)
        "
      >
      </span>
    </a-col>

    <a-col span="24">
      <span class="field_title"
        >Bot promt:

        <a-tooltip>
          <template #title>
            <span
              v-html="
                'Промпт — это начальный текст или команда, которые вы даёте ассистенту, чтобы направить его ответы в нужное русло.\nХорошо составленный промпт помогает получить более точные и релевантные ответы.\nМожно использовать инструкции, вопросы или примеры, чтобы задать контекст.'.replaceAll(
                  '\n',
                  '<br/>'
                )
              "
            >
            </span>
          </template>
          <help-icon style="margin-left: 5px" />
        </a-tooltip>
      </span>
      <a-textarea
        v-model:value="bot.settings.system_prompt"
        placeholder="more about promt"
        :auto-size="{ minRows: 4 }"
      />
    </a-col>

    <a-col span="24">
      <span class="field_title"
        >Temperature: {{ bot.settings?.temperature }}
        <a-tooltip>
          <template #title>
            <span
              v-html="
                'Чем выше значение temperature, тем креативнее и разнообразнее ответы.\n0 — строго и предсказуемо.\n1 — естественный стиль с долей креативности.\n2 — максимально креативно и неожиданно.'.replaceAll(
                  '\n',
                  '<br/>'
                )
              "
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
        :step="0.1"
        :min="0.0"
        :max="2.0"
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
        >Delay: {{ bot.settings?.delay }} seconds<a-tooltip>
          <template #title>
            <span
              v-html="
                'Задержка перед ответом бота.\nУказывается в секундах.\n0 — ответ сразу.\n3 — бот ждёт 3 секунды перед ответом.\nИспользуется для имитации «человеческой паузы».'.replaceAll(
                  '\n',
                  '<br/>'
                )
              "
            >
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
            return `${value} seconds`;
          }
        "
        :step="5"
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
        >Channels:

        <a-tooltip>
          <template #title>
            <span
              v-html="
                'Создайте канал для вашего онлайн-ассистента.\nВсе сообщения, отправленные в этот канал, будут автоматически обрабатываться ботом и получать ответы.'.replaceAll(
                  '\n',
                  '<br/>'
                )
              "
            >
            </span>
          </template>
          <help-icon style="margin-left: 5px" />
        </a-tooltip>
      </span>
      <a-row>
        <a-col v-for="chanell in chanellsOptions" span="6">
          <div @click="openChanell(chanell.key)" class="chanell">
            <img
              class="img_prod"
              :src="`/img/icons/${chanell.key}.png`"
              alt="telegram"
              @error="onError"
            />
            <span>{{ chanell.title }}</span>
            <span
              :class="{
                'status-circle': true,
                red: !existingChanells.has(chanell.key),
                green: !!existingChanells.has(chanell.key),
              }"
            ></span>
          </div>
        </a-col>
      </a-row>
    </a-col>

    <a-col span="24">
      <a-row justify="end">
        <a-button
          key="back"
          :loading="isBotSaveLoading"
          @click="handleSaveBot"
          :type="isSavePrimary ? 'primary' : ''"
          >{{ t("Save") }}</a-button
        >
      </a-row>
    </a-col>

    <a-modal v-model:open="isChanellOpen" :title="`Chanell ${selectedChanell}`">
      <a-form
        ref="selectedChanellFormRef"
        layout="vertical"
        autocomplete="off"
        :model="newChanellData"
        :rules="selectedChanellFormRules"
      >
        <a-form-item name="bot_secret" label="Secret key">
          <a-input
            type="password"
            v-model:value="newChanellData.bot_secret"
            placeholder="Secret key"
          />
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button
          key="back"
          :disabled="isChanellSaveLoading || isChanellDeleteLoading"
          @click="isChanellOpen = false"
          >{{ t("Cancel") }}</a-button
        >

        <a-popconfirm
          v-if="newChanellData.id"
          title="You realy wanna delete chanell??)"
          :ok-text="t('Yes')"
          :cancel-text="t('Cancel')"
          @confirm="handleDeleteChanell"
        >
          <a-button key="back" :loading="isChanellDeleteLoading" danger>{{
            t("Delete")
          }}</a-button>
        </a-popconfirm>
        <a-button
          key="submit"
          type="primary"
          :loading="isChanellSaveLoading"
          :disabled="isChanellDeleteLoading"
          @click="handleSaveChanell"
          >{{ t("Save") }}</a-button
        >
      </template>
    </a-modal>
  </a-row>

  <a-row style="margin-top: 15px">
    <a-col span="24">
      <chat-item :bot-id="bot.id" v-for="chat in chats" :chat="chat" />
    </a-col>
  </a-row>
</template>

<script setup>
import api from "@/api";
import { capitalize, computed, defineAsyncComponent, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useNotification } from "@/hooks/utils";
import ChatItem from "./chatItem.vue";
import { useAiBotsStore } from "@/stores/aiBots";
import { useChatsStore } from "@/stores/chats";
import { marked } from "marked";

const helpIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/QuestionCircleOutlined")
);

const props = defineProps({
  service: { type: Object, required: true },
});

const delayMarks = Object.fromEntries(
  [...Array(10).keys()]
    .map((i) => i + 1)
    .concat(Array.from({ length: (100 - 15) / 5 + 1 }, (_, i) => 15 + i * 5))
    .map((v) => {
      const hue = 200 - ((v - 1) / (100 - 1)) * (200 - 15);
      return [
        v,
        {
          style: { color: `hsl(${hue.toFixed(0)}, 50%, 70%)` },
          ...([1, 10, 25, 50, 75, 100].includes(v) ? { label: `${v}s` } : {}),
        },
      ];
    })
);

const temperatureMarks = Object.fromEntries(
  [0.5, 1, 1.5, 2.0].map((v) => {
    const hue = 200 - (v / 2) * (200 - 15); // нормализация: 0.5–2.0 в диапазоне 200–15
    return [
      v,
      {
        style: { color: `hsl(${hue.toFixed(0)}, 50%, 70%)` },
        label: `${v}`,
      },
    ];
  })
);

console.log(temperatureMarks);

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

const chats = ref([]);

const isChanellOpen = ref(false);
const isChanellSaveLoading = ref(false);
const isChanellDeleteLoading = ref(false);
const selectedChanell = ref("");
const selectedChanellFormRef = ref();
const newChanellData = ref({ bot_secret: "" });
const selectedChanellFormRules = computed(() => ({
  bot_secret: [{ required: true, message: t("ssl_product.field is required") }],
}));

const existingChanells = computed(() => {
  const map = new Map();

  bot.value.channels.forEach((chanell) => {
    map.set(chanell.type, chanell);
  });

  return map;
});

const isSavePrimary = computed(
  () => JSON.stringify(ogBot.value) != JSON.stringify(bot.value)
);

async function fetch() {
  try {
    isLoading.value = true;

    bot.value = await aiBotsStore.getBot(props.service.data.bot_uuid);
    ogBot.value = JSON.parse(JSON.stringify(bot.value));
    if (!bot.value.channels) {
      bot.value.channels = [];
    }

    chats.value = (await aiBotsStore.fetchChats(bot.value.id)).slice(0, 3);

    aiBotsStore.startChatsStream();
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

fetch();

const openChanell = (type) => {
  selectedChanell.value = type;
  isChanellOpen.value = true;
  if (existingChanells.value.has(type)) {
    newChanellData.value = {
      ...existingChanells.value.get(type).data,
      id: existingChanells.value.get(type).ID,
    };
  } else {
    newChanellData.value = {};
  }
};

const handleSaveChanell = async () => {
  await selectedChanellFormRef.value.validate();
  isChanellSaveLoading.value = true;
  try {
    if (existingChanells.value.get(selectedChanell.value)) {
      await api.post("/agents/api/delete_channel", {
        bot: bot.value.id,
        channel: newChanellData.value.id,
      });
    }

    delete newChanellData.value.id;
    const data = await api.post("/agents/api/add_channel", {
      bot: bot.value.id,
      data: newChanellData.value,
      type: selectedChanell.value,
    });
    bot.value.channels.push(data);

    newChanellData.value = {};
    isChanellOpen.value = false;

    openNotification("success", {
      message: `${t("Done")}!`,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
    };
    openNotification("error", opts);
  } finally {
    isChanellSaveLoading.value = false;
  }
};

const handleDeleteChanell = async () => {
  isChanellDeleteLoading.value = true;
  try {
    if (existingChanells.value.get(selectedChanell.value)) {
      await api.post("/agents/api/delete_channel", {
        bot: bot.value.id,
        channel: newChanellData.value.id,
      });
    }
    bot.value.channels = bot.value.channels.filter(
      (chanell) => chanell.ID != newChanellData.value.id
    );

    newChanellData.value = {};
    isChanellOpen.value = false;

    openNotification("success", {
      message: `${t("Done")}!`,
    });
  } catch (err) {
    const opts = {
      message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
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
      message: `Error: ${err?.response?.data?.message ?? "Unknown"}.`,
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
