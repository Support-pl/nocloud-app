<template>
	<div class="btn">
		<!-- <a-button block @click.stop="moduleEnter">{{$t('enter') | capitalize}}</a-button> -->
	</div>
</template>

<script>
export default {
	props: ['service'],
	methods: {
		moduleEnter(){
			// console.log(this.service);
			// const vms = this.$store.getters['cloud/getClouds']();
			// const id = vms.find( vm => vm.id_service == service.id).ID;
			// this.$router.push(`cloud-${id}`);
		}
	}
}
</script>

<style scoped>
.btn{
	margin-right: 20px;
}

.btn button{
	height: 100%;
}
</style>