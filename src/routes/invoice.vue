<template>
	<div class="invoices">
		<loading v-if="isLoading" />
		<div v-else class="container">

			<template>
				<empty v-if="invoices.length == 0"/>
				<div class="invoices__wrapper">
					<singleInvoice v-for='(invoice, index) in invoices' :key='index' :invoice='invoice'/>
				</div>
			</template>
		</div>
	</div>
</template>

<script>
import singleInvoice from "../components/appMain/invoice/singleInvoice.vue";
import loading from '../components/loading/loading.vue';
import empty from '../components/empty/empty.vue';
import { mapGetters } from 'vuex';

export default {
	name: 'invoices',
	components: {
		singleInvoice,
		loading,
		empty
	},
	computed: {
		user(){
			return this.$store.getters.getUser;
		},
		...mapGetters('invoices', {
			isLoading: 'isLoading',
			invoices: 'getInvoices'
		})
	},
	mounted(){
		this.$store.dispatch('invoices/autoFetch')
	}
}
</script>

<style>
.invoices{
	padding: 20px 10px 0;
	overflow: auto;
	height: 100%;
}

.invoices__wrapper{
	padding: 0 10px 20px;
}
</style>