<template>
	<div class="module">
		<a-row :gutter='[10, 10]'>
			<a-col :md="12" :xs="24" :sm="12">
				<a-button size="large" type="primary" @click="moduleEnter" :disabled="service.status != 'Active'">{{$t('enter') | capitalize}}</a-button>
			</a-col>
		</a-row>
	</div>
</template>

<script>
export default {
	name: 'vm-draw',
	props: {
		service: {
			required: true
		}
	},
	methods: {
		moduleEnter() {
			const vms = this.$store.getters['cloud/getClouds'];
			const id = vms.find( vm => vm.id_service == this.service.id).ID;
			this.$router.push(`/cloud-${id}`);
		}
	}
}
</script>

<style>

</style>