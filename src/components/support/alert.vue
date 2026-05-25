<template>
  <a-alert
    v-if="!isLoading"
    ref="notification"
    type="info"
    class="alert__notification"
  >
    <template #message>
      <div class="alert__header" @click="isVisible = !isVisible">
        <div class="alert__title">{{ ticketTitle }} - #{{ ticketNumber }}</div>
        <div>
          <plus-icon v-if="isVisible" :rotate="45" style="margin-left: auto" />
          <down-icon v-else style="margin-left: auto" />
        </div>
      </div>
    </template>

    <template v-if="isVisible" #description>
      <div class="ticket_info">
        <div class="ticket_info__row">
          <span class="ticket_info__label"
            >{{ capitalize($t("subject")) }}:</span
          >
          <span class="ticket_info__value">{{ ticketTitle }}</span>
        </div>
        <div class="ticket_info__row">
          <span class="ticket_info__label">ID:</span>
          <span class="ticket_info__value">#{{ ticketNumber }}</span>
        </div>
        <div class="ticket_info__row">
          <span class="ticket_info__label"
            >{{ capitalize($t("status")) }}:</span
          >
          <span class="ticket_info__value">{{ localizedStatus }}</span>
        </div>
        <div class="ticket_info__row">
          <span class="ticket_info__label">{{ capitalize($t("date")) }}:</span>
          <span class="ticket_info__value">{{ createdDate }}</span>
        </div>
      </div>
    </template>
  </a-alert>
</template>

<script setup>
import {
  watch,
  computed,
  ref,
  nextTick,
  defineAsyncComponent,
  capitalize,
} from "vue";
import { useI18n } from "vue-i18n";
import { Status } from "@/libs/cc_connect/cc_pb";

import { useChatsStore } from "@/stores/chats.js";
import { toDate } from "@/functions.js";
import { toRefs } from "vue";

const downIcon = defineAsyncComponent(
  () => import("@ant-design/icons-vue/DownOutlined"),
);
const plusIcon = defineAsyncComponent(() =>
  import("@ant-design/icons-vue/PlusCircleOutlined")
);

const props = defineProps({
  chat: { type: Object, required: true },
  isLoading: { type: Boolean, default: false },
});
const { chat } = toRefs(props);
const emits = defineEmits(["update:paddingTop"]);

const i18n = useI18n();
const chatsStore = useChatsStore();

watch(
  () => props.isLoading,
  (value) => {
    if (value) return;
    nextTick(() => {
      emits(
        "update:paddingTop",
        `${notification.value?.$el.offsetHeight + 15}px`,
      );
    });
  },
);

const isVisible = ref(false);
const notification = ref();

const ticketId = computed(() => props.chat?.uuid || props.chat?.id || "-");

const ticketNumber = computed(() => {
  if (ticketId.value === "-") return "-";
  return String(ticketId.value).slice(0, 8);
});

const ticketTitle = computed(() => props.chat?.topic || "-");

const ticketDepartment = computed(() => {
  const departmentId = props.chat?.meta?.data?.department;
  if (!departmentId) return "-";

  return (
    chatsStore.getDefaults.departments.find(({ id }) => id === departmentId)
      ?.name || departmentId
  );
});

const localizedStatus = computed(() => {
  const value = props.chat?.status;
  let label = "";

  if (typeof value === "number" && Status[value]) {
    label = Status[value]
      .toLowerCase()
      .split("_")
      .map((item) => `${item[0].toUpperCase()}${item.slice(1)}`)
      .join(" ");
  } else if (typeof value === "string") {
    label = value
      .toLowerCase()
      .replace(/[-_]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map((item) => `${item[0].toUpperCase()}${item.slice(1)}`)
      .join(" ");
  }

  if (!label) return "-";

  const translated = i18n.t(`ticketStatus.${label}`);
  return translated === `ticketStatus.${label}` ? label : translated;
});

function normalizeTimestamp(value) {
  const numeric = Number(value);
  if (!numeric) return 0;

  return numeric > 100000000000 ? Math.floor(numeric / 1000) : numeric;
}

const createdDate = computed(() =>
  toDate(normalizeTimestamp(props.chat?.created)),
);

const lastMessageDate = computed(() =>
  toDate(normalizeTimestamp(props.chat?.meta?.lastMessage?.sent)),
);
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

.alert__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.alert__title {
  max-width: calc(100% - 32px);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-weight: 600;
}

.ticket_info {
  display: grid;
  gap: 8px;
}

.ticket_info__row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
  line-height: 1.35;
}

.ticket_info__label {
  color: var(--gray);
  font-weight: 600;
}

.ticket_info__value {
  word-break: break-word;
}

@media (max-width: 768px) {
  .alert__notification {
    right: 15px;
    max-width: calc(100% - 30px);
  }
}

@media (max-width: 576px) {
  .ticket_info__row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}
</style>
