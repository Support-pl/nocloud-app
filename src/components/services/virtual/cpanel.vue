<template>
	<div class="cpanel">
		<iframe :src="link" width="800" height="600" frameborder="2"></iframe>
	</div>
</template>

<script>
import api from "@/api.js";

export default {
	name: 'cpanel',
	data(){
		return {
			link: ''
		}
	},
	created(){
		api.sendAsUser('cpanel.createSession', {
			serviceid: this.$route.params.serviceid
		})
		.then(res => {
			// console.log(res);
			const fd = new FormData();
			fd.append('user', res.data.username);
			fd.append('pass', res.data.password);
			fd.append('goto_uri', '/');

			const url = 'https://' + res.data.serverhostname + ":2083/login/?login_only=1";
			fetch(url, {
				body: fd,
				method: "post"
			})
			.then(result => {
				// console.log(result);
				this.link = res.data.url
			})
			.catch(error => {
				throw error;
			})
		})
		.catch(err => {
			console.error(err);
		})
	}
}
</script>

<style>

</style>