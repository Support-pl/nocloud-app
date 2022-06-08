<template>
	<div class="btn">
		<a-button block @click.stop="logIntoCpanel">{{$t('enter') | capitalize}}</a-button>
	</div>
</template>

<script>
import api from "@/api.js"

export default {
	props: ['service'],
	methods: {
		logIntoCpanel(){
			this.loginLoading = true;
			api.sendAsUser('cpanel.createSession', {
				serviceid: this.service.hostingid
			})
			.then(res => {
				if(res.result == 'error')
					throw res;
				if(res?.cpanelresult?.error){
					throw res;
				}
				window.open(res.data.url);
			})
			.catch(err => {
				console.error(err);
				if(err.message){
					this.$message.error(err.message);
				} else {
					this.$message.error('can\'t open cpanel');
				}
			})
			.finally(res => {
				this.loginLoading = false;
			})
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