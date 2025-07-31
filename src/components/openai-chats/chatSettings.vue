<template>
  <div style="margin-bottom: 10px">
    {{ capitalize(t("model")) }}:
    <span>
      {{ model }}
    </span>
  </div>

  <template v-if="options.length > 1">
    {{ t("Choose another way of communication") }}:
    <div class="order__grid">
      <div
        v-for="gate of options"
        :key="gate.id"
        class="order__slider-item"
        :value="gate.id"
        :class="{ 'order__slider-item--active': gateway === gate.id }"
        @click="changeGateway(gate.id)"
      >
        <span class="order__slider-name" :title="gate.name">
          <img
            class="img_prod"
            :src="`/img/icons/${getImageName(gate.id)}.png`"
            :alt="gate.id"
            @error="onError"
          />
          {{ gate.name }}
        </span>
      </div>
    </div>

    <a-button
      type="primary"
      :style="`display: block; margin: 10px 0 ${
        promptsOptions.length > 0 ? '15px' : 0
      }`"
      :disabled="gateway === (chat.gateways[0] ?? '')"
      :loading="isEditLoading"
      @click="updateChat"
    >
      OK
    </a-button>
  </template>

  <template v-if="promptsOptions.length > 0">
    {{ t("Select prompts") }}:
  </template>
  <a-spin :spinning="isPromptsLoading">
    <a-checkbox-group
      v-model:value="prompts"
      class="alert__checkbox"
      style="margin-bottom: 15px"
      :options="promptsOptions"
      @change="() => selectPrompts()"
    >
      <template #label="{ label, description, value }">
        <div class="divider"></div>
        <div class="checkbox-item">
          <div class="text-wrap">
            <span class="label">{{ label }}</span>
            <span class="description"> — {{ description }}</span>
          </div>

          <a-button
            size="small"
            type="dashed"
            shape="circle"
            :icon="h(deleteIcon)"
            @click.capture.stop.prevent="deletePromt(value)"
          />
        </div>
      </template>
    </a-checkbox-group>
  </a-spin>

  {{ t("Add prompt") }}:
  <a-input
    v-model:value="title"
    style="margin-bottom: 10px"
    :placeholder="`${capitalize(t('title'))}...`"
  />
  <a-textarea
    v-model:value="message"
    allow-clear
    :auto-size="{ minRows: 2, maxRows: 100 }"
    :placeholder="`${capitalize(t('description'))}...`"
    @keyup.shift.enter.exact="newLine"
    @keydown.enter.exact.prevent="sendPrompt"
  />

  <a-button
    type="primary"
    style="margin-top: 10px"
    :disabled="message.trim().length < 2"
    :loading="isPromptLoading"
    @click="sendPrompt"
  >
    {{ t("Add") }}
  </a-button>

  <a-popconfirm
    :title="t('support_view.delet_chat.message')"
    :ok-text="t('Confirm')"
    :cancel-text="t('Cancel')"
    @confirm="deleteChat"
  >
    <a-button :loading="isDeleteLoading" style="margin-left: 10px" danger ghost>
      {{ capitalize(t("support_view.delet_chat.action")) }}
    </a-button>
  </a-popconfirm>
</template>

<script setup>
import { watch, computed, onMounted, ref, capitalize, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useSupportStore } from "@/stores/support.js";

import { useNotification } from "@/hooks/utils";
import { getImageName, onError, generateUuid } from "@/functions.js";
import { toRefs } from "vue";
import { storeToRefs } from "pinia";
import { query } from "vue-gtag";

const props = defineProps({
  chat: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
});
const { chat } = toRefs(props);

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const { openNotification } = useNotification();

const authStore = useAuthStore();
const chatsStore = useChatsStore();
const { globalModelsList } = storeToRefs(chatsStore);
const supportStore = useSupportStore();

const title = ref("");
const message = ref("");
const gateway = ref("");

const isEditLoading = ref(false);
const isPromptLoading = ref(false);
const isPromptsLoading = ref(false);
const isDeleteLoading = ref(false);

watch(
  () => props.chat,
  (value) => {
    setOptions(value);
  }
);

const options = computed(() => {
  const { gateways = [] } = chatsStore.getDefaults ?? {};
  let result = gateways.map((gateway) => ({
    id: gateway,
    name: `${gateway[0].toUpperCase()}${gateway.toLowerCase().slice(1)}`,
  }));

  if (route.query.from) {
    result = result.filter(({ id }) => id === "telegram");
  }

  return result;
});

const prompts = ref([]);
const promptsOptions = ref([]);

const model = computed(() => {
  return (
    globalModelsList.value.find(
      (model) => model.key === chat.meta?.data?.model?.kind?.value
    )?.name || chat.value.meta.data.model?.kind?.value
  );
});

function newLine() {
  message.value.replace(/$/, "\n");
}

function changeGateway(value) {
  if (gateway.value === value) {
    gateway.value = "";
  } else {
    gateway.value = value;
  }
}

async function selectPrompts(reduce = []) {
  isPromptsLoading.value = true;
  try {
    let result = props.chat.meta.data.prompts.toJSON();

    result.forEach(({ id }, i) => {
      const item = prompts.value.find((promptId) => id === promptId);

      result[i].enabled = !!item;
    });

    reduce.forEach((uuid) => {
      result = result.filter(({ id }) => uuid != id);
    });

    await chatsStore.editChat({
      ...props.chat,
      meta: {
        ...props.chat.meta,
        data: { ...props.chat.meta.data, prompts: result },
      },
    });
    openNotification("success", { message: t("Done") });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message: t(message) });
  } finally {
    isPromptsLoading.value = false;
  }
}

function deletePromt(value) {
  selectPrompts([value]);
}

async function sendPrompt() {
  isPromptLoading.value = true;
  try {
    const result = props.chat.meta.data.prompts
      ? props.chat.meta.data.prompts.toJSON()
      : [];

    result.push({
      id: generateUuid(),
      title: title.value,
      description: message.value,
      enabled: true,
    });

    await chatsStore.editChat({
      ...props.chat,
      meta: {
        ...props.chat.meta,
        data: { ...props.chat.meta.data, prompts: result },
      },
    });
    title.value = "";
    message.value = "";
    openNotification("success", { message: t("Done") });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message: t(message) });
  } finally {
    isPromptLoading.value = false;
  }
}

async function updateChat() {
  isEditLoading.value = true;
  if (!authStore.userdata.data.telegram) {
    router.push({ name: "handsfree" });
  }

  try {
    await chatsStore.changeGateway({
      ...props.chat,
      gateways: [gateway.value],
    });

    openNotification("success", { message: t("Done") });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message: t(message) });
  } finally {
    isEditLoading.value = false;
    supportStore.isAddingTicket = false;
  }
}

const deleteChat = async () => {
  isDeleteLoading.value = true;

  try {
    await chatsStore.deleteChat(chat.value);

    router.replace({ query: { create: true } });
  } finally {
    isDeleteLoading.value = false;
  }
};

onMounted(() => {
  if (localStorage.getItem("gateway")) {
    gateway.value = localStorage.getItem("gateway");

    updateChat();
    localStorage.removeItem("gateway");
  }
});

function setOptions(value) {
  gateway.value = value.gateways[0] ?? "";

  prompts.value = [];
  promptsOptions.value = [];
  if (value.meta.data.prompts) {
    const result = value.meta.data.prompts.toJSON();

    result.forEach(({ enabled, title, description, id }) => {
      if (enabled) prompts.value.push(id);

      promptsOptions.value.push({ label: title, value: id, description });
    });
  }
}

setOptions(props.chat);
</script>

<script>
export default { name: "SupportAlert" };
</script>

<style scoped>
.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider-item {
  box-shadow: inset 0 0 0 1px var(--border_color);
  padding: 7px 10px;
  cursor: pointer;
  border-radius: 15px;
  font-size: 1rem;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.order__slider-item:hover {
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.order__slider-item--active {
  background-color: var(--main);
  color: var(--gloomy_font);
}

.order__slider-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.img_prod {
  display: block;
  max-height: 20px;
}

.alert__checkbox {
  display: flex;
  flex-direction: column;
  margin-bottom: 5px;
}

.checkbox-item {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.text-wrap {
  flex: 1;
  word-break: break-word;
  white-space: normal;
  line-height: 1.4;
}

.label {
  font-weight: 500;
}

.description {
  color: #888;
}

.divider {
  width: 100%;
  height: 1px;
  background-color: var(--border_color);
  margin: 10px 0;
}

/* Ensure second span inside ant-checkbox-wrapper stretches full width */
:deep(.ant-checkbox-wrapper > span:nth-of-type(2)) {
  width: 100%;
  display: inline-block;
}

/* Optional margin for the first span (checkbox itself) */
:deep(.ant-checkbox-wrapper > span:nth-of-type(1)) {
  margin-top: 15px;
}

/* Responsive grid fallback */
@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
