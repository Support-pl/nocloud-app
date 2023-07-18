<template>
  <div class="tickets">
    <loading v-if="isLoading" />
    <div
      v-else
      class="container"
    >
      <empty v-if="chats.length === 0" />
      <div class="ticket__wrapper">
        <singleTicket
          v-for="(ticket, index) in chats"
          :key="index"
          :ticket="ticket"
        />
      </div>

      <addTicketField v-if="addTicketStatus" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import singleTicket from '@/widgets/appMain/support/singleTicket.vue'
import addTicketField from '@/widgets/appMain/support/addTicket.vue'
import loading from '@/widgets/loading/loading.vue'
import empty from '@/widgets/empty/empty.vue'

export default {
  name: 'Support',
  components: {
    singleTicket,
    loading,
    empty,
    addTicketField
  },
  computed: {
    ...mapGetters('support', {
      isLoading: 'isLoading',
      tickets: 'getTickets',
      addTicketStatus: 'isAddTicketState'
    }),
    user () {
      return this.$store.getters['nocloud/auth/userdata']
    },
    chats () {
      const chats = this.$store.getters['nocloud/chats/getChats']
      const result = []
      const { uuid } = this.user

      chats.forEach((ticket) => {
        const isReaded = ticket.meta.lastMessage?.readers.includes(uuid)
        const value = {
          id: ticket.uuid,
          tid: `${ticket.uuid.slice(0, 8)}...`,
          title: ticket.topic,
          date: Number(ticket.meta.lastMessage?.sent ?? ticket.created),
          message: ticket.meta.lastMessage?.content ?? '',
          status: 'Open',
          unread: (isReaded) ? 0 : ticket.meta.unread
        }

        result.push(value)
      })

      result.sort((a, b) => b.date - a.date)

      return [...result, ...this.tickets]
    }
  },
  mounted () {
    this.$store.dispatch('support/autoFetch')
    this.$store.dispatch('nocloud/chats/fetchChats')
    this.$store.dispatch('nocloud/chats/startStream')
  }
}
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
