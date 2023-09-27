<template>
  <div class="tickets">
    <loading v-if="isLoading" />
    <div v-else class="container">
      <empty v-if="chats.length === 0" />
      <div class="ticket__wrapper">
        <single-ticket v-for="(ticket, index) in chats" :key="index" :ticket="ticket" />
      </div>

      <add-ticket-field v-if="addTicketStatus" />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import store from '@/store'
import singleTicket from '@/components/appMain/support/singleTicket.vue'
import addTicketField from '@/components/appMain/support/addTicket.vue'
import loading from '@/components/loading/loading.vue'
import empty from '@/components/empty/empty.vue'
import { Status } from '@/libs/cc_connect/cc_pb'

const isLoading = computed(() =>
  store.getters['support/isLoading']
)
const tickets = computed(() =>
  store.getters['support/getTickets']
)
const addTicketStatus = computed(() =>
  store.getters['support/isAddTicketState']
)

const user = computed(() =>
  store.getters['nocloud/auth/userdata']
)

const chats = computed(() => {
  const chats = store.getters['nocloud/chats/getChats']
  const result = []
  const { uuid } = user.value

  chats.forEach((ticket) => {
    const isReaded = ticket.meta.lastMessage?.readers.includes(uuid)
    const status = Status[ticket.status].toLowerCase().split('_')
    const capitalized = status.map((el) =>
      `${el[0].toUpperCase()}${el.slice(1)}`
    ).join(' ')

    const value = {
      id: ticket.uuid,
      tid: ticket.uuid.slice(0, 8),
      title: ticket.topic,
      date: Number(ticket.meta.lastMessage?.sent ?? ticket.created),
      message: ticket.meta.lastMessage?.content ?? '',
      status: capitalized,
      unread: (isReaded) ? 0 : ticket.meta.unread
    }

    result.push(value)
  })

  result.sort((a, b) => b.date - a.date)

  return [...result, ...tickets.value]
})

onMounted(() => {
  store.dispatch('support/autoFetch')
  store.dispatch('nocloud/chats/fetchChats')
  store.dispatch('nocloud/chats/startStream')
})
</script>

<script>
export default { name: 'SupportView' }
</script>

<style>
  .tickets{
    overflow: auto;
    height: 100%;
    position: relative;
    padding-top: 20px;
  }

  .ticket__wrapper{
    height: 100%;
    overflow: auto;
    padding: 6px 10px 20px;
  }

  .ticket__add-enter-active.addTicket__wrapper,
  .ticket__add-leave-active.addTicket__wrapper {
    transition:
      opacity .2s ease;
  }
  .ticket__add-enter-active .addTicket,
  .ticket__add-leave-active .addTicket {
    transition:
      opacity .2s ease,
      transform .3s ease;
  }
  .ticket__add-enter-active,
  .ticket__add-leave-active {
    transition:
      all .4s ease,
  }

  .ticket__add-enter.addTicket__wrapper,
  .ticket__add-leave-to.addTicket__wrapper {
    opacity: 0;
  }
  .ticket__add-enter .addTicket,
  .ticket__add-leave-to .addTicket {
    opacity: 0;
    transform: translateX(-50%) translateY(100%) !important;
  }
</style>
