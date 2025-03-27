<template>
  <a-alert
    v-if="!isLoading"
    ref="notification"
    type="info"
    class="alert__notification"
  >
    <template #message>
      <span @click="isVisible = !isVisible">
        {{ capitalize($t("settings")) }}

        <span v-if="chat.gateways[0]">
          ({{ $t("gateway") }}:
          <span style="text-decoration: underline">
            {{ chat.gateways[0] }} </span
          >{{ chat.department === "openai" ? ";" : ")" }}
        </span>

        <span v-if="chat.department === 'openai'">
          {{ chat.gateways[0] ? "" : "(" }}{{ capitalize($t("prompts")) }}:

          <a-tooltip color="var(--bright_font)">
            <template #title>
              <a-list bordered size="small" :data-source="currentPrompts">
                <template #renderItem="{ item }">
                  <a-list-item>{{ item }}</a-list-item>
                </template>
              </a-list>
            </template>
            <listIcon style="margin-right: 2px" /> </a-tooltip
          >)
        </span>

        <plus-icon v-if="isVisible" :rotate="45" style="margin-left: auto" />
        <down-icon v-else style="margin-left: auto" />
      </span>
    </template>

    <template v-if="isVisible" #description>
      <div v-if="model" style="margin-bottom: 10px">
        {{ capitalize($t("model")) }}:
        <span> {{ model }} </span>
      </div>

      {{ $t("Choose another way of communication") }}:
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

      <template v-if="chat.department === 'openai'">
        <template v-if="promptsOptions.length > 0">
          {{ $t("Select prompts") }}:
        </template>
        <a-spin :spinning="isPromptsLoading">
          <a-checkbox-group
            v-model:value="prompts"
            class="alert__checkbox"
            style="margin-bottom: 15px"
            :options="promptsOptions"
            @change="selectPrompts"
          >
            <template #label="{ label, description }">
              <a-popover trigger="click" placement="bottom">
                {{ label }} <down-icon />
                <template #content>
                  {{ description }}
                </template>
              </a-popover>
            </template>
          </a-checkbox-group>
        </a-spin>

        {{ $t("Add prompt") }}:
        <a-input
          v-model:value="title"
          style="margin-bottom: 10px"
          :placeholder="`${capitalize($t('title'))}...`"
        />
        <a-textarea
          v-model:value="message"
          allow-clear
          :auto-size="{ minRows: 2, maxRows: 100 }"
          :placeholder="`${capitalize($t('description'))}...`"
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
          {{ $t("Add") }}
        </a-button>

        <a-popconfirm
          :title="$t('support_view.delet_chat.message')"
          :ok-text="$t('Confirm')"
          :cancel-text="$t('Cancel')"
          @confirm="deleteChat"
        >
          <a-button
            :loading="isDeleteLoading"
            style="margin-left: 10px"
            danger
            ghost
          >
            {{ capitalize($t("support_view.delet_chat.action")) }}
          </a-button>
        </a-popconfirm>
      </template>
    </template>
  </a-alert>
</template>

<script setup>
import {
  watch,
  computed,
  onMounted,
  ref,
  nextTick,
  defineAsyncComponent,
  capitalize,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";

import { useAuthStore } from "@/stores/auth.js";
import { useChatsStore } from "@/stores/chats.js";
import { useSupportStore } from "@/stores/support.js";

import { useNotification } from "@/hooks/utils";
import { getImageName, onError, generateUuid } from "@/functions.js";
import { toRefs } from "vue";

const downIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DownOutlined")
);
const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusOutlined")
);
const listIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/UnorderedListOutlined")
);

const props = defineProps({
  chat: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
});
const { chat } = toRefs(props);
const emits = defineEmits(["update:paddingTop"]);

const router = useRouter();
const route = useRoute();
const i18n = useI18n();
const { openNotification } = useNotification();

const authStore = useAuthStore();
const chatsStore = useChatsStore();
const supportStore = useSupportStore();

watch(
  () => props.isLoading,
  (value) => {
    if (value) return;
    nextTick(() => {
      emits(
        "update:paddingTop",
        `${notification.value?.$el.offsetHeight + 15}px`
      );
    });
  }
);

const title = ref("");
const message = ref("");
const gateway = ref("");

const isVisible = ref(false);
const isEditLoading = ref(false);
const isPromptLoading = ref(false);
const isPromptsLoading = ref(false);
const notification = ref();
const isDeleteLoading = ref(false);

watch(
  () => props.chat,
  (value) => {
    gateway.value = value.gateways[0] ?? "";

    if (value.meta.data.prompts) {
      const result = value.meta.data.prompts.toJSON();

      prompts.value = [];
      promptsOptions.value = [];
      result.forEach(({ enabled, title, description, id }) => {
        if (enabled) prompts.value.push(id);

        promptsOptions.value.push({ label: title, value: id, description });
      });
    }
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
const currentPrompts = computed(() =>
  (props.chat.meta?.data?.prompts?.toJSON() ?? [])
    .filter(({ enabled }) => enabled)
    .map(({ title }) => title)
);

const model = computed(() => {
  const model = chat.value?.meta?.data?.model?.toJSON() ?? "";

  return model ?? "";
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

async function selectPrompts() {
  isPromptsLoading.value = true;
  try {
    const result = props.chat.meta.data.prompts.toJSON();

    result.forEach(({ id }, i) => {
      const item = prompts.value.find((promptId) => id === promptId);

      result[i].enabled = !!item;
    });

    await chatsStore.editChat({
      ...props.chat,
      meta: {
        ...props.chat.meta,
        data: { ...props.chat.meta.data, prompts: result },
      },
    });
    openNotification("success", { message: i18n.t("Done") });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message: i18n.t(message) });
  } finally {
    isPromptsLoading.value = false;
  }
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
    openNotification("success", { message: i18n.t("Done") });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message: i18n.t(message) });
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

    openNotification("success", { message: i18n.t("Done") });
  } catch (error) {
    const message = error.response?.data?.message ?? error.message ?? error;

    openNotification("error", { message: i18n.t(message) });
  } finally {
    isEditLoading.value = false;
    supportStore.isAddingTicket = false;
  }
}

const deleteChat = async () => {
  isDeleteLoading.value = true;

  try {
    await chatsStore.deleteChat(chat.value);

    router.go(-1);
  } finally {
    isDeleteLoading.value = false;
  }
};

onMounted(() => {
  window.addEventListener("resize", () => {
    emits(
      "update:paddingTop",
      `${notification.value?.$el.offsetHeight + 15}px`
    );
  });
  emits("update:paddingTop", `${notification.value?.$el.offsetHeight + 15}px`);

  if (localStorage.getItem("gateway")) {
    gateway.value = localStorage.getItem("gateway");
    isVisible.value = true;

    updateChat();
    localStorage.removeItem("gateway");
  }
});

watch(isVisible, async (value) => {
  await nextTick();
  emits(
    "update:paddingTop",
    `${notification.value?.$el.offsetHeight + (value ? 30 : 0)}px`
  );
});

router.beforeEach((_, __, next) => {
  emits("update:paddingTop", `${notification.value?.$el.offsetHeight + 15}px`);
  next();
});
</script>

<script>
export default { name: "SupportAlert" };
</script>

<style scoped>
.alert__notification {
  position: absolute;
  right: max(25px, (100vw - 1148px) / 2);
  top: 87px;
  z-index: 10;
  width: 100%;
  max-width: min(65vw - 50px, 768px - 30px);
  transition: 0.3s;
}

.alert__notification.ant-alert-with-description {
  padding: 15px;
}

.alert__notification :deep(.ant-alert-message) > span {
  display: flex;
  justify-content: space-between;
  gap: 5px;
  font-size: 14px;
  cursor: pointer;
}

.order__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.order__slider-item {
  box-shadow: inset 0 0 0 1px var(--border_color);
  height: 100%;
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

.order__grid .order__slider-name > .img_prod {
  display: block;
  max-height: 20px;
}

.order__grid .order__slider-name {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.alert__checkbox {
  display: flex;
  flex-direction: column;
  margin-bottom: 5px;
}

.alert__checkbox > :deep(label) {
  white-space: break-spaces;
}

.alert__checkbox > :deep(label > .ant-checkbox) {
  align-self: flex-start;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .alert__notification {
    right: 15px;
    max-width: calc(100% - 30px);
  }
}

@media (max-width: 576px) {
  .order__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
