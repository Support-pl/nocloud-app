<template>
  <div class="ticket" @click="ticketClick(ticket.id)">
    <div
      class="ticket__status"
      :style="{ 'background-color': statusColor }"
    />
    <div class="ticket__content">
      <div class="ticket__upper">
        <div class="ticket__title">
          #{{ ticket.tid }} - {{ titleDecoded }}
        </div>
        <div class="ticket__status-text">
          <a-badge :count="ticket.unread" :offset="[10, -15]">
            {{ $t(`ticketStatus.${ticket.status}`) }}
          </a-badge>
        </div>
      </div>
      <div class="ticket__lower">
        <div class="ticket__message" v-html="beauty(ticket.message)" />
        <div class="ticket__time">
          {{ formatDate(ticket.date) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import config from '@/appconfig.js'

export default {
  name: 'TicketItem',
  props: {
    ticket: { type: Object, required: true },
    instanceId: { type: String, default: null }
  },
  computed: {
    statusColor () {
      switch (this.ticket.status.toLowerCase()) {
        case 'new':
          return config.colors.main
        case 'open':
          return config.colors.success
        case 'in progress':
        case 'customer-reply':
          return config.colors.warn
        case 'close':
        case 'closed':
          return config.colors.err
        default:
          return config.colors.gray
      }
    },
    titleDecoded () {
      return this.decode(this.ticket.title)
    }
  },
  methods: {
    ticketClick (id) {
      const query = { from: this.instanceId }

      this.$router.push({ path: `/ticket/${id}`, query })
    },
    beauty (message) {
      message = this.decode(message)
      message = message.replace(/-{2,}.*/gi, '')
      message = message.replace(/IP Address.*/gi, '')
      message = message.replace(/<\/?[a-z1-9 #-:=";_!]+>/gi, '')
      return message || 'empty'
    },
    formatDate (date) {
      const d = new Date((date.replace) ? date.replace(/-/g, '/') : date)
      const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(d)
      const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(d)
      const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(d)
      let ho = new Intl.DateTimeFormat('en', { hour: '2-digit', hour12: false }).format(d)
      let mi = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(d)

      if (`${ho}`.length < 2) ho = `${ho}0`
      if (`${mi}`.length < 2) mi = `${mi}0`
      return `${da}/${mo}/${ye} ${ho}:${mi}`
    },
    decode (text) {
      const txt = document.createElement('textarea')
      txt.innerHTML = text
      return txt.value
    }
  }
}
</script>

<style>
.ticket {
  position: relative;
  padding: 15px 20px 15px 40px;
  box-shadow: 5px 8px 10px rgba(0, 0, 0, 0.05);
  border-radius: 15px;
  background-color: var(--bright_font);
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