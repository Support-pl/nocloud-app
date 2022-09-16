<template>
	<div class="module">
		<a-row :gutter='[10, 10]'>
			<a-col :md="12" :xs="24" :sm="12">
				<a-button
          size="large"
          type="primary"
          :disabled="service.status != 'Active'"
          @click="moduleEnter"
        >
          {{$t('enter') | capitalize}}
        </a-button>
			</a-col>
		</a-row>
	</div>
</template>

<script>
export default {
	name: 'vm-draw',
	props: { service: { required: true } },
	methods: {
		moduleEnter() {
			const vms = this.$store.getters['nocloud/vms/getInstances'];
			const { uuid } = vms.find((vm) => vm.uuidService === this.service.uuid);

			this.$router.push(`/cloud/${uuid}`);
		}
	}
}
</script>
