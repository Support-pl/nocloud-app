<template>
	<div class="tickets">
		<loading v-if="isLoading" />
		<div v-else class="container">

			<template>
				<empty v-if="tickets.length == 0"/>
				<div class="ticket__wrapper">
					<singleTicket v-for='(ticket, index) in tickets' :key='index' :ticket='ticket'/>
				</div>
			</template>

			<addTicketField v-if="addTicketStatus"/>
		</div>
	</div>
</template>

<script>
import singleTicket from "@/components/appMain/support/singleTicket.vue";
import loading from '@/components/loading/loading.vue';
import empty from '@/components/empty/empty.vue';
import addTicketField from '@/components/appMain/support/addTicket.vue';
import { mapGetters } from 'vuex';

export default {
	name: 'support',
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
		})
	},
	mounted() {
		this.$store.dispatch("support/autoFetch");
    this.$store.dispatch("support/fetchChats");
	},
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
