<template>
	<div class="cpanel">
		<iframe :src="link" width="800" height="600" frameborder="2"></iframe>
	</div>
</template>

<script>
import api from "@/api.js";

export default {
	name: 'cpanel',
	data: () => ({ link: '' }),
	created() {
    this.$store.dispatch('nocloud/auth/fetchBillingData')
      .then((user) => {
        api.get(`${this.baseURL}/cpanel.createSession.php`, { params: {
          serviceid: this.$route.params.serviceid, userid: user.client_id
        }})
          .then((res) => {
            const url = 'https://' + res.data.serverhostname + ":2083/login/?login_only=1";
            const fd = new FormData();

            fd.append('user', res.data.username);
            fd.append('pass', res.data.password);
            fd.append('goto_uri', '/');

            fetch(url, { body: fd, method: "post" })
              .then(() => { this.link = res.data.url })
              .catch(error => { throw error });
          })
          .catch((err) => console.error(err));
      })
      .catch((err) => console.error(err));
	},
  computed: {
    baseURL() {
      return this.$store.getters['products/getURL'];
    }
  }
}
</script>
