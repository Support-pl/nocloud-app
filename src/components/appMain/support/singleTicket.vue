<template>
  <div class="ticket" @click="ticketClick(ticket.id)">
    <div
      class="ticket__status"
      :style="{ 'background-color': statusColor }"
    ></div>
    <div class="ticket__content">
      <div class="ticket__upper">
        <div class="ticket__title">
          <a-badge v-if="ticket.status == 'Answered'" dot>
            #{{ ticket.tid }} - {{ titleDecoded }}
          </a-badge>
          <template v-else> #{{ ticket.tid }} - {{ titleDecoded }} </template>
        </div>
        <div class="ticket__status-text">
          {{ $t(`ticketStatus.${ticket.status}`) }}
        </div>
      </div>
      <div class="ticket__lower">
        <div class="ticket__message">{{ beauty(ticket.message) }}</div>
        <div class="ticket__time">{{ formatDate(ticket.date) }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ticket",
  props: { ticket: Object },
  methods: {
    ticketClick(id) {
      this.$router.push("ticket-" + id);
    },
    beauty(message) {
      // return message
      message = this.decode(message);
      message = message.replace(/-{2,}.*/gi, "");
      message = message.replace(/IP Address.*/gi, "");
      return message;
    },
    formatDate(date) {
      const d = new Date(date.replace(/-/g, "/"));
      const ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
      const mo = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(d);
      const da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);
      const ho = new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        hour12: false,
      }).format(d);
      const mi = new Intl.DateTimeFormat("en", { minute: "2-digit" }).format(d);

      return `${da}/${mo}/${ye} ${ho <= 9 ? "0" + ho : ho}:${
        mi <= 9 ? "0" + mi : mi
      }`;
    },
    decode(text) {
      var txt = document.createElement("textarea");
      txt.innerHTML = text;
      return txt.value;
    },
  },
  computed: {
    statusColor() {
      let color = "";
      switch (this.ticket.status.toLowerCase()) {
        case "open":
          color = this.$config.colors.success;
          break;
        case "customer-reply":
          color = this.$config.colors.warn;
          break;
        case "closed":
          color = this.$config.colors.err;
          break;
        default:
          color = this.$config.colors.warn;
          break;
      }
      return color;
    },
    titleDecoded() {
      return this.decode(this.ticket.title);
    },
  }
}
</script>

<style>
.ticket {
  position: relative;
  padding: 15px 20px 15px 40px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: #fff;
  cursor: pointer;
}
.ticket:hover {
  background-color: rgba(255, 255, 255, 0.55);
}
.ticket:not(:last-child) {
  margin-bottom: 20px;
}
.ticket__upper {
  display: flex;
  justify-content: space-between;
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
.ticket__time {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.3);
  font-weight: 600;
  flex-shrink: 0;
}
</style>
