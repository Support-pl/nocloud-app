<template>
  <div class="ticket" :class="{ compact }" @click="ticketClick(ticket.id)">
    <div class="ticket__status" :style="{ 'background-color': statusColor }" />
    <div class="ticket__content">
      <div class="ticket__upper">
        <div class="ticket__title">#{{ ticket.tid }} - {{ titleDecoded }}</div>
        <div class="ticket__department" style="margin-left: auto">
          {{ department }}
        </div>
        <div class="ticket__status-text">
          <a-badge :count="ticket.unread" :offset="offset">
            {{ $t(`ticketStatus.${ticket.status}`) }}
          </a-badge>
        </div>
      </div>
      <div class="ticket__lower">
        <div class="ticket__message">
          {{ beauty(ticket.message) }}
        </div>
        <div class="ticket__time">
          {{ toDate(ticket.date / 1000 || ticket.date, ".", "00:00") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useChatsStore } from "@/stores/chats.js";
import { toDate } from "@/functions.js";
import config from "@/appconfig.js";

const props = defineProps({
  ticket: { type: Object, required: true },
  instanceId: { type: String, default: null },
  compact: { type: Boolean, default: false },
});

const router = useRouter();
const route = useRoute();
const chatsStore = useChatsStore();

const offset = computed(() => {
  if (props.ticket.unread > 9) {
    return [4, -8];
  } else {
    return [10, -8];
  }
});

const statusColor = computed(() => {
  switch (props.ticket.status.toLowerCase()) {
    case "new":
      return config.colors.main;
    case "open":
      return config.colors.success;
    case "in progress":
    case "customer-reply":
      return config.colors.warn;
    case "close":
    case "closed":
      return config.colors.err;
    default:
      return config.colors.gray;
  }
});

const titleDecoded = computed(() => decode(props.ticket.title));

const department = computed(() => {
  const id = chatsStore.chats.get(props.ticket.id)?.department;

  return chatsStore.getDefaults.departments.find((dep) => dep.id === id)?.name;
});

function ticketClick(id) {
  const query = { ...route.query };

  if (props.instanceId) query.from = props.instanceId;
  router.push({ path: `/ticket/${id}`, query });
}

function beauty(message) {
  message = decode(message);
  message = message.replace(/-{2,}.*/gi, "");
  message = message.replace(/IP Address.*/gi, "");
  message = message.replace(/<\/?[a-zA-Zа-яА-Я1-9 #-:=";_!?]+>/gi, "");

  return message.trim() || "empty";
}

function decode(text) {
  const txt = document.createElement("textarea");

  txt.innerHTML = text;
  return txt.value;
}
</script>

<script>
export default { name: "TicketItem" };
</script>

<style scoped>
.ticket {
  position: relative;
  padding: 15px 20px 15px 40px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: var(--bright_font);
  cursor: pointer;
  transition: 0.2s;
}

.ticket:hover {
  filter: contrast(0.7);
  transition: 0.2s;
}

.ticket.compact {
  box-shadow: none;
  border-radius: 0;
}

.ticket:not(:last-child) {
  margin-bottom: 20px;
}

.ticket.compact:not(:last-child) {
  margin-bottom: 0;
  border-bottom: 1px solid var(--border_color);
}

.ticket__upper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.ticket__lower {
  display: flex;
  justify-content: space-between;
}

.ticket__status {
  width: 10px;
  height: 10px;
  position: absolute;
  border-radius: 50%;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
}

.ticket__message,
.ticket__title {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-right: 10px;
}

.ticket__title {
  font-weight: bold;
}

.ticket__department,
.ticket__time {
  font-size: 0.8rem;
  color: var(--gray);
  font-weight: 600;
  flex-shrink: 0;
}

.ticket__department {
  max-width: 140px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ticket__status-text {
  white-space: nowrap;
}
</style>
