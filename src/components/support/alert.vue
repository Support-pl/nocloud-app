<template>
  <a-alert
    v-if="!isLoading"
    ref="notification"
    type="info"
    class="alert__notification"
  >
    <template #message>
      <div
        style="display: flex; justify-content: space-between"
        @click="isVisible = !isVisible"
      >
        <div>
          {{ capitalize($t("settings")) }}

          <span v-if="chat.gateways[0]">
            ({{ $t("gateway") }}:
            <span style="text-decoration: underline">
              {{ chat.gateways[0] }} </span
            >{{ chat.department === "openai" ? ";" : ")" }}
          </span>
        </div>
        <div>
          <plus-icon v-if="isVisible" :rotate="45" style="margin-left: auto" />
          <down-icon v-else style="margin-left: auto" />
        </div>
      </div>
    </template>

    <template v-if="isVisible" #description>
      <template v-if="options.length > 1">
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
          style="display: block; margin: 10px 0 0"
          :disabled="gateway === (chat.gateways[0] ?? '')"
          :loading="isEditLoading"
          @click="updateChat"
        >
          OK
        </a-button>
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
import { getImageName, onError } from "@/functions.js";
import { toRefs } from "vue";

const downIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/DownOutlined")
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
const gateway = ref("");

const isVisible = ref(false);
const isEditLoading = ref(false);
const notification = ref();

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

function changeGateway(value) {
  if (gateway.value === value) {
    gateway.value = "";
  } else {
    gateway.value = value;
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

onMounted(() => {
  if (localStorage.getItem("gateway")) {
    gateway.value = localStorage.getItem("gateway");
    isVisible.value = true;

    updateChat();
    localStorage.removeItem("gateway");
  }
});

function setOptions(value) {
  gateway.value = value.gateways[0] ?? "";
}

setOptions(props.chat);
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
